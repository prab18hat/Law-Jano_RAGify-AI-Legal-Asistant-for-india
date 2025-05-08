import React from "react";
import './RelatedQuestionsPanel.css';

const RelatedQuestionsPanel = ({ related, onRelatedClick }) => {
  return (
    <div className="related-questions-panel">
      <div className="related-title">Related Questions</div>
      <ul className="related-list">
        {related.length === 0 ? (
          <li className="related-empty">No suggestions yet.</li>
        ) : (
          related.slice(0, 6).map((q, idx) => (
            <li key={idx} className="related-item" onClick={() => onRelatedClick(q)} title={q}>
              <span>{q.length > 38 ? q.slice(0, 38) + '…' : q}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RelatedQuestionsPanel;
