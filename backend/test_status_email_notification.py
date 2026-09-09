import sys
import os
import uuid
from datetime import datetime, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.email_service import send_status_update_notification_to_citizen

def run_tests():
    print("==================================================")
    print("Testing Status Update Email Notification to Citizen")
    print("==================================================")
    
    test_email = "test.citizen@example.com"
    report_id = str(uuid.uuid4())
    
    # 1. Test Pending -> In Progress transition
    res1 = send_status_update_notification_to_citizen(
        target_email=test_email,
        report_id=report_id,
        category="Water Leakage",
        department="Municipal Corporation",
        city_name="Mumbai",
        old_status="pending",
        new_status="in_progress",
        authority_user="Executive Engineer - Water Supply"
    )
    
    print("\n--- Test 1: Status Change to 'in_progress' ---")
    print(f"Status: {res1.get('status')}")
    print(f"Recipient: {res1.get('recipient')}")
    assert res1.get("recipient") == test_email
    print("[PASS] Test 1: In Progress status notification generated!")
    
    # 2. Test In Progress -> Resolved transition
    res2 = send_status_update_notification_to_citizen(
        target_email=test_email,
        report_id=report_id,
        category="Water Leakage",
        department="Municipal Corporation",
        city_name="Mumbai",
        old_status="in_progress",
        new_status="resolved",
        authority_user="Chief Engineer - Municipal Works"
    )
    
    print("\n--- Test 2: Status Change to 'resolved' ---")
    print(f"Status: {res2.get('status')}")
    print(f"Recipient: {res2.get('recipient')}")
    assert res2.get("recipient") == test_email
    print("[PASS] Test 2: Resolved status notification generated!")
    
    print("\n==================================================")
    print("ALL STATUS UPDATE EMAIL NOTIFICATION TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
