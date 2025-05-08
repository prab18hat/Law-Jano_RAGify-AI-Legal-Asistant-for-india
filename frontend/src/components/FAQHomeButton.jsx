import React from "react";
import homeIcon from '../assets/home-icon.svg';
import './FAQHomeButton.css';

export default function FAQHomeButton({ onHome }) {
  return (
    <img
      src={homeIcon}
      alt="Home"
      className="faq-home-icon"
      title="Go to Home"
      onClick={onHome}
      style={{position:'absolute',left:12,top:12,width:22,height:22,cursor:'pointer',zIndex:200,opacity:0.93}}
    />
  );
}
