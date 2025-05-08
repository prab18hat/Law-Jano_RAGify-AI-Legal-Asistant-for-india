import os
import requests

# Google Translate API endpoint
GOOGLE_TRANSLATE_API_KEY = os.environ.get('GOOGLE_TRANSLATE_API_KEY') or "AIzaSyAVV_vNgGWLwfOg8lIpAPZW5rN8xPrW06o"
GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"

LANG_CODE_MAP = {
    "en": "en",
    "hi": "hi",
    "gu": "gu",
    "ta": "ta",
    "kn": "kn",
    "bn": "bn",
    "mr": "mr",
    "te": "te",
    "ml": "ml",
    "pa": "pa",
    "or": "or",
    "as": "as",
    "ur": "ur"
}

def translate_text(text, src_lang, tgt_lang):
    if src_lang == tgt_lang:
        print(f"[GOOGLE TRANSLATE] src_lang == tgt_lang ({src_lang}), returning original text.")
        return text
    src = LANG_CODE_MAP.get(src_lang, "en")
    tgt = LANG_CODE_MAP.get(tgt_lang, "en")
    params = {
        "q": text,
        "source": src,
        "target": tgt,
        "format": "text",
        "key": GOOGLE_TRANSLATE_API_KEY
    }
    # Enhanced diagnostics for Bangla and Marathi
    if tgt in ["bn", "mr"]:
        print(f"[GOOGLE TRANSLATE][DEBUG] Attempting translation for {src} -> {tgt}")
        print(f"[GOOGLE TRANSLATE][DEBUG] Input text: {text}")
    try:
        resp = requests.post(GOOGLE_TRANSLATE_URL, data=params, timeout=10)
        print(f"[GOOGLE TRANSLATE] Response status: {resp.status_code}")
        print(f"[GOOGLE TRANSLATE] Response content: {resp.text}")
        if resp.status_code == 200:
            data = resp.json()
            if "data" in data and "translations" in data["data"]:
                translation = data["data"]["translations"][0]["translatedText"]
                if tgt in ["bn", "mr"]:
                    print(f"[GOOGLE TRANSLATE][DEBUG] Output translation: {translation}")
                # Warn if translation is identical to input for these languages
                if tgt in ["bn", "mr"] and translation.strip() == text.strip():
                    print(f"[GOOGLE TRANSLATE][WARNING] Translation failed or returned original text for {tgt}!")
                return translation
            else:
                print(f"[GOOGLE TRANSLATE][ERROR] Translation not found in response.")
                return text
        else:
            print(f"[GOOGLE TRANSLATE][ERROR] Non-200 status code received from Google.")
            return text
    except Exception as e:
        print(f"[GOOGLE TRANSLATE][ERROR] Exception occurred: {e}")
        return text
