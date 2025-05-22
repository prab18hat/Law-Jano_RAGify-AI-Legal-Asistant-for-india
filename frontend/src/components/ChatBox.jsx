import { useState, useRef, useEffect } from "react";
import { FaMoon, FaSun, FaVolumeUp } from "react-icons/fa";
import { Howl } from 'howler';
import logo from "../assets/lawjano-logo.png";

const ChatBox = () => {
    const [theme, setTheme] = useState("light"); // light or dark
    const [isSpeaking, setIsSpeaking] = useState(false);
    const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
    const [question, setQuestion] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState("en"); // NEW: default English
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fix: Always scroll to the top of the latest bot answer as soon as it appears
    const prevChatLength = useRef(0);
    useEffect(() => {
        if (chat.length > prevChatLength.current) {
            const lastMsg = chat[chat.length - 1];
            if (lastMsg && lastMsg.type === "bot") {
                setTimeout(() => {
                    const chatContainer = chatEndRef.current?.parentElement;
                    if (chatContainer) {
                        // Find the last assistant message node
                        const botMessages = chatContainer.querySelectorAll('.chat-message.assistant');
                        if (botMessages.length > 0) {
                            // Scroll the chat container so the top of the latest bot message is visible
                            const latestBotMsg = botMessages[botMessages.length - 1];
                            latestBotMsg.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                        }
                    }
                }, 0);
            }
        }
        prevChatLength.current = chat.length;
    }, [chat]);

    const handleAsk = async () => {
        if (!question.trim()) return;

        setLoading(true);
        setChat([...chat, { type: "user", text: question }]);

        // Debug: Log the language code being sent
        console.log("[DEBUG] Sending language code:", language);

        try {
            const res = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, language }), // sending language too
            });

            const data = await res.json();
            setChat((prev) => [...prev, { type: "bot", text: data.answer }]);
        } catch (err) {
            setChat((prev) => [...prev, { type: "bot", text: "❌ Failed to get response." }]);
        }

        setQuestion("");
        setLoading(false);
    };


    const handleLanguageChange = (e) => {
        setLanguage(e.target.value);
    };

    const speakText = async (text, languageCode) => {
        try {
            setIsSpeaking(true);
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `text=${encodeURIComponent(text)}&language_code=${languageCode}`
            });

            const data = await res.json();
            if (data.success && data.audio_content) {
                // Decode the base64 audio content
                const binaryString = window.atob(data.audio_content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Create a Blob from the binary data
                const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(audioBlob);

                // Play the audio using Howl
                const sound = new Howl({
                    src: [url],
                    format: ['mp3'],
                    onend: () => {
                        setIsSpeaking(false);
                        URL.revokeObjectURL(url);
                    }
                });

                sound.play();
            }
        } catch (error) {
            console.error('Error in text-to-speech:', error);
            setIsSpeaking(false);
        }
    };

    return (
        <div
            className="w-full max-w-3xl mx-auto p-4"
            style={{ position: 'relative', background: theme === 'dark' ? '#23272f' : undefined, color: theme === 'dark' ? '#e3e3e3' : undefined, borderRadius: 16, transition: 'background 0.3s, color 0.3s', overflow: 'visible' }}
        >
            {/* Theme Toggle Icon - Top Center */}
            <button
                aria-label="Toggle theme"
                onClick={toggleTheme}
                style={{
                    position: 'absolute',
                    top: 8, // move below the logo, always visible
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme === 'dark' ? '#232323' : '#fff',
                    color: theme === 'dark' ? '#ffd600' : '#6a4cff',
                    border: '2.5px solid #6a4cff',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
                    cursor: 'pointer',
                    zIndex: 100,
                    transition: 'background 0.2s, color 0.2s',
                }}
            >
                {theme === 'dark'
                    ? <FaSun size={20} style={{ color: '#ffd600' }} />
                    : <FaMoon size={20} style={{ color: '#6a4cff' }} />}
            </button>
            {/* Logo Centered Above Chat */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: 8, marginTop: 18, position: "relative" }}>
                <img
                    src={logo}
                    alt="LawJano Logo"
                    style={{
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        boxShadow: "0 0 18px #6a4cff88, 0 0 2px #fff",
                        background: "#fff",
                        objectFit: "cover",
                        zIndex: 11
                    }}
                />
            </div>

            <div className="flex flex-col w-full max-w-3xl mx-auto p-4" style={{
                background: theme === 'dark' ? '#23272f' : undefined,
                color: theme === 'dark' ? '#e3e3e3' : undefined,
                borderRadius: 16,
                transition: 'background 0.3s, color 0.3s',
                overflow: 'visible'
            }}>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
                        ⚖️ RAGify-Bharat: Legal AI Assistant
                    </h1>
                </div>

                <div
                    style={{
                        background: theme === 'dark' ? '#23272f' : 'rgba(255,255,255,0.78)',
                        color: theme === 'dark' ? '#e3e3e3' : '#232323',
                        borderRadius: 16,
                        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                        padding: 14,
                        height: 340,
                        overflowY: 'auto',
                        marginBottom: 12,
                        transition: 'background 0.3s, color 0.3s',
                    }}
                >
                    {/* Chat Messages */}
                    {chat.length === 0 ? (
                        <p style={{ textAlign: 'center', color: theme === 'dark' ? '#888' : '#b0b0b0' }}>Start chatting with your legal assistant...</p>
                    ) : (
                        chat.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8 }}
                            >
                                <div
                                    className={msg.type === 'user' ? 'chat-message user' : 'chat-message assistant'}
                                    style={{
                                        maxWidth: '80%',
                                        backgroundColor: msg.type === 'user' ? '#6a4cff' : '#f0f0f0',
                                        color: msg.type === 'user' ? '#fff' : '#232323',
                                        borderRadius: 12,
                                        padding: '12px 40px 12px 12px',
                                        margin: '8px 16px',
                                        wordBreak: 'break-word',
                                        position: 'relative', // ensure relative for both
                                        overflow: msg.type === 'bot' ? 'visible' : 'unset' // allow icons to show for bot
                                    }}
                                >

                                {msg.text}

                                {/* Action Icons for every bot answer */}
                                {msg.type === 'bot' && msg.text && (
                                    <div style={{
                                        display: 'flex',
                                        gap: 10,
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 16,
                                        zIndex: 10,
                                    }}>
                                        <button
                                            aria-label="Copy Answer"
                                            title="Copy Answer"
                                            onClick={() => navigator.clipboard.writeText(msg.text)}
                                            style={{
                                                background: '#fff',
                                                border: '1.5px solid #e0e0e0',
                                                borderRadius: '50%',
                                                width: 28,
                                                height: 28,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                color: '#6a4cff',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10 1.5A1.5 1.5 0 0 1 11.5 3v1h1A1.5 1.5 0 0 1 14 5.5v7A1.5 1.5 0 0 1 12.5 14h-7A1.5 1.5 0 0 1 4 12.5v-1h1v1a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-1V3A1.5 1.5 0 0 0 10 1.5z"/><path d="M10 3a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5H4v1H2.5A1.5 1.5 0 0 1 1 10.5v-7A1.5 1.5 0 0 1 2.5 2h7A1.5 1.5 0 0 1 11 3v1h-1V3z"/></svg>
                                        </button>
                                        <button
                                            aria-label="Read Aloud"
                                            title="Read Aloud"
                                            onClick={() => speakText(msg.text, language)}
                                            disabled={isSpeaking}
                                            style={{
                                                background: '#fff',
                                                border: '1.5px solid #e0e0e0',
                                                borderRadius: '50%',
                                                width: 28,
                                                height: 28,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: isSpeaking ? 'not-allowed' : 'pointer',
                                                color: '#6a4cff',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                                opacity: isSpeaking ? 0.5 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <FaVolumeUp size={16} style={{ color: '#6a4cff' }} />
                                        </button>
                                    </div>
                                )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Speaker Icon - Below Chat Container */}
                {/* Removed the old Read Aloud button from below the chat container, now placed at the top right near the logo. */}

                <div className="mt-4 flex gap-2 items-center">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="chat-input"
                        style={{
                            width: 44,
                            minWidth: 44,
                            height: 40,
                            padding: '0 6px',
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 500,
                            background: theme === 'dark' ? '#23272f' : '#fff',
                            color: theme === 'dark' ? '#ffe066' : '#6a4cffcc',
                            border: `2px solid ${theme === 'dark' ? '#ffe066' : '#6a4cffcc'}`,
                            marginRight: 6,
                            cursor: 'pointer',
                            transition: 'background 0.3s, color 0.3s, border 0.3s',
                        }}
                        title="Choose Language"
                    >
                        <option value="en">🇬🇧 English</option>
                        <option value="hi">🇮🇳 हिन्दी</option>
                        <option value="gu">ગુજરાતી</option>
                        <option value="bn">বাংলা</option>
                        <option value="mr">मराठी</option>
                        <option value="ta">தமிழ்</option>
                        <option value="kn">ಕನ್ನಡ</option>
                        <option value="te">తెలుగు</option>
                        <option value="ml">മലയാളം</option>
                        <option value="pa">ਪੰਜਾਬੀ</option>
                        <option value="or">ଓଡ଼ିଆ</option>
                        <option value="as">অসমীয়া</option>
                        <option value="ur">اردو</option>
                    </select>
                    <input
                        className="chat-input"
                        style={{
                            flex: 1,
                            minWidth: 0,
                            background: theme === 'dark' ? '#23272f' : '#fff',
                            color: theme === 'dark' ? '#ffe066' : '#232323',
                            border: `2px solid ${theme === 'dark' ? '#ffe066' : '#6a4cffcc'}`,
                            borderRadius: 10,
                            padding: '0 8px',
                            fontSize: 15,
                            fontWeight: 500,
                            transition: 'background 0.3s, color 0.3s, border 0.3s',
                        }}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask your legal question here..."
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading}
                        className="send-button"
                        style={{
                            minWidth: 54,
                            padding: '9px 16px',
                            fontSize: '1.01rem',
                            background: theme === 'dark' ? '#ffe066' : undefined,
                            color: theme === 'dark' ? '#232323' : undefined,
                            border: theme === 'dark' ? '2px solid #ffe066' : undefined,
                            transition: 'background 0.3s, color 0.3s, border 0.3s',
                        }}
                    >
                        {loading ? "Thinking..." : "Send"}
                    </button>
                </div>
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="chat-input"
                    style={{
                        width: 44,
                        minWidth: 44,
                        height: 40,
                        padding: '0 6px',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 500,
                        background: theme === 'dark' ? '#23272f' : '#fff',
                        color: theme === 'dark' ? '#ffe066' : '#6a4cffcc',
                        border: `2px solid ${theme === 'dark' ? '#ffe066' : '#6a4cffcc'}`,
                        marginRight: 6,
                        cursor: 'pointer',
                        transition: 'background 0.3s, color 0.3s, border 0.3s',
                    }}
                    title="Choose Language"
                >
                    <option value="en">🇬🇧 English</option>
                    <option value="hi">🇮🇳 हिन्दी</option>
                    <option value="gu">ગુજરાતી</option>
                    <option value="bn">বাংলা</option>
                    <option value="mr">मराठी</option>
                    <option value="ta">தமிழ்</option>
                    <option value="kn">ಕನ್ನಡ</option>
                    <option value="te">తెలుగు</option>
                    <option value="ml">മലയാളം</option>
                    <option value="pa">ਪੰਜਾਬੀ</option>
                    <option value="or">ଓଡ଼ିଆ</option>
                    <option value="as">অসমীয়া</option>
                    <option value="ur">اردو</option>
                </select>
                <input
                    className="chat-input"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        background: theme === 'dark' ? '#23272f' : '#fff',
                        color: theme === 'dark' ? '#ffe066' : '#232323',
                        border: `2px solid ${theme === 'dark' ? '#ffe066' : '#6a4cffcc'}`,
                        borderRadius: 10,
                        padding: '0 8px',
                        fontSize: 15,
                        fontWeight: 500,
                        transition: 'background 0.3s, color 0.3s, border 0.3s',
                    }}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask your legal question here..."
                />
                <button
                    onClick={handleAsk}
                    disabled={loading}
                    className="send-button"
                    style={{
                        minWidth: 54,
                        padding: '9px 16px',
                        fontSize: '1.01rem',
                        background: theme === 'dark' ? '#ffe066' : undefined,
                        color: theme === 'dark' ? '#232323' : undefined,
                        border: theme === 'dark' ? '2px solid #ffe066' : undefined,
                        transition: 'background 0.3s, color 0.3s, border 0.3s',
                    }}
                >
                    {loading ? "Thinking..." : "Send"}
                </button>
            </div>
        </div>
    );
};

export default ChatBox;
