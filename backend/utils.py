import os
import httpx
import base64

def classify_image_url(image_url: str) -> dict:
    """
    Downloads an image and classifies it using HuggingFace's CLIP model.
    Maps the result to one of six specific categories and maps it to the correct department.
    """
    api_key = os.getenv("HUGGINGFACE_API_KEY")
    # If not set, let it proceed to fail or be handled by the caller, 
    # but the instructions say "Reads HUGGINGFACE_API_KEY from environment variables."

    url = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
    headers = {"Authorization": f"Bearer {api_key}"}

    label_map = {
        "a photo of a pothole or damaged road": "pothole",
        "a photo of garbage or waste": "garbage",
        "a photo of water leakage or waterlogging": "water",
        "a photo of a broken streetlight or damaged wire": "electricity",
        "a photo of unhygienic or expired food being sold": "food_hygiene",
        "a photo of illegal tree cutting or forest damage": "forest_damage"
    }
    
    dept_map = {
        "pothole": "Road & Transport",
        "garbage": "Garbage & Waste Management",
        "water": "Municipal Corporation",
        "electricity": "Municipal Corporation",
        "food_hygiene": "Food & Drug Authority",
        "forest_damage": "Forest Department"
    }
    
    candidate_labels = list(label_map.keys())

    def _attempt():
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            # 1. Download image
            img_resp = client.get(image_url, headers={"User-Agent": "CivicSnap Tracker 1.0"})
            img_resp.raise_for_status()
            img_b64 = base64.b64encode(img_resp.content).decode('utf-8')

            # 2. Call HF API
            payload = {
                "inputs": img_b64,
                "parameters": {
                    "candidate_labels": candidate_labels
                }
            }
            
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            
            data = resp.json()
            
            # The HF zero-shot image classification endpoint returns a list of dictionaries 
            # sorted by score, e.g. [{"score": 0.9, "label": "..."}, ...]
            if isinstance(data, list) and len(data) > 0:
                # Explicitly sort just in case, though HF usually returns them sorted
                best = max(data, key=lambda x: x.get("score", 0))
                best_label = best.get("label")
                best_score = best.get("score", 0)
                
                category = label_map.get(best_label)
                
                if best_score < 0.35:
                    return {
                        "category": None,
                        "department": None,
                        "status": "needs_manual_review"
                    }
                else:
                    return {
                        "category": category,
                        "department": dept_map.get(category),
                        "status": "classified"
                    }
            elif isinstance(data, dict) and "error" in data:
                raise Exception(f"HF API expected error format: {data}")
            else:
                raise Exception(f"Unexpected response format: {data}")

    last_err = None
    for i in range(2): # Try once, and retry once
        try:
            result = _attempt()
            if result:
                return result
            else:
                raise Exception("Did not match any valid category label.")
        except Exception as e:
            last_err = e
            continue
            
    raise Exception(f"Failed to classify image after 2 attempts. Last error: {last_err}")
