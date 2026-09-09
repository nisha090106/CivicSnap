import sys
import os
import io
import base64
from PIL import Image, ImageDraw

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.classification_service import classify_multimodal_issue

def create_synthetic_water_leak_image() -> str:
    """Generates a synthetic base64 image of a water pipe leak on asphalt surface."""
    img = Image.new("RGB", (300, 300), color=(80, 85, 90)) # Grey asphalt
    draw = ImageDraw.Draw(img)
    
    # Blue water flow & puddle
    draw.ellipse([80, 100, 220, 220], fill=(40, 120, 220), outline=(20, 80, 180))
    # White spouting water foam spray
    draw.polygon([(150, 40), (120, 120), (180, 120)], fill=(240, 248, 255))
    draw.ellipse([130, 30, 170, 70], fill=(255, 255, 255))
    
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def run_tests():
    print("==================================================")
    print("Testing 100% Offline PyTorch Vision Model Classifier")
    print("==================================================")
    
    # 1. Test Water Leak Image
    water_b64 = create_synthetic_water_leak_image()
    res1 = classify_multimodal_issue(image_data=water_b64, description="water pipe leakage gushing on road")
    print("\n--- Test 1: Water Pipe Leakage ---")
    print(f"Status: {res1.get('status')}")
    print(f"Winning Model: {res1.get('winning_model')}")
    print(f"Detected Category: {res1.get('detected_category')}")
    print(f"Target Department: {res1.get('target_department')}")
    print(f"Confidence: {res1.get('confidence_percent')}%")
    
    assert res1.get("detected_category") == "water", f"Expected water, got {res1.get('detected_category')}"
    assert res1.get("target_department") == "Municipal Corporation"
    assert res1.get("confidence_percent") >= 50
    print("[PASS] Test 1: Water Pipe Leakage successfully classified!")
    
    # 2. Test Text-Only Description
    res2 = classify_multimodal_issue(description="huge pothole on main road causing traffic disruption")
    print("\n--- Test 2: Pothole Text Description ---")
    print(f"Winning Model: {res2.get('winning_model')}")
    print(f"Confidence: {res2.get('confidence_percent')}%")
    assert res2.get("detected_category") == "pothole"
    print("[PASS] Test 2: Text description classification working!")
    
    print("\n==================================================")
    print("ALL OFFLINE CLASSIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
