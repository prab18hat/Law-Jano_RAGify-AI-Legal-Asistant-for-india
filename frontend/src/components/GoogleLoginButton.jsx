import React from "react";
import googleLogo from "../assets/google-logo.png";

const GoogleLoginButton = ({ onClick, role }) => {
  function handleClick() {
    window.location.href = `/google/login?role=${role||'user'}`;
  }
  return (
    <button className="google-login-btn" onClick={handleClick}>
      <img src={googleLogo} alt="Google" style={{width:22,marginRight:8,verticalAlign:'middle'}} />
      Sign in with Google
    </button>
  );
};

export default GoogleLoginButton;
