import os
import io
import base64
import re
from typing import Dict, Any, Optional, List

# Check PIL availability
try:
    from PIL import Image, ImageFile
    ImageFile.LOAD_TRUNCATED_IMAGES = True
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Check PyTorch & Transformers local model availability
HAS_TORCH = False
CLIP_MODEL = None
CLIP_PROCESSOR = None
IS_LOADING_MODEL = False

def _init_local_clip_model():
    """Lazy initialization of local PyTorch CLIP Model for 100% offline vision classification."""
    global HAS_TORCH, CLIP_MODEL, CLIP_PROCESSOR, IS_LOADING_MODEL
    if CLIP_MODEL is not None and CLIP_PROCESSOR is not None:
        return True
    if IS_LOADING_MODEL:
        return False
    
    try:
        IS_LOADING_MODEL = True
        import torch
        from transformers import CLIPProcessor, CLIPModel
        
        cache_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models_cache")
        os.makedirs(cache_dir, exist_ok=True)
        
        model_name = "openai/clip-vit-base-patch32"
        print(f"[Local Vision Engine]: Loading local PyTorch model '{model_name}' (Cache: {cache_dir})...")
        
        CLIP_PROCESSOR = CLIPProcessor.from_pretrained(model_name, cache_dir=cache_dir)
        CLIP_MODEL = CLIPModel.from_pretrained(model_name, cache_dir=cache_dir)
        CLIP_MODEL.eval()  # Set to evaluation mode
        
        HAS_TORCH = True
        print("[Local Vision Engine]: PyTorch CLIP Model successfully initialized for offline inference.")
        return True
    except Exception as e:
        print(f"[Local Vision Engine Notice]: Could not initialize PyTorch model yet: {e}")
        HAS_TORCH = False
        return False
    finally:
        IS_LOADING_MODEL = False


# 6 Core Civic Issue Categories
CATEGORY_DEFS = {
    "pothole": {
        "id": "pothole",
        "model_name": "Road & Pothole Model",
        "label": "Road & Pothole",
        "department": "Road & Transport",
        "image_candidate": "a photo of a pothole, deep road depression, broken asphalt, or damaged road surface",
        "text_candidate": "road damage or pothole issue",
        "keywords": ["pothole", "potholes", "road crack", "asphalt crack", "damaged road", "tar hole", "road depression", "pavement crack", "road defect", "broken road", "asphalt"]
    },
    "garbage": {
        "id": "garbage",
        "model_name": "Waste & Garbage Model",
        "label": "Waste / Garbage",
        "department": "Garbage & Waste Management",
        "image_candidate": "a photo of garbage, plastic trash overflow, rubbish heap, or waste clutter",
        "text_candidate": "garbage or waste overflow issue",
        "keywords": ["garbage", "waste", "trash", "dumpster", "dustbin", "litter", "rubbish", "refuse", "garbage bin", "garbage heap", "trash overflow", "waste dump"]
    },
    "water": {
        "id": "water",
        "model_name": "Water Leakage Model",
        "label": "Water Leakage",
        "department": "Municipal Corporation",
        "image_candidate": "a photo of water leakage, water pipe burst spraying water, flooded road water, water spout, or sewage leak",
        "text_candidate": "water leakage or drainage pipe burst",
        "keywords": ["water", "water leak", "water leakage", "pipe burst", "drainage leak", "sewage leak", "pipeline rupture", "waterlog", "water main", "water burst", "gushing water", "leakage", "flooded"]
    },
    "electricity": {
        "id": "electricity",
        "model_name": "Electrical Hazard Model",
        "label": "Street Light / Wire",
        "department": "Municipal Corporation",
        "image_candidate": "a photo of a broken streetlight, dangling electrical power wire, transformer spark, or electrical hazard",
        "text_candidate": "electricity issue or streetlight defect",
        "keywords": ["electricity", "wire", "streetlight", "power pole", "transformer", "dangling wire", "short circuit", "electrical fire", "spark", "electric pole", "lamp post", "power line"]
    },
    "food": {
        "id": "food",
        "model_name": "Food & Sanitation Model",
        "label": "Food & Drug Sanitation",
        "department": "Food & Drug Authority",
        "image_candidate": "a photo of unhygienic food vendor stall, spoiled rotten food, or contaminated food",
        "text_candidate": "food hygiene or drug safety issue",
        "keywords": ["food", "hygiene", "restaurant", "food vendor", "stale food", "food adulteration", "food poisoning", "fda", "unhygienic food", "food stall", "rotten food"]
    },
    "forest": {
        "id": "forest",
        "model_name": "Forest & Wildlife Model",
        "label": "Forest & Wildlife",
        "department": "Forest Department",
        "image_candidate": "a photo of illegal tree cutting, fallen tree branch, forest jungle, or wildlife issue",
        "text_candidate": "forest tree damage or wildlife issue",
        "keywords": ["forest", "tree cutting", "illegal logging", "timber", "jungle", "wildlife", "forest damage", "fallen tree", "forest ranger", "tree damage", "trees"]
    }
}


def _calculate_keyword_match(description: Optional[str], keywords: List[str]) -> float:
    """Calculates keyword match score (0.0 to 1.0) for a specific domain model."""
    if not description or len(description.strip()) < 2:
        return 0.0
    desc_clean = description.lower().strip()
    matches = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', desc_clean))
    if matches >= 3:
        return 0.95
    elif matches == 2:
        return 0.85
    elif matches == 1:
        return 0.70
    return 0.0


def _classify_image_local_pytorch(image: Image.Image) -> Dict[str, float]:
    """
    Performs 100% offline zero-shot image classification using local PyTorch CLIP model on CPU.
    """
    if not _init_local_clip_model() or CLIP_MODEL is None or CLIP_PROCESSOR is None:
        return {}
    
    try:
        import torch
        candidate_labels = [meta["image_candidate"] for meta in CATEGORY_DEFS.values()]
        cand_to_cat = {meta["image_candidate"]: cat_id for cat_id, meta in CATEGORY_DEFS.items()}
        
        inputs = CLIP_PROCESSOR(text=candidate_labels, images=image, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            outputs = CLIP_MODEL(**inputs)
            logits_per_image = outputs.logits_per_image  # image-to-text classification logits
            probs = logits_per_image.softmax(dim=1)[0].tolist()
        
        res_dict = {}
        for idx, cand in enumerate(candidate_labels):
            cat_id = cand_to_cat[cand]
            res_dict[cat_id] = float(probs[idx])
            
        print(f"[Local PyTorch Vision Inference]: {res_dict}")
        return res_dict
    except Exception as e:
        print(f"[Local PyTorch Inference Error]: {e}")
        return {}


def _analyze_image_visual_features(image: Image.Image) -> Dict[str, float]:
    """
    Rule-based visual feature analyzer (Secondary Fallback Engine).
    Identifies color, contrast, foam spray, water reflection, and grey asphalt ratios.
    """
    try:
        img_resized = image.convert("RGB").resize((150, 150))
        pixels = list(img_resized.getdata())
        total_pixels = len(pixels)

        road_pavement_pixels = 0    # Low saturation grey asphalt
        pothole_dark_rim_pixels = 0  # Dark pit shadow rims
        trash_vivid_pixels = 0       # Waste clutter
        green_pixels = 0             # Trees / forest
        water_flow_pixels = 0        # Water spray / pipe burst / water leak
        yellow_fire_pixels = 0       # Electrical sparks / streetlights

        for r, g, b in pixels:
            brightness = (r + g + b) / 3.0
            max_c = max(r, g, b)
            min_c = min(r, g, b)
            sat = max_c - min_c

            # Asphalt Pavement Surface
            if sat < 30 and 25 < brightness < 215:
                road_pavement_pixels += 1
                
            # Dark Hole Shadow Rim
            if brightness < 60 and sat < 25:
                pothole_dark_rim_pixels += 1
            
            # Vivid Trash & Waste
            if sat > 40:
                trash_vivid_pixels += 1

            # Green Trees & Leaves
            if g > r + 12 and g > b + 12:
                green_pixels += 1
                
            # Water Leakage (Blue water, white foam/spray, gushing water splash, muddy wet asphalt)
            is_blue_water = (b > r + 8 and b > g - 5)
            is_water_foam_spray = (brightness > 155 and sat < 25 and (abs(r - g) < 20 and abs(g - b) < 20))
            is_muddy_water = (r > 90 and g > 70 and 35 < b < 150 and sat < 55 and 70 < brightness < 200)
            
            if is_blue_water or is_water_foam_spray or is_muddy_water:
                water_flow_pixels += 1
                
            # Electrical Hazard (Yellow streetlight, orange spark, red flame)
            if r > 145 and (g > 115 or r > b + 35):
                yellow_fire_pixels += 1

        road_ratio = road_pavement_pixels / total_pixels
        rim_ratio = pothole_dark_rim_pixels / total_pixels
        trash_ratio = trash_vivid_pixels / total_pixels
        green_ratio = green_pixels / total_pixels
        water_ratio = water_flow_pixels / total_pixels
        yellow_fire_ratio = yellow_fire_pixels / total_pixels

        scores = {
            "pothole": 0.10 + (0.45 * road_ratio) + (0.35 * rim_ratio),
            "garbage": 0.08 + (0.75 * trash_ratio),
            "water": 0.12 + (0.85 * water_ratio),
            "electricity": 0.08 + (0.70 * yellow_fire_ratio),
            "food": 0.08 + (0.30 * trash_ratio if yellow_fire_ratio > 0.1 else 0.0),
            "forest": 0.08 + (0.80 * green_ratio)
        }

        total_score = sum(scores.values()) or 1.0
        return {cat_id: round(score / total_score, 4) for cat_id, score in scores.items()}

    except Exception as e:
        print(f"[Visual Feature Analysis Notice]: {e}")
        return {cat_id: 0.16 for cat_id in CATEGORY_DEFS}


def evaluate_domain_model(
    cat_id: str,
    image_data: Optional[str],
    description: Optional[str],
    torch_scores: Dict[str, float],
    vis_scores: Dict[str, float]
) -> Dict[str, Any]:
    """Evaluates an independent domain model for a specific civic issue category."""
    meta = CATEGORY_DEFS[cat_id]
    kw_score = _calculate_keyword_match(description, meta["keywords"])
    torch_score = torch_scores.get(cat_id, 0.0)
    vis_score = vis_scores.get(cat_id, 0.0)

    has_text = bool(description and len(description.strip()) > 2)
    has_image = bool(image_data and len(image_data) > 30)

    if has_image and has_text:
        # If we have PyTorch model inference, weigh it heavily (60% vision AI, 30% text, 10% heuristics)
        if torch_scores:
            combined = (torch_score * 0.60) + (kw_score * 0.30) + (vis_score * 0.10)
        else:
            combined = (vis_score * 0.50) + (kw_score * 0.50)
    elif has_image:
        if torch_scores:
            combined = (torch_score * 0.85) + (vis_score * 0.15)
        else:
            combined = vis_score
    elif has_text:
        combined = kw_score
    else:
        combined = 0.0

    # Calculate confidence percentage (0% to 99%)
    if torch_scores and torch_score > 0.25:
        conf_pct = min(99, max(60, int(torch_score * 95 + 10)))
    elif kw_score > 0.6 or vis_score > 0.35:
        conf_pct = min(95, max(55, int(combined * 110 + 15)))
    else:
        conf_pct = max(5, int(combined * 100))

    return {
        "model_id": f"M_{cat_id}",
        "model_name": meta["model_name"],
        "category": cat_id,
        "category_label": meta["label"],
        "department": meta["department"],
        "confidence": conf_pct,
        "raw_score": round(combined, 4)
    }


def classify_multimodal_issue(
    image_data: Optional[str] = None,
    description: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Multi-Model Ensemble Classification Engine (100% Offline PyTorch Vision Engine).
    Evaluates 6 independent domain models (Pothole, Garbage, Water, Electricity, Food, Forest).
    The model with the highest confidence wins.
    """
    has_image = bool(image_data and len(image_data) > 30)
    has_text = bool(description and len(description.strip()) > 2)

    pil_img = None
    if has_image and HAS_PIL:
        try:
            b64_content = image_data.split(",", 1)[1] if "," in image_data else image_data
            img_bytes = base64.b64decode(b64_content)
            pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        except Exception as e:
            print(f"[Image Decode Notice]: {e}")

    # 1. Local PyTorch Vision Inference (Offline)
    torch_scores: Dict[str, float] = {}
    if pil_img:
        torch_scores = _classify_image_local_pytorch(pil_img)

    # 2. Rule-based visual feature fallback analysis
    vis_scores: Dict[str, float] = {}
    if pil_img:
        vis_scores = _analyze_image_visual_features(pil_img)

    # 3. Evaluate 6 Domain Models
    all_models: List[Dict[str, Any]] = []
    for cat_id in CATEGORY_DEFS:
        model_result = evaluate_domain_model(cat_id, image_data, description, torch_scores, vis_scores)
        all_models.append(model_result)

    # 4. Winner-takes-all selection
    all_models.sort(key=lambda m: m["confidence"], reverse=True)
    winner = all_models[0]

    # Handle ambiguous / unreadable inputs
    if winner["confidence"] < 30 or (not has_image and not has_text):
        return {
            "success": True,
            "detected_category": winner["category"],
            "category_label": winner["category_label"],
            "target_department": winner["department"],
            "confidence_score": round(winner["confidence"] / 100.0, 2),
            "confidence_percent": winner["confidence"],
            "winning_model": winner["model_name"],
            "status": "needs_manual_review",
            "message": "AI confidence is low. Please confirm or select the target authority department.",
            "all_model_confidences": all_models
        }

    return {
        "success": True,
        "detected_category": winner["category"],
        "category_label": winner["category_label"],
        "target_department": winner["department"],
        "confidence_score": round(winner["confidence"] / 100.0, 2),
        "confidence_percent": winner["confidence"],
        "winning_model": winner["model_name"],
        "status": "classified",
        "message": f"Winning Model: '{winner['model_name']}' ({winner['confidence']}% Match) routed to '{winner['department']}'.",
        "all_model_confidences": all_models
    }
