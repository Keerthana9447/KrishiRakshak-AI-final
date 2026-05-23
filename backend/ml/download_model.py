"""
KrishiRakshak AI — Model Downloader
=====================================
Downloads the PlantVillage MobileNetV2 model (~9 MB) from Hugging Face.

Run ONCE before starting the backend:
    cd backend
    python ml/download_model.py
"""

import sys
import json
from pathlib import Path

MODEL_DIR   = Path(__file__).parent / "models"
MODEL_HF_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"

LABELS = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

# Correct preprocessor_config.json for transformers 5.x
# The original model's preprocessor_config.json is missing "image_processor_type"
# We write our own corrected version alongside the downloaded files
PREPROCESSOR_CONFIG = {
    "image_processor_type": "MobileNetV2ImageProcessor",
    "do_normalize": True,
    "do_resize": True,
    "do_center_crop": True,
    "image_mean": [0.485, 0.456, 0.406],
    "image_std":  [0.229, 0.224, 0.225],
    "resample": 3,
    "size": {"shortest_edge": 256},
    "crop_size": {"height": 224, "width": 224}
}


def check_dependencies():
    missing = []
    for pkg, import_name in [("torch", "torch"), ("transformers", "transformers"),
                              ("pillow", "PIL"), ("torchvision", "torchvision")]:
        try:
            __import__(import_name)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"  ✗ Missing: {', '.join(missing)}")
        print(f"  Run: pip install {' '.join(missing)}")
        sys.exit(1)
    import torch, transformers
    print(f"  ✓ torch {torch.__version__}  |  transformers {transformers.__version__}")


def download():
    from transformers import AutoModelForImageClassification

    print(f"  Downloading from: {MODEL_HF_ID}")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    print("  Downloading model weights (~9 MB) ...")
    model = AutoModelForImageClassification.from_pretrained(MODEL_HF_ID)
    model.save_pretrained(str(MODEL_DIR))
    print("  ✓ Model saved")


def patch_preprocessor():
    """Write a corrected preprocessor_config.json that transformers 5.x can load."""
    path = MODEL_DIR / "preprocessor_config.json"
    with open(path, "w") as f:
        json.dump(PREPROCESSOR_CONFIG, f, indent=2)
    print("  ✓ preprocessor_config.json patched for transformers 5.x")


def save_labels():
    path = MODEL_DIR / "class_labels.json"
    with open(path, "w") as f:
        json.dump(LABELS, f, indent=2)
    print(f"  ✓ Labels saved ({len(LABELS)} classes)")


def verify():
    """Test inference using torchvision transforms (avoids broken HF image processor)."""
    import torch
    import numpy as np
    from PIL import Image
    from transformers import AutoModelForImageClassification

    print("\n  Verifying model ...")

    model = AutoModelForImageClassification.from_pretrained(str(MODEL_DIR))
    model.eval()

    # Load labels
    with open(MODEL_DIR / "class_labels.json") as f:
        labels = json.load(f)

    # Create a solid green test image (like a leaf)
    test_img = Image.fromarray(
        np.full((224, 224, 3), [34, 139, 34], dtype=np.uint8)
    )

    # Preprocess with torchvision (same transforms used at training)
    import torchvision.transforms as T
    transform = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]),
    ])

    tensor = transform(test_img).unsqueeze(0)  # [1, 3, 224, 224]

    with torch.no_grad():
        outputs = model(tensor)
        probs   = torch.softmax(outputs.logits, dim=-1)[0]
        top3    = torch.topk(probs, 3)

    print("  ✓ Model inference works! Test predictions:")
    for score, idx in zip(top3.values, top3.indices):
        label = labels[idx.item()] if idx.item() < len(labels) else f"class_{idx.item()}"
        print(f"    {label.replace('___', ' — ')}: {score.item()*100:.1f}%")


def main():
    print("=" * 60)
    print("  KrishiRakshak AI — Model Downloader")
    print("  PlantVillage MobileNetV2 (38 classes, 95.4% accuracy)")
    print("=" * 60)

    print("\n  Checking dependencies ...")
    check_dependencies()

    # Check if already downloaded
    weights_path      = MODEL_DIR / "pytorch_model.bin"
    safetensors_path  = MODEL_DIR / "model.safetensors"
    config_path       = MODEL_DIR / "config.json"
    already_have = config_path.exists() and (weights_path.exists() or safetensors_path.exists())

    if already_have:
        wpath = weights_path if weights_path.exists() else safetensors_path
        size  = wpath.stat().st_size / 1024 / 1024
        print(f"\n  ✓ Model weights already downloaded ({size:.1f} MB)")
    else:
        print()
        try:
            download()
        except Exception as e:
            print(f"\n  ✗ Download failed: {e}")
            print("\n  MANUAL DOWNLOAD:")
            print("  1. Go to: https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification/tree/main")
            print("  2. Download these 2 files:")
            print("     - config.json")
            print("     - pytorch_model.bin")
            print(f"  3. Place both files in:  {MODEL_DIR}")
            print("  4. Run this script again")
            sys.exit(1)

    # Always patch the preprocessor config (fixes transformers 5.x compatibility)
    patch_preprocessor()
    save_labels()

    # Verify
    try:
        verify()
    except Exception as e:
        print(f"\n  ✗ Verification failed: {e}")
        print("  The model files may be corrupt. Delete the models/ folder and re-run.")
        sys.exit(1)

    wpath = weights_path if weights_path.exists() else safetensors_path
    size  = wpath.stat().st_size / 1024 / 1024

    print(f"\n{'=' * 60}")
    print(f"  ✅ Model ready!")
    print(f"  Size:     {size:.1f} MB")
    print(f"  Location: {MODEL_DIR}")
    print(f"\n  Start the backend:")
    print(f"    python main.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
