"""Disease detection endpoint — Real AI powered (Gemini/Claude/Local model)."""
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from ml.classifier import predict

log = logging.getLogger("krishirakshak.detect")
router = APIRouter()

MAX_SIZE = 10 * 1024 * 1024   # 10 MB
ALLOWED  = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}


@router.post("/detect")
async def detect_disease(
    image: UploadFile = File(None),
    file:  UploadFile = File(None),
):
    """
    Accept a plant leaf image, run real AI disease detection.
    Rejects non-leaf images (walls, chairs, people, etc.) with a clear message.
    """
    upload = image or file
    if upload is None:
        raise HTTPException(422, "No image provided. Send field named 'image' or 'file'.")

    content_type = (upload.content_type or "image/jpeg").lower().split(";")[0].strip()
    if content_type not in ALLOWED and not content_type.startswith("image/"):
        raise HTTPException(415, f"Unsupported file type '{content_type}'. Upload JPEG, PNG, or WEBP.")

    data = await upload.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(413, "Image too large. Maximum 10 MB.")
    if len(data) < 500:
        raise HTTPException(400, "Image appears empty or corrupt. Please upload a valid image.")

    log.info("Detection request: '%s' (%d bytes, %s)", upload.filename, len(data), content_type)

    try:
        result = predict(data, content_type)
    except RuntimeError as e:
        log.error("Prediction error: %s", e)
        raise HTTPException(503, str(e))
    except Exception as e:
        log.error("Unexpected inference error: %s", e, exc_info=True)
        raise HTTPException(500, "Internal inference error. Please try again.")

    is_leaf = result.get("is_leaf")
    log.info("Result: is_leaf=%s  disease=%s  confidence=%s%%",
             is_leaf, result.get("disease"), result.get("confidence"))
    return result
