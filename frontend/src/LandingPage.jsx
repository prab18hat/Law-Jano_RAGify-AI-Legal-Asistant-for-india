import React from "react";
import './LandingPage.css';
import Navbar from "./components/Navbar";
import logo from "./assets/lawjano-logo.png";

export default function LandingPage({ onNavigate, onLogout, user }) {
  const [showLogoModal, setShowLogoModal] = React.useState(false);
  return (
    <div className="landing-root">
      <Navbar onNavigate={onNavigate} />
      {/* --- FORCE LOGOUT BUTTON ALWAYS RENDERED FOR DEBUG --- */}
      <button
        onClick={onLogout}
        title="Logout"
        style={{
          position: 'fixed',
          top: 6,
          right: 6,
          zIndex: 99999,
          background: 'rgba(35,37,58,0.92)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 24,
          height: 24,
          fontSize: 14,
          boxShadow: '0 0 5px #3ec9ffbb',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85,
          transition: 'background 0.2s, opacity 0.2s',
        }}
        className="logout-btn"
      >
        <span role="img" aria-label="logout">⎋</span>
      </button>
      {/* Logo Modal Popup */}
      {showLogoModal && (
        <div className="logo-modal-backdrop" onClick={() => setShowLogoModal(false)}>
          <div className="logo-modal" onClick={e => e.stopPropagation()}>
            <img src={logo} alt="Law Jano Logo" className="modal-logo" />
            <h2 className="modal-title">Law Jano</h2>
            <p className="modal-desc">Your trusted legal companion for smart, reliable answers.</p>
            <button className="modal-close" onClick={() => setShowLogoModal(false)}>Close</button>
          </div>
        </div>
      )}
      {/* Center main heading container in the middle of the page, all other logic and UI untouched */}
      <div className="landing-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
        <div className="landing-card" style={{ padding: '30px 32px 24px 32px', maxWidth: 430, position:'relative' }} >
          <div className="logo-backdrop" style={{cursor:'pointer'}} onClick={() => setShowLogoModal(true)}>
            <img src={logo} alt="Law Jano Logo" className="landing-law-icon" />
          </div>
          <h1 className="landing-heading">आपका कानूनी साथी — <span className="brand-highlight">Law Jano</span></h1>
          <div className="landing-subheading">Smart. Reliable. Legal answers at your fingertips.</div>
          {/* ASK NOW button below main heading */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button
              style={{
                background: 'linear-gradient(90deg,#6a4cff 0%,#8ec5fc 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.07rem',
                border: 'none',
                borderRadius: 12,
                padding: '13px 38px',
                boxShadow: '0 2px 16px #6a4cff40',
                cursor: 'pointer',
                letterSpacing: '0.01em',
                transition: 'background 0.2s, transform 0.13s, box-shadow 0.2s',
                outline: 'none'
              }}
              onClick={() => onNavigate && onNavigate('chatbot')}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = ''}
            >
              Ask Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
