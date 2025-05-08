import React from "react";
import './ProfileHistoryCard.css';

const ProfileHistoryCard = ({ user, history, onHistoryClick, onClearHistory }) => {
  return (
    <div className="profile-history-card">
      <div className="profile-section">
        <div className="avatar">{user.avatar ? <img src={user.avatar} alt="avatar" /> : <span>👤</span>}</div>
        <div className="profile-details">
          <div className="profile-name">{user.name || "Guest"}</div>
          <div className="profile-meta">Total questions: <span style={{color:'#6a4cff',fontWeight:500}}>{user.total || 0}</span></div>
        </div>
      </div>
      <div className="history-section">
        <div className="history-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Recent Questions</span>
          <button className="clear-history-btn" onClick={onClearHistory} title="Clear history">🗑</button>
        </div>
        <ul className="history-list">
          {history.length === 0 ? (
            <li className="history-empty">No history yet.</li>
          ) : (
            history.slice(-6).reverse().map((item, idx) => (
              <li key={idx} className="history-item" onClick={() => onHistoryClick(item)} title={item}>
                <span>{item.length > 32 ? item.slice(0, 32) + '…' : item}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProfileHistoryCard;
