import os
import httpx
import base64
from services.classification_service import classify_multimodal_issue

def classify_image_url(image_url: str, description: str = "") -> dict:
    """
    Downloads an image (or uses base64 string directly) and classifies it 
    using the Multi-Modal Multi-Class Classification Engine.
    """
    api_key = os.getenv("HUGGINGFACE_API_KEY")

    image_data = None
    if image_url.startswith("data:image"):
        image_data = image_url
    elif image_url.startswith("http://") or image_url.startswith("https://"):
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                img_resp = client.get(image_url, headers={"User-Agent": "CivicSnap Tracker 1.0"})
                img_resp.raise_for_status()
                b64_content = base64.b64encode(img_resp.content).decode('utf-8')
                image_data = f"data:image/jpeg;base64,{b64_content}"
        except Exception as e:
            print(f"[Image Fetch Error in utils.py]: {e}")

    result = classify_multimodal_issue(image_data=image_data, description=description, api_key=api_key)

    return {
        "category": result.get("detected_category"),
        "department": result.get("target_department"),
        "status": result.get("status"),
        "confidence_score": result.get("confidence_score", 0.0),
        "all_class_scores": result.get("all_class_scores", [])
    }

