import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

def list_models():
    api_key = os.getenv("TRITON_API_KEY")
    base_url = os.getenv("TRITON_BASE_URL", "https://tritonai-api.ucsd.edu/v1")
    
    if not api_key:
        print("Error: TRITON_API_KEY not found in .env")
        return

    client = OpenAI(api_key=api_key, base_url=base_url)
    
    try:
        models = client.models.list()
        print("--- Available Models on TritonAI ---")
        for model in models.data:
            print(f"- {model.id}")
    except Exception as e:
        print(f"Error fetching models: {e}")

if __name__ == "__main__":
    list_models()
