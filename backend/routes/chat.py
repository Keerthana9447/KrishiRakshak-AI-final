"""AI Copilot chat endpoint."""
import os
import logging
import random
from fastapi import APIRouter
from pydantic import BaseModel

log = logging.getLogger("krishirakshak.chat")
router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    history: list = []


# ── rule-based knowledge base (no API key needed) ─────────────────────────────
KB_EN: dict[str, str] = {
    "blight": (
        "For blight diseases, apply Mancozeb 75% WP at 2 g/L water every 7–10 days. "
        "Remove infected leaves immediately. Avoid overhead irrigation. "
        "Best spray time: early morning 6–9 AM when humidity is lower."
    ),
    "late blight": (
        "Late Blight (Phytophthora infestans) is critical — act within 24 hours. "
        "Apply Metalaxyl 8% + Mancozeb 64% WP at 2.5 g/L. Remove all infected plant parts. "
        "Switch to drip irrigation. Potassium application (60 kg/ha) strengthens cell walls."
    ),
    "early blight": (
        "Early Blight (Alternaria solani): Apply Chlorothalonil 75% WP at 2 g/L. "
        "Ensure good air circulation. Rotate crops — do not plant tomato/potato in same field for 2 years."
    ),
    "blast": (
        "Rice Blast (Magnaporthe oryzae) management: Apply Tricyclazole 75% WP at 0.6 g/L "
        "at tillering and boot-leaf stage. Maintain 5 cm standing water. "
        "Avoid excess nitrogen. Silicon at 100 kg SiO2/ha improves resistance significantly."
    ),
    "rust": (
        "For rust diseases: Apply Propiconazole 25% EC at 1 ml/L water. "
        "Ensure adequate potassium levels. Use rust-resistant varieties for next season. "
        "Early morning scouting helps catch rust before it spreads."
    ),
    "fertilizer": (
        "General fertilizer guidance: Use NPK 19:19:19 as foliar spray at 2 g/L during vegetative stage. "
        "When disease is present, reduce nitrogen and increase potassium to 60 kg/ha. "
        "Calcium Nitrate (1 g/L foliar) strengthens cell walls against fungal entry."
    ),
    "irrigation": (
        "Irrigation best practices: Use drip irrigation to keep foliage dry. "
        "Water early morning (6–8 AM) so leaves dry by noon. "
        "Avoid evening watering — wet overnight foliage is ideal for fungal disease. "
        "If disease is detected, reduce irrigation frequency by 30%."
    ),
    "spray": (
        "Best spray timing: Early morning 6–9 AM or late evening after 5 PM. "
        "Avoid spraying during rain, strong wind (>15 km/h), or temperature above 35°C. "
        "Use fine-mist nozzle to cover undersides of leaves. "
        "Re-spray after rain within 24 hours if using contact fungicides."
    ),
    "organic": (
        "Organic disease management: "
        "1. Neem oil spray 5 ml/L — effective against early-stage fungal and bacterial infections. "
        "2. Copper Hydroxide 2 g/L — broad-spectrum, safe for organic farming. "
        "3. Trichoderma viride 2 g/L — soil drench for root protection. "
        "4. Pseudomonas fluorescens 5 ml/L foliar — biocontrol agent."
    ),
    "tomato": (
        "Tomato disease management: Scout daily for Late Blight (pale green spots), "
        "Early Blight (concentric ring spots), and Bacterial Spot (water-soaked lesions). "
        "Apply preventive Mancozeb 75% WP every 10 days during monsoon. "
        "Maintain 60 cm plant spacing for air circulation."
    ),
    "potato": (
        "Potato disease management: Late Blight is the most critical — use Metalaxyl + Mancozeb. "
        "Harvest when foliage begins to senesce, not after disease. "
        "Certified seed potatoes reduce disease risk by 60%. "
        "Hill up soil around plants to protect tubers."
    ),
    "rice": (
        "Rice disease management: Scout for blast (diamond-shaped lesions) and brown spot "
        "(circular spots with grey centres). Apply Tricyclazole at tillering stage prophylactically. "
        "Maintain continuous flooding to reduce blast severity. "
        "Use varieties BPT 5204 or Swarna which have good blast resistance."
    ),
    "weather": (
        "Weather-based advice for today: High humidity increases fungal disease risk. "
        "If humidity is above 70% and temperature above 25°C, apply preventive fungicide. "
        "Avoid spraying if rain is expected within 6 hours. "
        "Morning dew on leaves — apply fungicide after dew dries, around 9 AM."
    ),
    "prevention": (
        "General disease prevention: "
        "1. Use certified disease-free seeds and transplants. "
        "2. Practice 2–3 year crop rotation. "
        "3. Maintain proper plant spacing for airflow. "
        "4. Remove and destroy infected plant debris — do not compost. "
        "5. Apply preventive fungicide spray at 10-day intervals during monsoon."
    ),
    "hello": (
        "నమస్కారం! I am KrishiRakshak AI 🌱 — your farming copilot. "
        "I can help you with crop disease identification, treatment recommendations, "
        "weather-based advice, fertilizer guidance, and irrigation planning. "
        "Ask me anything about your crops!"
    ),
    "help": (
        "Here is what I can help you with:\n"
        "• Crop disease identification and treatment\n"
        "• Organic and chemical treatment plans\n"
        "• Fertilizer and nutrient management\n"
        "• Irrigation timing and methods\n"
        "• Weather-based spray windows\n"
        "• Pest and disease prevention\n\n"
        "Just describe your problem or ask a question!"
    ),
}

KB_TE: dict[str, str] = {
    "తెగులు": (
        "తెగులు నివారణకు: మాంకోజెబ్ 75% WP 2 గ్రాములు/లీటరు నీటికి 7-10 రోజులకు ఒకసారి పిచికారీ చేయండి. "
        "సోకిన ఆకులను వెంటనే తొలగించండి. పైన నుండి నీరు పెట్టడం మానండి. "
        "పిచికారీకి ఉత్తమ సమయం: ఉదయం 6-9 గంటలు."
    ),
    "ఎరువు": (
        "ఎరువు సిఫారసు: NPK 19:19:19 ఆకు పిచికారీగా 2 గ్రా/లీటరు వాడండి. "
        "వ్యాధి ఉన్నప్పుడు నత్రజని తగ్గించి, పొటాషియం 60 కిలోలు/హెక్టారు వాడండి. "
        "కాల్షియం నైట్రేట్ 1 గ్రా/లీటరు ఆకు పిచికారీ — కణ గోడలు బలపడతాయి."
    ),
    "నీటి పారుదల": (
        "నీటి పారుదల సలహా: చుక్క నీటి పారుదల వాడండి — ఆకులు తడవకుండా ఉంటాయి. "
        "ఉదయం 6-8 గంటలలో నీరు పెట్టండి. సాయంత్రం నీరు పెట్టకండి. "
        "వ్యాధి ఉంటే నీటి పారుదల 30% తగ్గించండి."
    ),
    "సహాయం": (
        "నేను ఈ విషయాలలో సహాయం చేయగలను:\n"
        "• పంట వ్యాధి గుర్తింపు మరియు చికిత్స\n"
        "• సేంద్రీయ మరియు రసాయన చికిత్స ప్రణాళికలు\n"
        "• ఎరువు మరియు పోషక నిర్వహణ\n"
        "• నీటి పారుదల సమయం మరియు పద్ధతులు\n"
        "• వాతావరణ ఆధారిత పిచికారీ సమయాలు\n\n"
        "మీ సమస్యను వివరించండి లేదా ప్రశ్న అడగండి!"
    ),
    "నమస్కారం": (
        "నమస్కారం! నేను కృషి రక్షక్ AI 🌱 — మీ వ్యవసాయ సహాయకుడను. "
        "పంట వ్యాధులు, చికిత్స సలహాలు, వాతావరణ ఆధారిత సూచనలు, ఎరువు మార్గదర్శకత్వం మరియు నీటి పారుదల ప్రణాళికలో నేను సహాయం చేయగలను. "
        "మీ పంటల గురించి ఏదైనా అడగండి!"
    ),
}

FALLBACK_EN = [
    (
        "Based on your query, I recommend monitoring your crop daily for any new symptoms. "
        "Apply a preventive broad-spectrum fungicide (Mancozeb 75% WP at 2 g/L) if you notice any unusual spots or discolouration. "
        "Ensure good air circulation and avoid overhead irrigation."
    ),
    (
        "For best crop protection during the current season: (1) Scout your fields every 2-3 days, "
        "(2) Maintain proper plant spacing for airflow, (3) Apply preventive fungicide spray every 10 days during high-humidity periods, "
        "(4) Use certified disease-free seeds for the next crop."
    ),
    (
        "Disease management tip: Remove infected plant material immediately and dispose it outside the field. "
        "Never compost diseased plant parts as this spreads pathogens. "
        "Wash hands and tools after handling infected plants. "
        "Apply copper-based fungicide after removal."
    ),
    (
        "Nutrient management for disease resistance: Ensure adequate Potassium levels (60-80 kg K2O/ha) "
        "as potassium strengthens cell walls and improves disease resistance. "
        "Avoid excess nitrogen which promotes lush, disease-susceptible growth. "
        "Calcium helps prevent blossom end rot and strengthens plant immunity."
    ),
]

FALLBACK_TE = [
    (
        "మీ ప్రశ్న ఆధారంగా, రోజువారీ మీ పంటను పరిశీలించమని సిఫారసు చేస్తున్నాను. "
        "అసాధారణ మచ్చలు లేదా రంగు మార్పులు కనిపిస్తే మాంకోజెబ్ 75% WP 2 గ్రా/లీటరు పిచికారీ చేయండి. "
        "మంచి గాలి సంచలనం నిర్ధారించుకోండి."
    ),
    (
        "వ్యాధి నిర్వహణ చిట్కా: సోకిన మొక్కల భాగాలను వెంటనే తొలగించి పొలం వెలుపల వదలండి. "
        "సోకిన మొక్క భాగాలను ఎప్పుడూ కంపోస్ట్ చేయకండి. "
        "తొలగించిన తర్వాత రాగి ఆధారిత శిలీంధ్రనాశకం వాడండి."
    ),
]


def _match_response(message: str, language: str) -> str:
    """Keyword-match against knowledge base."""
    msg_lower = message.lower()

    if language == "te":
        for key, response in KB_TE.items():
            if key in message:
                return response
        # Try English KB too for Telugu messages mixing English words
        for key, response in KB_EN.items():
            if key in msg_lower:
                return response
        return random.choice(FALLBACK_TE)
    else:
        for key, response in KB_EN.items():
            if key in msg_lower:
                return response
        return random.choice(FALLBACK_EN)


@router.post("/chat")
async def chat(req: ChatRequest):
    """
    AI copilot chat endpoint.
    Uses rule-based KB when no LLM API key is configured;
    add GEMINI_API_KEY or OPENAI_API_KEY to .env for LLM-powered responses.
    """
    if not req.message.strip():
        return {"response": "Please ask a question about your crops.", "language": req.language}

    # Optional: plug in Gemini / OpenAI here
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if gemini_key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={gemini_key}",
                    json={
                        "contents": [{
                            "parts": [{
                                "text": (
                                    f"You are KrishiRakshak AI, an expert agricultural assistant for Indian farmers. "
                                    f"Answer in {'Telugu' if req.language == 'te' else 'English'}. "
                                    f"Keep response practical, concise (3–5 sentences), and actionable. "
                                    f"Farmer's question: {req.message}"
                                )
                            }]
                        }]
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                ai_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"response": ai_text, "language": req.language, "source": "gemini"}
        except Exception as exc:
            log.warning("Gemini API failed (%s) — falling back to KB.", exc)

    response = _match_response(req.message, req.language)
    return {"response": response, "language": req.language, "source": "kb"}
