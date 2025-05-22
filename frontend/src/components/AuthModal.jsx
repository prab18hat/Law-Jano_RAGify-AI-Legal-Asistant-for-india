import React, { useState } from "react";
import "./AuthModal.css";
import logo from "../assets/lawjano-logo.png";
import GoogleLoginButton from "./GoogleLoginButton";

const AuthModal = ({ show, onClose, onAuthSuccess, onSkip, mode = "login", legalSupport = false }) => {
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("user"); // "user" or "lawyer"

  if (!show) return null;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: email, role })
      });
      if (resp.ok) {
        setStep("otp");
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.detail || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: email, otp, role })
      });
      if (resp.ok) {
        const data = await resp.json();
        localStorage.setItem("token", data.token);
        onAuthSuccess && onAuthSuccess({ name, email, role });
      } else {
        const data = await resp.json().catch(() => ({}));
        setError(data.detail || "OTP verification failed");
      }
    } catch (err) {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-modal-bg">
      <div className="auth-modal-box">
        <img src={logo} alt="Logo" className="auth-logo-glow" />
        <h2 className="auth-heading-glow">{isLogin ? "Login" : "Sign Up"}</h2>
        <div className="auth-toggle">
          <button className={isLogin ? "active" : ""} onClick={() => { setIsLogin(true); setStep("form"); }}>Login</button>
          <button className={!isLogin ? "active" : ""} onClick={() => { setIsLogin(false); setStep("form"); }}>Sign Up</button>
        </div>
        {/* Role toggle */}
        <div style={{display:'flex', justifyContent:'center', gap:12, marginBottom:8}}>
          <button type="button" className={`auth-role-btn${role==="user"?" active":""}`} style={{padding:'4px 16px', borderRadius:12, border:'none', background:role==="user"?'#3ec9ff33':'#23253a', color:'#fff', fontWeight:600, cursor:'pointer', boxShadow:role==="user"?'0 0 8px #3ec9ff88':'none'}} onClick={()=>setRole("user")}>Login as User</button>
          <button type="button" className={`auth-role-btn${role==="lawyer"?" active":""}`} style={{padding:'4px 16px', borderRadius:12, border:'none', background:role==="lawyer"?'#3ec9ff33':'#23253a', color:'#fff', fontWeight:600, cursor:'pointer', boxShadow:role==="lawyer"?'0 0 8px #3ec9ff88':'none'}} onClick={()=>setRole("lawyer")}>Login as Lawyer</button>
        </div>
        {step === "form" ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (not used, for UI only)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Send OTP" : "Sign Up & Send OTP"}</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit-btn" disabled={loading}>{loading ? "Verifying..." : "Verify OTP & Login"}</button>
            <button type="button" className="auth-skip-btn" style={{marginTop:8}} onClick={() => setStep("form")}>Back</button>
          </form>
        )}
        <div style={{ margin: '1rem 0' }}>
          <GoogleLoginButton role={role} onClick={() => window.location.href = '/google/login'} />
        </div>
        {/* Show skip button only when not legalSupport */}
        {!legalSupport && (
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <button className="auth-skip-btn" style={{marginTop: 18, marginBottom: 6, color: '#6a4cff', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500, fontSize: 15, width: 'fit-content'}} onClick={onSkip}>
              Continue without login
            </button>
          </div>
        )}
        <button className="auth-close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default AuthModal;
