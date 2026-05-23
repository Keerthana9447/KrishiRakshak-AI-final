# 🌱 KrishiRakshak AI — Smart Crop Disease Detection
### No API Key Required • 100% Local Inference • Real AI Predictions

Disease detection runs **completely on your machine** using a pre-trained MobileNetV2 CNN
fine-tuned on 54,305 PlantVillage leaf images (38 disease classes, **95.4% accuracy**).
No internet needed after the one-time model download.

---

## 🚀 Setup (3 steps)

### Step 1 — Install dependencies
```bash
cd backend
pip install -r requirements.txt
```
> ⚠ `torch` + `transformers` are ~500 MB. Use a venv to keep things clean:
> `python -m venv venv && venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)

### Step 2 — Download the model (one-time, ~9 MB)
```bash
python ml/download_model.py
```
Downloads MobileNetV2 from Hugging Face into `backend/ml/models/`. Takes ~15 seconds.

### Step 3 — Run
```bash
# Backend
python main.py

# Frontend (separate terminal)
cd ../frontend
npm install && npm run dev
```

Open http://localhost:8000 to confirm:
```json
{
  "services": {
    "disease_detection": "✓ MobileNetV2 (95.4% acc, local)",
    "weather": "✓ Open-Meteo (free, no API key)"
  }
}
```

---

## 🔍 How Disease Detection Works

**No API key. No internet after setup. Real CNN predictions.**

1. User uploads a leaf photo
2. Transformers pipeline loads the local MobileNetV2 model (cached after first request)
3. Image is preprocessed and passed through the CNN
4. Returns predicted disease + confidence + full treatment plan
5. Shows top-3 alternative predictions if confidence is low

### Model Details
| Property | Value |
|----------|-------|
| Architecture | MobileNetV2 (fine-tuned) |
| Base model | google/mobilenet_v2_1.0_224 |
| Training data | PlantVillage (54,305 images) |
| Classes | 38 (disease + healthy variants) |
| Accuracy | 95.4% on test set |
| Model size | ~9 MB |
| Inference time | ~200–500ms on CPU |
| Internet needed | Only for first download |

### Supported Crops & Diseases (38 classes)
| Crop | Diseases Detected |
|------|------------------|
| Tomato | Late Blight, Early Blight, Bacterial Spot, Leaf Mold, Septoria Leaf Spot, Spider Mites, Target Spot, Yellow Leaf Curl Virus, Mosaic Virus, Healthy |
| Potato | Late Blight, Early Blight, Healthy |
| Corn | Common Rust, Northern Leaf Blight, Cercospora Leaf Spot, Healthy |
| Apple | Scab, Black Rot, Cedar Apple Rust, Healthy |
| Grape | Black Rot, Esca, Leaf Blight, Healthy |
| Cherry | Powdery Mildew, Healthy |
| Peach | Bacterial Spot, Healthy |
| Pepper | Bacterial Spot, Healthy |
| Strawberry | Leaf Scorch, Healthy |
| Orange | Citrus Greening (HLB) |
| Squash | Powdery Mildew |
| Blueberry, Raspberry, Soybean | Healthy |

### Tips for best results
- Clear, **well-lit** close-up of the **affected leaf**
- **Fill the frame** with the leaf — minimal background
- **Natural daylight** works best
- Low confidence? Take a closer photo and retry

---

## 🌤️ Weather — No API Key!
Uses **Open-Meteo** by default — completely free, no signup, no key.
GPS from your browser → Open-Meteo returns real local weather data.

---

## 📁 Project Structure
```
backend/
├── main.py                    ← FastAPI app
├── requirements.txt           ← torch, transformers, fastapi, pillow...
├── ml/
│   ├── download_model.py      ← Run once to download model
│   ├── classifier.py          ← HF pipeline inference engine
│   └── models/
│       ├── config.json        ← Downloaded model files
│       ├── pytorch_model.bin  ← Model weights (~9 MB)
│       └── class_labels.json  ← 38 class names
└── routes/
    ├── detect.py              ← POST /api/detect
    ├── weather.py             ← GET /api/weather
    └── ...
```

---

## 🌐 Deploy to Render
Add this to `render.yaml` buildCommand:
```
pip install -r requirements.txt && python ml/download_model.py
```
No environment variables required for disease detection.
