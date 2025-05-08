import React from "react";
import logo from "../assets/lawjano-logo.png";
import "./ResourcesHomeButton.css";

export default function LegalSupportHomeButton({ onHome }) {
  return (
    <button className="resources-home-btn" onClick={onHome} title="Back to Home" style={{position:'absolute', left:18, top:18, zIndex:10}}>
      <img src={logo} alt="Home" style={{ width: 36, height: 36, borderRadius: 12, boxShadow: '0 0 8px #3ec9ff88' }} />
    </button>
  );
}
