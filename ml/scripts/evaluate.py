"""
KrishiRakshak AI — Model Evaluation Script
===========================================
Usage:
    python evaluate.py --model ./ml/models/krishirakshak_model.h5 \
                       --data_dir ./ml/datasets/PlantVillage
"""
import argparse
import json
import numpy as np
from pathlib import Path


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--model",    default="./ml/models/krishirakshak_model.h5")
    p.add_argument("--data_dir", default="./ml/datasets/PlantVillage")
    p.add_argument("--batch",    type=int, default=32)
    p.add_argument("--img_size", type=int, default=224)
    return p.parse_args()


def main():
    args = parse_args()
    try:
        import tensorflow as tf
    except ImportError:
        print("[ERROR] TensorFlow not installed. Run: pip install tensorflow")
        return

    model_path = Path(args.model)
    if not model_path.exists():
        print(f"[ERROR] Model not found: {model_path}")
        return

    print(f"[INFO] Loading model from {model_path} …")
    model = tf.keras.models.load_model(str(model_path))

    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"[ERROR] Dataset not found: {data_dir}")
        return

    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=0.2,
    )
    val_gen = datagen.flow_from_directory(
        data_dir, target_size=(args.img_size, args.img_size),
        batch_size=args.batch, class_mode="categorical", subset="validation",
        shuffle=False,
    )

    print("[INFO] Evaluating on validation set …")
    loss, acc = model.evaluate(val_gen, verbose=1)
    print(f"\n  Validation loss:     {loss:.4f}")
    print(f"  Validation accuracy: {acc * 100:.2f}%")

    # Per-class accuracy
    print("\n[INFO] Computing per-class accuracy …")
    preds = model.predict(val_gen, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = val_gen.classes

    class_names = list(val_gen.class_indices.keys())
    from sklearn.metrics import classification_report, confusion_matrix
    print("\n--- Classification Report ---")
    print(classification_report(y_true, y_pred, target_names=class_names))


if __name__ == "__main__":
    main()
