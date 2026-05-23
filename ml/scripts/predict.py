"""
KrishiRakshak AI — Local Model Inference (alternative to Claude Vision)
=======================================================================
Use this ONLY if you have trained and downloaded the Kaggle model.
Otherwise, the main app uses Claude Vision API which is more accurate.

Usage:
    python predict.py path/to/leaf_image.jpg

Requirements:
    pip install tensorflow pillow numpy
    Download plant_disease_model.h5 and class_indices.json from your Kaggle run.
"""

import sys
import json
import numpy as np
from pathlib import Path

MODEL_PATH   = Path(__file__).parent.parent / "plant_disease_model.h5"
CLASSES_PATH = Path(__file__).parent.parent / "class_indices.json"
IMG_SIZE     = 224
TOP_K        = 3


def load_model():
    from tensorflow import keras
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}\n"
            "Train it on Kaggle first using ml/scripts/train.py\n"
            "Then download plant_disease_model.h5 and place it in the ml/ folder."
        )
    print(f"Loading model from {MODEL_PATH}...")
    return keras.models.load_model(str(MODEL_PATH))


def load_class_indices():
    if not CLASSES_PATH.exists():
        raise FileNotFoundError(f"class_indices.json not found at {CLASSES_PATH}")
    with open(CLASSES_PATH) as f:
        class_indices = json.load(f)
    return {v: k for k, v in class_indices.items()}  # idx → class_name


def predict_image(image_path: str, model, idx_to_class: dict) -> dict:
    from PIL import Image

    img = Image.open(image_path).convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)

    preds = model.predict(arr, verbose=0)[0]
    top_k = np.argsort(preds)[::-1][:TOP_K]

    results = []
    for idx in top_k:
        class_name = idx_to_class.get(idx, "Unknown")
        # Format: "Tomato___Late_blight" → "Tomato Late blight"
        parts = class_name.replace("___", " ").replace("_", " ").split(" ")
        crop    = parts[0] if parts else "Unknown"
        disease = " ".join(parts[1:]) if len(parts) > 1 else "Unknown"
        results.append({
            "class_raw":  class_name,
            "crop":       crop,
            "disease":    disease,
            "confidence": float(preds[idx]) * 100,
        })

    return {
        "top_prediction": results[0],
        "alternatives":   results[1:],
        "all_top_k":      results,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]
    if not Path(image_path).exists():
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)

    model        = load_model()
    idx_to_class = load_class_indices()
    result       = predict_image(image_path, model, idx_to_class)

    top = result["top_prediction"]
    print(f"\n{'='*50}")
    print(f"  Prediction: {top['crop']} — {top['disease']}")
    print(f"  Confidence: {top['confidence']:.1f}%")
    print(f"\n  Top {TOP_K} predictions:")
    for i, r in enumerate(result["all_top_k"], 1):
        print(f"  {i}. {r['crop']} {r['disease']}: {r['confidence']:.1f}%")
    print(f"{'='*50}")
