import httpx
import os
import base64
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("HUGGINGFACE_API_KEY")

def test_hf():
    url = "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32"
    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    # 1x1 transparent png
    b64_str = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    
    payload = {
        "inputs": b64_str,
        "parameters": {
            "candidate_labels": [
                "a photo of a pothole or damaged road",
                "a photo of garbage or waste",
                "a photo of water leakage or waterlogging",
                "a photo of a broken streetlight or damaged wire"
            ]
        }
    }
    
    try:
        resp = httpx.post(url, headers=headers, json=payload, timeout=15.0)
        print("Status code:", resp.status_code)
        try:
            print("Response:", resp.json())
        except:
            print("Response text:", resp.text)
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    test_hf()
