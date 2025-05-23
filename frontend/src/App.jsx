import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import logo from "./assets/lawjano-logo.png";
import VoiceInput from "./components/VoiceInput";
import ChatBox from "./components/ChatBox";
import ProfileHistoryCard from "./components/ProfileHistoryCard";
import RelatedQuestionsPanel from "./components/RelatedQuestionsPanel";
import ChatHomeButton from "./components/ChatHomeButton";
import LandingPage from "./LandingPage";
import ResourcesPage from "./components/ResourcesPage";
import ResourcesHomeButton from "./components/ResourcesHomeButton";
import Navbar from "./components/Navbar";
import FAQPage from "./components/FAQPage";
import FAQHomeButton from "./components/FAQHomeButton";
import AuthModal from "./components/AuthModal";
import GoogleLoginButton from "./components/GoogleLoginButton";
import md5 from "blueimp-md5";
import LegalSupport from "./components/LegalSupport";
import LegalSupportHomeButton from "./components/LegalSupportHomeButton";
import Auth from "./components/Auth";

import LawyerChat from "./components/LawyerChat";

function App() {
  // Persist state to localStorage for user, page, and auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalLegalSupport, setAuthModalLegalSupport] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("token") ? true : false;
  });
  const [pendingNav, setPendingNav] = useState(null);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    let parsed = stored ? JSON.parse(stored) : { name: "Guest", avatar: null, total: 0, email: "", role: "user" };
    // Ensure uid exists for chat identity
    if (!parsed.uid && parsed.email) {
      // Use md5 to generate a deterministic uid from email
      parsed.uid = md5(parsed.email.trim().toLowerCase());
    }
    return parsed;
  });
  const [showLanding, setShowLanding] = useState(() => {
    const stored = localStorage.getItem("page");
    return stored ? stored === "landing" : true;
  });
  const [showResources, setShowResources] = useState(() => localStorage.getItem("page") === "resources");
  const [showFAQ, setShowFAQ] = useState(() => localStorage.getItem("page") === "faq");
  const [showLegalSupport, setShowLegalSupport] = useState(() => localStorage.getItem("page") === "legalsupport");
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const chatBoxRef = useRef(null);
  const [language, setLanguage] = useState("en"); // Default language is English
  const [showAuthPage, setShowAuthPage] = useState(false);

  // For LawyerChat navigation
  const [showLawyerChat, setShowLawyerChat] = useState(false);
  const [lawyerChatInfo, setLawyerChatInfo] = useState(null);
  useEffect(() => {
    window.startLawyerChat = (lawyer) => {
      setLawyerChatInfo(lawyer);
      setShowLawyerChat(true);
    };
    return () => { window.startLawyerChat = null; };
  }, []);

  // Save user and page state to localStorage on change
  useEffect(() => {
    // Ensure uid exists for chat identity
    let updated = { ...user };
    if (!updated.uid && updated.email) {
      updated.uid = md5(updated.email.trim().toLowerCase());
    }
    localStorage.setItem("user", JSON.stringify(updated));
  }, [user]);
  useEffect(() => {
    if (showLanding) localStorage.setItem("page", "landing");
    else if (showResources) localStorage.setItem("page", "resources");
    else if (showFAQ) localStorage.setItem("page", "faq");
    else if (showLegalSupport) localStorage.setItem("page", "legalsupport");
  }, [showLanding, showResources, showFAQ, showLegalSupport]);

  // Google OAuth: Check for login=success and user info in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "success") {
      const name = params.get("name") || "Google User";
      const email = params.get("email") || "";
      const role = params.get("role") || "user";
      const photo = params.get("photo") || null;
      // Try to get token from URL param, or from localStorage if already set by backend
      let token = params.get("token") || localStorage.getItem("token");
      if (!token && params.get("access_token")) token = params.get("access_token");
      if (token) localStorage.setItem("token", token);
      setUser({
        name,
        avatar: photo || (email ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=identicon` : null),
        total: 0,
        email,
        role
      });
      setIsAuthenticated(true);

      // Fetch persistent history from backend
      if (email) {
        fetch(`http://localhost:8000/user/history?email=${encodeURIComponent(email)}`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data.history)) {
              setChatHistory(data.history.map(q => ({ role: "user", content: q })));
            }
          });
      }
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      const role = params.get('role') || 'user';
      setUser({ name, email, role });
      setShowLanding(true);
      setShowAuthModal(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && isAuthenticated) {
      setIsAuthenticated(false);
    }
    if (token && !isAuthenticated) {
      setIsAuthenticated(true);
    }
  }, [isAuthenticated]);

  const handleAsk = async () => {
    if (question.trim()) {
      const userMessage = { role: "user", content: question };
      setQuestion("");
      try {
        const response = await fetch("http://localhost:8000/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question, language }),
        });
        if (response.ok) {
          const data = await response.json();
          const assistantMessage = { role: "assistant", content: data.answer, citations: data.citations || [] };
          setChatHistory((prev) => [...prev, userMessage, assistantMessage]);
          // Save question to backend for logged-in users
          if (isAuthenticated && user.email) {
            fetch("http://localhost:8000/user/history", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email, question })
            });
          }
          // Increment question counter on profile card
          setUser((prev) => ({ ...prev, total: (prev.total || 0) + 1 }));
        } else {
          const data = await response.json().catch(() => ({}));
          const assistantMessage = {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            citations: data.citations || []
          };
          setChatHistory((prev) => [...prev, userMessage, assistantMessage]);
        }
      } catch (error) {
        const assistantMessage = {
          role: "assistant",
          content: "Sorry, there was an issue with the connection.",
        };
        setChatHistory((prev) => [...prev, userMessage, assistantMessage]);
      }
    }
  };

  const handleClear = async () => {
    try {
      await fetch("http://localhost:8000/clear", {
        method: "POST",
      });
      setChatHistory([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  // Scroll to bottom when chatHistory changes
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Dummy user and related questions for demo
  const historyQuestions = chatHistory.filter(m => m.role === 'user').map(m => m.content);
  const [relatedQuestions, setRelatedQuestions] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchRelated() {
      setLoadingRelated(true);
      try {
        const resp = await fetch(`http://localhost:8000/related_questions?query=${encodeURIComponent(question)}`);
        const data = await resp.json();
        if (!ignore) setRelatedQuestions(data);
      } catch {
        if (!ignore) setRelatedQuestions([]);
      } finally {
        if (!ignore) setLoadingRelated(false);
      }
    }
    fetchRelated();
    return () => { ignore = true; };
  }, [question]);

  const handleHistoryClick = (q) => setQuestion(q);
  const handleRelatedClick = (q) => setQuestion(q);
  const handleClearHistory = () => {
    setChatHistory([]);
    setUser((prev) => ({ ...prev, total: 0 }));
  };

  const handleNavigate = (page) => {
    if (page === "legalsupport") {
      if (!isAuthenticated) {
        setShowAuthPage(true);
        setPendingNav("legalsupport");
        return;
      }
      setShowLanding(false);
      setShowResources(false);
      setShowFAQ(false);
      setShowLegalSupport(true);
      return;
    }
    if (page === "chatbot") {
      setShowLanding(false);
      setShowResources(false);
      setShowFAQ(false);
      setShowLegalSupport(false);
      return;
    }
    if (page === "resources") {
      setShowLanding(false);
      setShowResources(true);
      setShowFAQ(false);
      setShowLegalSupport(false);
      return;
    }
    if (page === "faq") {
      setShowLanding(false);
      setShowResources(false);
      setShowFAQ(true);
      setShowLegalSupport(false);
      return;
    }
  };

  // Add logout logic
  const handleLogout = async () => {
    // Optionally notify backend (stateless JWT, so just clear frontend)
    localStorage.removeItem("token");
    setUser({ name: "Guest", avatar: null, total: 0, email: "", role: "user" });
    setIsAuthenticated(false);
    setShowLanding(true);
    setShowResources(false);
    setShowFAQ(false);
    setShowLegalSupport(false);
    window.location.reload();
  };

  // Handle authentication modal success
  const handleAuthSuccess = ({ name, email, role }) => {
    setUser({ name, email, role, avatar: null, total: 0 });
    setIsAuthenticated(true);
    setShowAuthModal(false);
    setAuthModalLegalSupport(false);
    setShowAuthPage(false);
    // Navigate to pendingNav if set
    if (pendingNav === "legalsupport") {
      setShowLanding(false);
      setShowResources(false);
      setShowFAQ(false);
      setShowLegalSupport(true);
      setPendingNav(null);
    }
  };

  if (showLawyerChat && lawyerChatInfo) {
    return (
      <LawyerChat
        user={user}
        lawyerId={lawyerChatInfo.email || lawyerChatInfo.contact_email}
        lawyerName={lawyerChatInfo.name}
        lawyerAvatar={lawyerChatInfo.avatar || logo}
        onBack={() => setShowLawyerChat(false)}
      />
    );
  }

  if (showAuthPage) {
    return <Auth show={true} onClose={() => {
      setShowAuthPage(false);
      // If user just logged in, go to Legal Support
      if (isAuthenticated && pendingNav === "legalsupport") {
        setShowLanding(false);
        setShowResources(false);
        setShowFAQ(false);
        setShowLegalSupport(true);
        setPendingNav(null);
      }
    }} onAuthSuccess={handleAuthSuccess} legalSupport={true} />;
  }

  return (
    <div className="App">
      <AuthModal
        show={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setAuthModalLegalSupport(false);
        }}
        onAuthSuccess={handleAuthSuccess}
        legalSupport={authModalLegalSupport}
      />
      {showLanding && (
        <LandingPage onNavigate={handleNavigate} onLogout={handleLogout} user={user} />
      )}
      {showResources && (
        <div style={{position:'relative'}}>
          <ResourcesHomeButton onHome={() => { setShowLanding(true); setShowResources(false); setShowFAQ(false); }} />
          <Navbar onNavigate={handleNavigate} />
          <ResourcesPage />
        </div>
      )}
      {showFAQ && (
        <div>
          <div style={{position:'relative'}}>
            <FAQHomeButton onHome={() => { setShowLanding(true); setShowResources(false); setShowFAQ(false); }} />
            <Navbar onNavigate={handleNavigate} />
            <FAQPage />
          </div>
        </div>
      )}
      {showLegalSupport && (
        <div style={{position:'relative'}}>
          <Navbar onNavigate={handleNavigate} />
          <LegalSupport user={user && user.role ? user : { ...user, role: "user" }} />
        </div>
      )}
      {!showLanding && !showResources && !showFAQ && !showLegalSupport && (
        <div className="chatbot-main-container" style={{ display: 'flex', flexDirection: 'row', height: '100vh', position: 'relative' }}>
          {/* Glowing logo at top center (landing style) */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 22, display: 'flex', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
            <div style={{ background: 'radial-gradient(circle, #fff 0%, #fff 30%, #fff0 100%)', borderRadius: '50%', padding: 8, boxShadow: '0 0 18px 6px #fff6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={logo} alt="LAWJANO" style={{ width: 60, height: 60, borderRadius: '50%', boxShadow: '0 0 4px #fff4' }} />
            </div>
          </div>
          {/* Left: Profile/History */}
          <div style={{ width: 220, minWidth: 170, maxWidth: 240, margin: '24px 12px', padding: 0, background: 'none', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'center' }}>
            <ProfileHistoryCard user={user} history={historyQuestions} onHistoryClick={handleHistoryClick} onClearHistory={handleClearHistory} />
          </div>
          {/* Center: Chat */}
          <div className="chat-container" style={{ flex: '0 1 56vw', maxWidth: '56vw', minWidth: 400, display: 'flex', flexDirection: 'column', margin: 16, background: 'rgba(30,34,58,0.98)', borderRadius: 18, boxShadow: '0 0 24px #0002', position: 'relative', paddingBottom: 0, justifyContent: 'flex-start' }}>
            <div className="chat-header" style={{ display: 'flex', alignItems: 'center', padding: '8px 0 8px 8px' }}>
              <ChatHomeButton onHome={() => { setShowLanding(true); setShowResources(false); setShowFAQ(false); }} />
            </div>
            <div className="chat-box" ref={chatBoxRef} style={{ flex: 1, overflowY: 'auto', margin: '32px 0 60px 0', minHeight: 240 }}>
              {chatHistory.map((message, index) => (
                <div key={index} className={`message ${message.role === 'assistant' ? 'assistant' : 'user'}`}>
                  <div className="message-content">
                    {message.role === 'assistant' && (
                      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                        <strong>Assistant</strong>
                      </div>
                    )}
                    {message.content}
                    {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                      <div style={{ marginTop: 6, padding: '8px 14px', background: '#f5f5fa', borderRadius: 12, fontSize: 13, color: '#444', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <strong>Citations:</strong>
                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                          {message.citations.map((c, i) => (
                            <li key={i} style={{ marginBottom: 2 }}>
                              <span style={{ color: '#6a4cff', fontWeight: 600 }}>{c.section ? c.section + ' - ' : ''}</span>
                              <span>{c.text}</span>
                              <span style={{ color: '#888', fontStyle: 'italic', marginLeft: 6 }}>({c.file})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 0, marginBottom: 0, position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 24px', background: 'rgba(30,34,58,0.98)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
              <select
                value={language}
                onChange={handleLanguageChange}
                className="chat-input"
                style={{ width: 44, minWidth: 44, height: 40, padding: '0 6px', borderRadius: 10, fontSize: 15, fontWeight: 500, background: '#fff', color: '#6a4cffcc', border: '2px solid #6a4cffcc', marginRight: 6, cursor: 'pointer' }}
                title="Choose Language"
              >
                <option value="en">🇬🇧</option>
                <option value="hi">🇮🇳</option>
                <option value="ta">தமிழ்</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="bn">বাংলা</option>
                <option value="mr">मराठी</option>
                <option value="gu">ગુજરાતી</option>
                <option value="te">తెలుగు</option>
                <option value="ml">മലയാളം</option>
                <option value="pa">ਪੰਜਾਬੀ</option>
                <option value="or">ଓଡ଼ିଆ</option>
                <option value="as">অসমীয়া</option>
                <option value="ur">اردو</option>
              </select>
              <input
                type="text"
                placeholder="Type your question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                className="chat-input"
                style={{ flex: 1, minWidth: 0 }}
                autoFocus
              />
              <button onClick={handleAsk} className="send-btn">Ask</button>
              <button onClick={handleClear} className="clear-btn">Clear</button>
              <div style={{ marginLeft: 4 }}>
                <VoiceInput onVoiceInput={setQuestion} />
              </div>
            </div>
          </div>
          {/* Right: Related Questions */}
          <div style={{ width: 240, minWidth: 170, maxWidth: 260, margin: '24px 12px', marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
            <RelatedQuestionsPanel related={relatedQuestions} loading={loadingRelated} onRelatedClick={handleRelatedClick} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
