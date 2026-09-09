import os
import sys
import json
from dotenv import load_dotenv

load_dotenv()

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from services.classification_service import classify_multimodal_issue, CATEGORY_DEFS

def run_tests():
    print("==================================================================")
    print("  RUNNING MULTI-MODAL MULTI-CLASS CLASSIFICATION VERIFICATION")
    print("==================================================================")

    # 1x1 base64 transparent PNG for testing
    dummy_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    test_cases = [
        {
            "name": "Image Evidence - Dark Asphalt Road (Pothole)",
            "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "description": "",
            "expected_status": "classified"
        },
        {
            "name": "Text Only - Garbage & Waste Overflow",
            "image": None,
            "description": "Huge heap of uncollected garbage and waste overflowing from bin onto road",
            "expected_cat": "garbage"
        },
        {
            "name": "Text Only - Water Pipeline Rupture",
            "image": None,
            "description": "High pressure water pipe leak and sewage drainage overflow in sector 4",
            "expected_cat": "water"
        },
        {
            "name": "Text Only - Street Light & Electrical Pole",
            "image": None,
            "description": "Dangling electricity wire and non functional streetlight luminaire on pole",
            "expected_cat": "electricity"
        },
        {
            "name": "Text Only - Food Vendor Sanitation",
            "image": None,
            "description": "Unhygienic street food vendor selling stale and contaminated snacks near market",
            "expected_cat": "food"
        },
        {
            "name": "Text Only - Forest Tree Cutting",
            "image": None,
            "description": "Illegal tree cutting and timber logging inside forest perimeter reserve area",
            "expected_cat": "forest"
        },
        {
            "name": "Text Only - Pothole Road Damage",
            "image": None,
            "description": "Deep asphalt pothole and road crack near traffic junction causing tire damage",
            "expected_cat": "pothole"
        },
        {
            "name": "Fallback Test - Ambiguous Input",
            "image": None,
            "description": "xyz random text with no civic relevance",
            "expected_status": "needs_manual_review"
        }
    ]

    passed = 0
    total = len(test_cases)

    for i, tc in enumerate(test_cases, 1):
        print(f"\n[Test {i}/{total}]: {tc['name']}")
        res = classify_multimodal_issue(image_data=tc["image"], description=tc["description"])
        
        detected = res.get("detected_category")
        status = res.get("status")
        dept = res.get("target_department")
        conf = res.get("confidence_score")

        print(f"  Result -> Status: '{status}', Category: '{detected}', Department: '{dept}', Confidence: {conf}")

        if "expected_cat" in tc:
            if detected == tc["expected_cat"]:
                print("  [PASSED] Correct category detected!")
                passed += 1
            else:
                print(f"  [FAILED] Expected '{tc['expected_cat']}', got '{detected}'")
        elif "expected_status" in tc:
            if status == tc["expected_status"]:
                print(f"  [PASSED] Correctly entered fallback status '{status}'!")
                passed += 1
            else:
                print(f"  [FAILED] Expected status '{tc['expected_status']}', got '{status}'")

    print("\n------------------------------------------------------------------")
    print(f"VERIFICATION COMPLETE: {passed}/{total} tests passed.")
    print("==================================================================")
    if passed == total:
        print("ALL CLASSIFICATION TESTS PASSED SUCCESSFULLY!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
