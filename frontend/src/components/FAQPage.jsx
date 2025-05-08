import React from "react";
import "./FAQPage.css";

const faqs = [
  {
    question: "What is LawJano?",
    answer: "LawJano is an AI-powered legal assistant designed to help users find reliable legal information, official resources, and quick answers to common legal questions in India."
  },
  {
    question: "Is LawJano a replacement for a lawyer?",
    answer: "No, LawJano is not a substitute for professional legal advice or representation. For any legal proceedings or personalized guidance, please consult a licensed lawyer."
  },
  {
    question: "How do I use the chatbot?",
    answer: "Simply type your legal question in the chatbot box and press 'Ask'. The AI will provide a response based on official sources and legal documents."
  },
  {
    question: "Are the resources provided official and up to date?",
    answer: "Yes, all resources are sourced from official government and legal portals. We strive to keep them updated, but always verify with the original source for the latest changes."
  },
  {
    question: "Can I download legal documents?",
    answer: "Yes, you can download PDFs of acts and laws directly from the Resources page, provided the official link is available."
  },
];

export default function FAQPage() {
  return (
    <div className="faq-root">
      <h1 className="faq-heading">Frequently Asked Questions</h1>
      <div className="faq-list">
        {faqs.slice(0,5).map((faq, idx) => (
          <div className="faq-card fade-in" key={idx}>
            <div className="faq-question">{faq.question}</div>
            <div className="faq-answer">{faq.answer}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
