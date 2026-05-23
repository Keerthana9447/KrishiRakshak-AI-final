"""
KrishiRakshak AI — Real Model Training Script
==============================================
Trains MobileNetV2 on PlantVillage + Rice Disease + background (non-plant) images.
The trained model is used as a local fallback when no Gemini/Claude API key is set.

STEP 1 — Download Kaggle datasets:
  pip install kaggle
  # Set up ~/.kaggle/kaggle.json first (download from kaggle.com/account)

  # Primary: PlantVillage (87,000 images, 38 crop disease classes)
  kaggle datasets download -d abdallahalidev/plantvillage-dataset
  unzip plantvillage-dataset.zip -d ml/datasets/PlantVillage

  # Rice diseases (additional rice-specific diseases)
  kaggle datasets download -d minhhuy2810/rice-diseases-image-dataset
  unzip rice-diseases-image-dataset.zip -d ml/datasets/RiceDisease

  # Non-plant / background images (CRITICAL for rejecting walls/chairs/etc)
  kaggle datasets download -d puneet6060/intel-image-classification
  unzip intel-image-classification.zip -d ml/datasets/IntelImages
  # This has: buildings, forest, glacier, mountain, sea, street
  # Use all non-forest classes as "not_a_plant"

STEP 2 — Run training:
  pip install tensorflow pillow numpy scikit-learn matplotlib
  python ml/scripts/train.py --data_dir ml/datasets --epochs 25

STEP 3 — Model is saved to:
  ml/models/model.h5
  ml/models/class_labels.json

The backend automatically uses the model when it exists.
"""
import argparse
import json
import shutil
import random
from pathlib import Path
import numpy as np


def parse_args():
    p = argparse.ArgumentParser(description="Train KrishiRakshak plant disease classifier")
    p.add_argument("--data_dir",  default="ml/datasets",   help="Root dir with dataset subdirs")
    p.add_argument("--model_dir", default="ml/models",     help="Output dir for model + labels")
    p.add_argument("--epochs",    type=int, default=25)
    p.add_argument("--batch",     type=int, default=32)
    p.add_argument("--img_size",  type=int, default=224)
    p.add_argument("--val_split", type=float, default=0.2)
    return p.parse_args()


def build_merged_dataset(data_dir: Path, merged_dir: Path) -> int:
    """Merge all datasets into a single directory structure for Keras ImageDataGenerator."""
    merged_dir.mkdir(parents=True, exist_ok=True)
    total = 0

    # 1. PlantVillage
    pv = data_dir / "PlantVillage"
    if pv.exists():
        for cls_dir in sorted(pv.iterdir()):
            if not cls_dir.is_dir(): continue
            target = merged_dir / cls_dir.name
            target.mkdir(exist_ok=True)
            for img in cls_dir.glob("*.[jp][pn][g]*"):
                dest = target / img.name
                if not dest.exists():
                    shutil.copy2(img, dest)
                    total += 1
        print(f"PlantVillage: merged ({total} images so far)")

    # 2. Rice Disease — prefix with Rice___
    rice = data_dir / "RiceDisease"
    if rice.exists():
        rc = 0
        for cls_dir in sorted(rice.iterdir()):
            if not cls_dir.is_dir(): continue
            cls_name = cls_dir.name if cls_dir.name.startswith("Rice___") else f"Rice___{cls_dir.name}"
            target = merged_dir / cls_name
            target.mkdir(exist_ok=True)
            for img in cls_dir.glob("*.[jp][pn][g]*"):
                dest = target / img.name
                if not dest.exists():
                    shutil.copy2(img, dest)
                    rc += 1
        total += rc
        print(f"RiceDisease: +{rc} images")

    # 3. Intel Images — use non-forest classes as "not_a_plant" for OOD rejection
    intel = data_dir / "IntelImages"
    if intel.exists():
        ood_target = merged_dir / "not_a_plant"
        ood_target.mkdir(exist_ok=True)
        ood_count = 0
        # Exclude 'forest' class — trees/plants look like plant images
        excluded = {"forest"}
        for cls_dir in intel.rglob("*"):
            if not cls_dir.is_dir() or cls_dir.name.lower() in excluded: continue
            imgs = list(cls_dir.glob("*.[jp][pn][g]*"))
            random.shuffle(imgs)
            for img in imgs[:300]:  # max 300 per category to keep balanced
                dest = ood_target / f"{cls_dir.name}_{img.name}"
                if not dest.exists():
                    shutil.copy2(img, dest)
                    ood_count += 1
        total += ood_count
        print(f"not_a_plant (OOD): +{ood_count} images")

    print(f"\nTotal merged: {total} images in {len(list(merged_dir.iterdir()))} classes")
    return total


def train(args):
    import tensorflow as tf
    import matplotlib.pyplot as plt

    data_dir  = Path(args.data_dir)
    model_dir = Path(args.model_dir)
    model_dir.mkdir(parents=True, exist_ok=True)

    merged_dir = data_dir / "merged"
    print("Step 1: Merging datasets...")
    build_merged_dataset(data_dir, merged_dir)

    print("\nStep 2: Loading data generators...")
    aug = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0/255,
        validation_split=args.val_split,
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.25,
        horizontal_flip=True,
        brightness_range=[0.75, 1.3],
        fill_mode="reflect",
    )

    train_gen = aug.flow_from_directory(
        merged_dir,
        target_size=(args.img_size, args.img_size),
        batch_size=args.batch,
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )
    val_gen = aug.flow_from_directory(
        merged_dir,
        target_size=(args.img_size, args.img_size),
        batch_size=args.batch,
        class_mode="categorical",
        subset="validation",
    )

    num_classes = len(train_gen.class_indices)
    print(f"Classes: {num_classes}  |  Train: {train_gen.samples}  |  Val: {val_gen.samples}")

    # Save class labels
    label_map = {str(v): k for k, v in train_gen.class_indices.items()}
    with open(model_dir / "class_labels.json", "w") as f:
        json.dump(label_map, f, indent=2)
    print(f"Labels saved → {model_dir}/class_labels.json")

    print("\nStep 3: Building MobileNetV2 model...")
    base = tf.keras.applications.MobileNetV2(
        input_shape=(args.img_size, args.img_size, 3),
        include_top=False, weights="imagenet",
    )
    base.trainable = False

    model = tf.keras.Sequential([
        base,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(512, activation="relu"),
        tf.keras.layers.Dropout(0.4),
        tf.keras.layers.Dense(256, activation="relu"),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(num_classes, activation="softmax"),
    ])

    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=6, restore_best_weights=True, monitor="val_accuracy"),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.3, patience=3, monitor="val_loss"),
        tf.keras.callbacks.ModelCheckpoint(
            str(model_dir / "model_best.h5"), save_best_only=True, monitor="val_accuracy"
        ),
    ]

    # Phase 1: Head only
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="categorical_crossentropy", metrics=["accuracy"]
    )
    print("\n[Phase 1] Training classification head...")
    h1 = model.fit(train_gen, validation_data=val_gen,
                   epochs=min(args.epochs // 2, 10), callbacks=callbacks)

    # Phase 2: Fine-tune top 50 base layers
    base.trainable = True
    for layer in base.layers[:-50]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="categorical_crossentropy", metrics=["accuracy"]
    )
    print("\n[Phase 2] Fine-tuning top 50 MobileNetV2 layers...")
    h2 = model.fit(train_gen, validation_data=val_gen,
                   epochs=args.epochs, callbacks=callbacks,
                   initial_epoch=len(h1.history["loss"]))

    # Save final model
    out = model_dir / "model.h5"
    model.save(str(out))
    print(f"\n✅ Model saved → {out}")
    print(f"   Classes: {num_classes}  (includes 'not_a_plant' for OOD rejection)")

    # Training curve
    acc = h1.history["accuracy"] + h2.history["accuracy"]
    val = h1.history["val_accuracy"] + h2.history["val_accuracy"]
    plt.figure(figsize=(10, 4))
    plt.plot(acc, label="Train"); plt.plot(val, label="Val")
    plt.title(f"Accuracy — final val: {val[-1]*100:.1f}%")
    plt.legend(); plt.grid(alpha=0.3)
    plt.savefig(str(model_dir / "training_curve.png"), dpi=120)
    print(f"   Final val accuracy: {val[-1]*100:.1f}%")
    print(f"   Training curve → {model_dir}/training_curve.png")


if __name__ == "__main__":
    train(parse_args())
