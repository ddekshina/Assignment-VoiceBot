import os
from dotenv import load_dotenv
import requests

load_dotenv()

def test_blandai_connection():
    url = "https://api.bland.ai/v1/calls"
    headers = {
        "Authorization": os.getenv("BLANDAI_API_KEY"),
        "Content-Type": "application/json"
    }
    payload = {
        "phone_number": "+15555555555",
        "task": "Test connection",
        "model": "base"
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        return response.json()
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

if __name__ == "__main__":
    result = test_blandai_connection()
    print(result)