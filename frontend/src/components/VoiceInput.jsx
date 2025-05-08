// VoiceInput.jsx
import React, { useState } from "react";

const VoiceInput = ({ onVoiceInput }) => {
    const [listening, setListening] = useState(false);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.lang = 'en-US';

    const startListening = () => {
        setListening(true);
        recognition.start();
    };

    recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        setListening(false);
        if (onVoiceInput) {
            onVoiceInput(speechToText);
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
    };

    // No sendQuestion function needed; all logic handled in parent after text is set.

    return (
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 4px" }}>
            <button
                onClick={startListening}
                disabled={listening}
                className="send-button"
                style={{ minWidth: 44, padding: '7px 12px', fontSize: 13 }}
            >
                {listening ? "Listening..." : "🎤 Voice"}
            </button>
        </div>
    );
};

export default VoiceInput;
