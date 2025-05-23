from google.cloud import texttospeech
import os
from fastapi import HTTPException

# Initialize TTS client with API key
def get_tts_client():
    try:
        client = texttospeech.TextToSpeechClient()
        return client
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize TTS client: {str(e)}")

def synthesize_speech(text, language_code='hi-IN'):
    try:
        client = get_tts_client()
        
        # Set the text input to be synthesized
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Build the voice request, select the language code and the ssml
        # voice gender
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        # Select the type of audio file you want returned
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # Perform the text-to-speech request
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return response.audio_content
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to synthesize speech: {str(e)}")
