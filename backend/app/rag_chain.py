# rag_chain.py

import os
import requests
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

def ask_grok(question: str) -> str:
    if not GROQ_API_KEY:
        return "GROQ_API_KEY is not set in environment variables."

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "messages": [
            {"role": "system", "content": "You are a legal assistant. Answer legal questions clearly and accurately."},
            {"role": "user", "content": question}
        ],
        "model": "llama3-70b-8192",
        "temperature": 0.5
    }

    response = requests.post(GROQ_API_URL, headers=headers, json=data)

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"]
    else:
        return f"Grok API Error: {response.text}"
