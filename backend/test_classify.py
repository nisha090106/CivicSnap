import os
from dotenv import load_dotenv
from unittest.mock import patch, MagicMock

load_dotenv()

from utils import classify_image_url

def main():
    # We will simulate HF API responses for our URL endpoints mapping to what we'd expect
    mock_responses = {
        "http://dummy/pothole.png": [{"label": "a photo of a pothole or damaged road", "score": 0.95}],
        "http://dummy/garbage.png": [{"label": "a photo of garbage or waste", "score": 0.88}],
        "http://dummy/water.png": [{"label": "a photo of water leakage or waterlogging", "score": 0.92}],
        "http://dummy/electricity.png": [{"label": "a photo of a broken streetlight or damaged wire", "score": 0.91}],
        "http://dummy/food.png": [{"label": "a photo of unhygienic or expired food being sold", "score": 0.89}],
        "http://dummy/forest.png": [{"label": "a photo of illegal tree cutting or forest damage", "score": 0.87}],
        "http://dummy/cat.png": [{"label": "a photo of illegal tree cutting or forest damage", "score": 0.20}, {"label": "a photo of garbage or waste", "score": 0.15}]
    }

    print("Running classification tests with Mocked HF API to avoid network/DNS issues...")
    for url, fake_resp in mock_responses.items():
        print(f"\nTesting classification for: {url.split('/')[-1]}")
        print("-" * 50)
        
        with patch('httpx.Client') as MockClient:
            instance = MockClient.return_value.__enter__.return_value
            
            # mock getting the image
            mock_get = MagicMock()
            mock_get.content = b'fakeimage'
            mock_get.raise_for_status.return_value = None
            instance.get.return_value = mock_get
            
            # mock posting to HF API
            mock_post = MagicMock()
            mock_post.json.return_value = fake_resp
            mock_post.raise_for_status.return_value = None
            instance.post.return_value = mock_post
            
            try:
                result = classify_image_url(url)
                print(f"Success! Result: {result}")
            except Exception as e:
                print(f"Classification failed: {e}")

if __name__ == "__main__":
    main()
