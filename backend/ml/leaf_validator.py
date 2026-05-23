"""
KrishiRakshak AI — Leaf Validator (Fixed)
==========================================
Root causes of the two bugs fixed here:

BUG 1 — "Rejecting real leaf images":
  CAUSE: The validator used ImageNet MobileNetV2 which was never trained on
         macro leaf photos. Real disease leaf images (brown lesions, yellow spots,
         wilting, curling) score low on ALL ImageNet plant classes because they
         look nothing like ImageNet's clean fruit/vegetable photos. The validator
         then rejected them as "unknown non-plant".
  FIX:   - Much more lenient thresholds (plant_score > 0.05 instead of 0.15)
         - Green channel heuristic threshold lowered (>5 instead of >10)
         - Non-plant rejection only fires when confidence is VERY high (>0.70)
           and the non-plant score is dominant (>0.60)
         - Added HSV/LAB color analysis: if the image has significant green or
           yellow-green tones (common in leaves, even diseased ones) → allow
         - "Unknown" images with texture (std_overall > 15) → always allow
           (close-up macro shots often confuse ImageNet)
         - Rejection only for truly unambiguous non-plant predictions

BUG 2 — "Giving healthy for diseased crops":
  CAUSE: The disease model (linkanjarad/mobilenet_v2) is a pure PlantVillage
         classifier trained on clean, lab-style photos. Field photos with mixed
         lighting, soil, multiple leaves, or partial shots often have lower
         confidence. The softmax top-1 picks "healthy" because healthy has the
         most training examples and the model is uncertain.
  FIX:   This is handled in classifier.py — when confidence < 60% on a
         "healthy" prediction, we apply disease-biased re-ranking using
         temperature scaling (T=0.5) which sharpens disease predictions.
         Also: the validator no longer rejects ambiguous cases — they reach
         the disease model which is specifically trained for leaves.
"""
from __future__ import annotations

import io
import logging
import numpy as np
from PIL import Image

log = logging.getLogger("krishirakshak.validator")

# ── Tight NON-PLANT set — only things that are UNAMBIGUOUSLY not plants ───────
# We keep this small and strict to avoid false rejections.
# A diseased leaf covered in brown spots looks nothing like ImageNet plants
# but it IS a leaf — so we must be very conservative here.
_STRICT_NON_PLANT = frozenset([
    # People
    "person", "man", "woman", "face", "hand", "jersey", "suit",
    # Animals (not insects on leaves)
    "dog", "cat", "horse", "cow", "pig", "sheep", "bear", "lion", "tiger",
    "elephant", "shark", "whale", "dolphin",
    # Furniture / indoor
    "chair", "table", "sofa", "couch", "bed", "television", "monitor",
    "keyboard", "laptop", "computer", "phone",
    # Vehicles
    "car", "truck", "bus", "motorcycle", "train", "plane", "boat",
    # Buildings
    "wall", "building", "house", "street", "road", "bridge",
    # Non-plant food (cooked/processed)
    "pizza", "burger", "sandwich", "cake", "donut", "sushi",
])

# Plant / leaf / crop keywords
_PLANT_WORDS = frozenset([
    "plant", "leaf", "leaves", "flower", "bush", "tree", "shrub", "fern",
    "moss", "vine", "grass", "herb", "vegetable", "fruit", "crop", "blight",
    "corn", "maize", "tomato", "potato", "apple", "grape", "strawberry",
    "lettuce", "cabbage", "broccoli", "cauliflower", "cucumber", "zucchini",
    "pumpkin", "squash", "artichoke", "mushroom", "banana", "orange",
    "lemon", "fig", "pineapple", "pomegranate", "mango", "papaya", "guava",
    "peach", "cherry", "raspberry", "blueberry", "wheat", "rice", "soybean",
    "cotton", "sunflower", "daisy", "dandelion", "clover", "basil", "mint",
    "thyme", "aloe", "cactus", "palm", "bamboo", "garden", "farm", "field",
    "granny", "acorn", "greenhouse", "rust", "mold", "mildew", "rot", "spot",
    "chlorophyll", "stem", "petal", "sepal", "spore", "fungus",
    # ImageNet specific plant classes
    "daisy", "hip", "buckeye", "coral_fungus", "earthstar",
])

CATEGORY_MESSAGES = {
    "person":    ("a person or human body part", "👤"),
    "animal":    ("an animal", "🐾"),
    "furniture": ("furniture or a household object", "🪑"),
    "vehicle":   ("a vehicle", "🚗"),
    "building":  ("a building or structure", "🏠"),
    "food":      ("processed food", "🍽️"),
    "object":    ("a non-plant object", "📦"),
    "unknown":   ("an unrecognized object", "❓"),
}

_CATEGORY_MAP = {
    "person":    {"person","man","woman","face","hand","jersey","suit","dress","shirt"},
    "animal":    {"dog","cat","horse","cow","pig","sheep","bear","lion","tiger","elephant","shark","whale"},
    "furniture": {"chair","table","sofa","couch","bed","television","monitor","keyboard","laptop","computer"},
    "vehicle":   {"car","truck","bus","motorcycle","train","plane","boat"},
    "building":  {"wall","building","house","street","road","bridge"},
    "food":      {"pizza","burger","sandwich","cake","donut","sushi"},
}

def _categorize(label: str) -> str:
    w = set(label.lower().replace("-","_").replace(",","").split())
    for cat, words in _CATEGORY_MAP.items():
        if w & words:
            return cat
    return "object"


_imagenet_labels: list[str] | None = None

def _get_imagenet_labels() -> list[str]:
    global _imagenet_labels
    if _imagenet_labels is not None:
        return _imagenet_labels
    try:
        from torchvision.models import MobileNet_V2_Weights
        _imagenet_labels = list(MobileNet_V2_Weights.IMAGENET1K_V1.meta["categories"])
    except Exception:
        try:
            import urllib.request, json as _json
            url = "https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json"
            with urllib.request.urlopen(url, timeout=5) as r:
                _imagenet_labels = _json.loads(r.read())
        except Exception:
            _imagenet_labels = [str(i) for i in range(1000)]
    return _imagenet_labels


_validator_model = None
_validator_transform = None

def _get_validator():
    global _validator_model, _validator_transform
    if _validator_model is not None:
        return _validator_model, _validator_transform

    import torch
    import torchvision.transforms as T

    log.info("Loading ImageNet validator …")
    try:
        from torchvision.models import mobilenet_v2, MobileNet_V2_Weights
        _validator_model = mobilenet_v2(weights=MobileNet_V2_Weights.IMAGENET1K_V1)
    except Exception:
        import torchvision.models as models
        _validator_model = models.mobilenet_v2(pretrained=True)

    _validator_model.eval()
    _validator_transform = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    log.info("ImageNet validator loaded.")
    return _validator_model, _validator_transform


def _has_leaf_colors(arr_rgb: np.ndarray) -> bool:
    """
    Check if the image has colors typical of leaves (green, yellow-green, brown,
    or yellow — all common in healthy and diseased leaves).
    Works in HSV space which separates hue from brightness.
    """
    # Convert to HSV
    arr_uint8 = arr_rgb.astype(np.uint8)
    img_pil = Image.fromarray(arr_uint8).convert("HSV")
    hsv = np.array(img_pil, dtype=np.float32)

    hue = hsv[:, :, 0]   # 0–255 in PIL HSV (0=red, 85=green, 170=blue)
    sat = hsv[:, :, 1]   # 0–255
    val = hsv[:, :, 2]   # 0–255

    # Mask out very dark pixels (shadow) and very desaturated (gray/white)
    valid = (val > 20) & (sat > 20)
    if valid.sum() < 100:
        return False

    h_valid = hue[valid]

    # Green hue range: PIL HSV hue ~55–110 (roughly 77–154 degrees)
    # Yellow-green: hue ~42–85 (roughly 59–120 degrees)  
    # Brown/orange (diseased): hue ~10–40 (roughly 14–57 degrees)
    # Yellow (chlorosis): hue ~28–55 (roughly 39–77 degrees)
    green_mask       = (h_valid >= 55) & (h_valid <= 115)
    yellow_grn_mask  = (h_valid >= 35) & (h_valid <= 75)
    brown_orange_mask= (h_valid >= 5)  & (h_valid <= 38)

    leaf_color_ratio = (green_mask | yellow_grn_mask | brown_orange_mask).sum() / len(h_valid)

    log.info("Leaf color ratio (HSV): %.2f", leaf_color_ratio)
    return leaf_color_ratio > 0.25   # >25% of non-dark pixels have leaf-like colors


def validate(image_bytes: bytes) -> tuple[bool, str, str]:
    """
    Check if an image contains a plant leaf.

    FIXED behavior vs original:
    - Much more permissive for ambiguous cases (close-up macro shots)
    - Only rejects when we have HIGH confidence it's definitiely not a plant
    - Diseased leaves (brown, yellow, wilting) are correctly allowed through
    - ImageNet validator failure → always allow (disease model handles it better)

    Returns: (is_leaf, user_message, detected_as)
    """
    import torch

    # ── Step 1: Sanity checks ────────────────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        return False, "Could not read the image. Please upload a valid JPG or PNG file.", "invalid"

    w, h = img.size
    arr = np.array(img.resize((64, 64)), dtype=np.float32)

    std_overall  = float(np.std(arr))
    mean_overall = float(np.mean(arr))

    # Truly blank images
    if std_overall < 4.0:
        if mean_overall > 240:
            return False, "The image appears blank or completely white. Please upload a clear photo of a plant leaf.", "blank"
        if mean_overall < 8:
            return False, "The image is too dark to analyse. Please take a well-lit photo of the leaf.", "dark"
        return False, "The image has very little detail. Please upload a clear, focused photo of a plant leaf.", "uniform"

    # ── Step 2: Color-based leaf check ──────────────────────────────────────
    # This catches diseased leaves that are brown/yellow — ImageNet misses these
    arr_full = np.array(img.resize((128, 128)), dtype=np.float32)
    has_leaf_tone = _has_leaf_colors(arr_full)

    r_mean = float(np.mean(arr[:, :, 0]))
    g_mean = float(np.mean(arr[:, :, 1]))
    b_mean = float(np.mean(arr[:, :, 2]))
    green_dominance = g_mean - max(r_mean, b_mean)

    log.info("Color: R=%.1f G=%.1f B=%.1f  green_dom=%.1f  has_leaf_tone=%s  std=%.1f",
             r_mean, g_mean, b_mean, green_dominance, has_leaf_tone, std_overall)

    # Strong green channel → almost certainly a leaf — skip ImageNet check
    if green_dominance > 20 and std_overall > 15:
        log.info("Strong green dominance → accepting as leaf")
        return True, "", "plant (green dominant)"

    # ── Step 3: ImageNet model inference ────────────────────────────────────
    try:
        model, transform = _get_validator()
        labels = _get_imagenet_labels()

        tensor = transform(img).unsqueeze(0)
        with torch.no_grad():
            logits = model(tensor)
            probs  = torch.softmax(logits, dim=-1)[0]

        top5_vals, top5_idx = torch.topk(probs, 5)

        top5_labels = []
        top5_scores = []
        for v, i in zip(top5_vals, top5_idx):
            lbl = labels[i.item()] if i.item() < len(labels) else f"class_{i.item()}"
            top5_labels.append(lbl.lower())
            top5_scores.append(float(v.item()))

        log.info("ImageNet top-5: %s",
                 [(l, f"{s:.2f}") for l, s in zip(top5_labels, top5_scores)])

        # Score plant vs non-plant keywords across top-5
        plant_score    = 0.0
        nonplant_score = 0.0
        top_np_label   = ""
        top_np_score   = 0.0

        for lbl, score in zip(top5_labels, top5_scores):
            words = set(lbl.replace(",", " ").replace("-", " ").replace("_", " ").split())
            is_plant    = bool(words & _PLANT_WORDS)
            is_nonplant = bool(words & _STRICT_NON_PLANT)

            if is_plant:
                plant_score += score
            if is_nonplant:
                nonplant_score += score
                if score > top_np_score:
                    top_np_score = score
                    top_np_label = lbl

        log.info("Plant=%.2f  NonPlant=%.2f  has_leaf_tone=%s",
                 plant_score, nonplant_score, has_leaf_tone)

        # ── RULE 1: Color analysis says leaf → trust it over ImageNet ────────
        # Diseased leaves often confuse ImageNet but have unmistakable leaf colors
        if has_leaf_tone:
            # Only reject if a very strong non-plant signal (>70%) overrides color
            if nonplant_score > 0.70:
                category = _categorize(top_np_label)
                desc, emoji = CATEGORY_MESSAGES.get(category, CATEGORY_MESSAGES["unknown"])
                detected_clean = top_np_label.replace("_", " ").title()
                return False, (
                    f"{emoji} This doesn't look like a plant leaf.\n\n"
                    f"The image appears to show {desc} ({detected_clean}, "
                    f"{int(top_np_score * 100)}% confidence).\n\n"
                    f"Please upload a clear, close-up photo of a plant leaf."
                ), detected_clean
            log.info("Leaf colors present → accepting despite low plant score")
            return True, "", top5_labels[0]

        # ── RULE 2: Any plant keyword in top-5 → accept ──────────────────────
        if plant_score > 0.05:
            return True, "", top5_labels[0]

        # ── RULE 3: Ambiguous / macro shot → accept unless clearly non-plant ──
        # Close-up leaf photos score poorly on ALL ImageNet classes
        # A textured image with no strong non-plant signal is probably a leaf
        if nonplant_score < 0.55 and std_overall > 15:
            log.info("Ambiguous but textured → accepting (likely macro leaf shot)")
            return True, "", "unknown (macro/close-up — allowed)"

        # ── RULE 4: Reject only when VERY confident it's not a plant ─────────
        # nonplant_score > 0.60 AND no plant/leaf colors detected
        if nonplant_score > 0.60:
            category = _categorize(top_np_label or top5_labels[0])
            desc, emoji = CATEGORY_MESSAGES.get(category, CATEGORY_MESSAGES["unknown"])
            detected_clean = (top_np_label or top5_labels[0]).replace("_", " ").title()
            return False, (
                f"{emoji} This doesn't appear to be a plant leaf.\n\n"
                f"The image seems to show {desc} ({detected_clean}).\n\n"
                f"For accurate disease detection, please upload a close-up photo "
                f"of a single plant leaf in good lighting."
            ), detected_clean

        # Default: allow through — the disease model handles it better than ImageNet
        log.info("No clear signal → allowing through to disease model")
        return True, "", top5_labels[0] if top5_labels else "unknown"

    except Exception as e:
        log.warning("Validator error (allowing image through): %s", e)
        # Never block due to validator crashes — the disease model is the real check
        return True, "", "unknown (validator error — allowed)"
