import React from "react";
import AuthModal from "./AuthModal";

export default function Auth({ show, onClose, onAuthSuccess, legalSupport = false }) {
  // This wrapper always renders the AuthModal as a PAGE, not a modal
  return (
    <div style={{ minHeight: '100vh', width: '100vw', background: '#191b2a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <AuthModal
        show={show}
        onClose={onClose}
        onAuthSuccess={onAuthSuccess}
        legalSupport={legalSupport}
      />
    </div>
  );
}
