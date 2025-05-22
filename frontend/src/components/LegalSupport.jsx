import React, { useEffect, useState } from "react";
import "./LegalSupport.css";
import LegalSupportHomeButton from "./LegalSupportHomeButton";
import logo from "../assets/lawjano-logo.png";

// Card for each lawyer
function LawyerCard({ lawyer }) {
  // Copy email to clipboard
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(lawyer.contact_email);
    alert("Email copied: " + lawyer.contact_email);
  };
  return (
    <div className="lawyer-card">
      <div className="lawyer-card-header">
        <span className="lawyer-name-glow">{lawyer.name}</span>
        <span className="lawyer-degree">{lawyer.degree}</span>
      </div>
      <div className="lawyer-exp">Experience: <b>{lawyer.experience}</b></div>
      {lawyer.specialization && <div className="lawyer-special">Specialization: {lawyer.specialization}</div>}
      {lawyer.bio && <div className="lawyer-bio">{lawyer.bio}</div>}
      <div className="lawyer-contact-row" style={{display:'flex',gap:'10px'}}>
        {lawyer.telegram_username && (
          <a href={`https://t.me/${lawyer.telegram_username}`} target="_blank" rel="noopener noreferrer" className="lawyer-contact-btn" style={{background:'#229ED9', color:'#fff', border:'none', display:'flex', alignItems:'center', gap:6}} title="Chat on Telegram">
            <svg width="18" height="18" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight:4}}><circle cx="120" cy="120" r="120" fill="#229ED9"/><path d="M51.5 124.6c37.7-16.4 62.8-27.2 75.3-32.4 35.9-14.9 43.4-17.5 48.2-17.6 1.1 0 3.6.2 5.2 1.6 1.3 1.2 1.7 2.8 1.9 3.9.2 1.1.4 3.5.2 5.4-1.8 18.6-9.4 63.8-13.3 84.6-1.7 8.7-5.1 11.5-8.4 11.8-7.1.7-12.5-4.7-19.4-9.2-10.8-7.1-16.9-11.5-27.3-18.4-12.1-8-4.2-12.4 2.6-19.6 1.8-1.9 32.9-30.2 33.5-32.8.1-.3.1-1.4-.5-2-.6-.6-1.5-.4-2.2-.2-.9.2-14.7 9.3-41.6 27.3-3.9 2.7-7.5 4-10.9 3.9-3.6-.1-10.5-2-15.6-3.7-6.3-2-11.3-3-10.9-6.3.2-1.2 1.8-2.5 5-3.9z" fill="#fff"/></svg>
            Chat on Telegram
          </a>
        )}
        <button className="lawyer-contact-btn" style={{background:'#6a4cff33',color:'#6a4cff',border:'1px solid #6a4cff'}} onClick={() => window.startLawyerChat && window.startLawyerChat(lawyer)} title="Chat with this lawyer">💬 Chat</button>
      </div>
    </div>
  );
}

// Profile form for lawyers
function LawyerProfileForm({ user, onProfileUpdated }) {
  const [form, setForm] = useState({
    email: user.email,
    name: user.name,
    degree: "",
    experience: "",
    specialization: "",
    bio: "",
    telegram_username: ""
  });
  const [status, setStatus] = useState("");

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus("Saving...");
    const resp = await fetch("/lawyer/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (resp.ok) {
      setStatus("Profile updated!");
      onProfileUpdated && onProfileUpdated(form);
    } else {
      setStatus("Error saving profile");
    }
  };

  return (
    <form className="lawyer-profile-form" onSubmit={handleSubmit}>
      <div className="lawyer-profile-title">Your Lawyer Profile</div>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
      <input name="degree" value={form.degree} onChange={handleChange} placeholder="Degree" required />
      <input name="experience" value={form.experience} onChange={handleChange} placeholder="Experience (e.g. 5 years)" required />
      <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Specialization (optional)" />
      <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Short Bio (optional)" rows={3} />
      <input name="telegram_username" value={form.telegram_username} onChange={handleChange} placeholder="Telegram Username (e.g. yourusername)" type="text" />
      <button className="lawyer-profile-save-btn" type="submit">Save Profile</button>
      {status && <div className="lawyer-profile-status">{status}</div>}
    </form>
  );
}

import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function LegalSupport({ user, onHome }) {
  const [lawyers, setLawyers] = useState([]);
  const [profile, setProfile] = useState(null);
  // For lawyer notification system
  const [notifications, setNotifications] = useState([]); // [{ userId, userName, lastMessage, unreadCount }]
  const [showNotif, setShowNotif] = useState(false);

  // Listen for new messages if logged in as lawyer
  useEffect(() => {
    if (user?.role !== "lawyer" || !user?.uid) return;
    // Lawyer's UID is the hashed email (see App.jsx)
    const chatsRef = collection(db, 'chats');
    // Listen to all chat rooms where lawyer is part of the room ID
    const unsub = onSnapshot(chatsRef, async (snapshot) => {
      let notifList = [];
      for (const docSnap of snapshot.docs) {
        const chatRoomId = docSnap.id;
        if (!chatRoomId.includes(user.uid)) continue;
        // Find the other participant's UID
        const otherUid = chatRoomId.replace(user.uid + '_', '').replace('_' + user.uid, '');
        // Fetch messages for this chat
        const messagesRef = collection(db, 'chats', chatRoomId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'desc'));
        const msgSnapshot = await getDocs(q);
        let unreadCount = 0;
        let lastMessage = null;
        let userName = '';
        msgSnapshot.forEach((mDoc, idx) => {
          const msg = mDoc.data();
          if (idx === 0) {
            lastMessage = msg;
          }
          if (msg.sender !== user.uid && !msg.read) unreadCount++;
          if (!userName && msg.senderName) userName = msg.senderName;
        });
        if (lastMessage) {
          notifList.push({ userId: otherUid, userName, lastMessage, unreadCount, chatRoomId });
        }
      }
      setNotifications(notifList);
    });
    return () => unsub();
  }, [user]);

  // Fetch lawyers if user is not a lawyer
  useEffect(() => {
    if (user?.role === "lawyer") return;
    fetch("/lawyer/profiles")
      .then(res => res.json())
      .then(data => setLawyers(data));
  }, [user]);

  // Fetch own profile if lawyer
  useEffect(() => {
    if (user?.role !== "lawyer") return;
    fetch("/lawyer/profiles")
      .then(res => res.json())
      .then(data => {
        const found = data.find(l => l.email === user.email);
        if (found) setProfile(found);
      });
  }, [user]);

  const handleProfileSubmit = async e => {
    e.preventDefault();
    // Ensure email is present in profile
    const profileToSave = {
      ...profile,
      email: user.email,
      contact_email: profile.contact_email || user.email
    };
    const resp = await fetch("/lawyer/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileToSave)
    });
    if (resp.ok) {
      alert("Profile updated!");
      setProfile(profileToSave);
    } else {
      const data = await resp.json().catch(() => ({}));
      alert(data.detail || "Error saving profile");
    }
  };

  // Render for lawyers: show profile creation form and preview
  if (user?.role === "lawyer") {
    return (
      <div className="legal-support-root" style={{ position: 'relative', minHeight: '100vh', width: '100%', maxWidth: 'none', margin: 0, paddingTop: 54 }}>
        <div className="legal-support-title">Your Lawyer Profile</div>
        <div className="lawyer-profile-section" style={{display:'flex',flexWrap:'wrap',gap:'36px',justifyContent:'center',alignItems:'flex-start',marginTop:'16px'}}>
          <form className="lawyer-profile-form" style={{maxWidth:'420px',minWidth:'320px',flex:'1 1 320px',background:'#181a29cc',borderRadius:'18px',boxShadow:'0 0 18px #0008',padding:'28px 24px 18px 24px',color:'#fff'}} onSubmit={handleProfileSubmit}>
            <label className="lawyer-profile-label">Full Name
              <input className="lawyer-profile-input" type="text" value={profile?.name||''} required onChange={e=>setProfile({...profile,name:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Education
              <input className="lawyer-profile-input" type="text" value={profile?.degree||''} required onChange={e=>setProfile({...profile,degree:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Experience
              <input className="lawyer-profile-input" type="text" value={profile?.experience||''} required onChange={e=>setProfile({...profile,experience:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Specialization
              <input className="lawyer-profile-input" type="text" value={profile?.specialization||''} onChange={e=>setProfile({...profile,specialization:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Contact Email
              <input className="lawyer-profile-input" type="email" value={profile?.contact_email||user?.email||''} required onChange={e=>setProfile({...profile,contact_email:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Phone
              <input className="lawyer-profile-input" type="tel" value={profile?.phone||''} onChange={e=>setProfile({...profile,phone:e.target.value})} />
            </label>
            <label className="lawyer-profile-label">Bio
              <textarea className="lawyer-profile-input" rows={3} value={profile?.bio||''} onChange={e=>setProfile({...profile,bio:e.target.value})} />
            </label>
            <button className="lawyer-profile-save-btn" type="submit">Save Profile</button>
          </form>
          {profile && (
            <div className="lawyer-profile-preview" style={{flex:'1 1 320px',maxWidth:'420px',minWidth:'320px',background:'#23253a',borderRadius:'18px',boxShadow:'0 0 18px #3ec9ff55',padding:'24px',marginTop:'0'}}>
              <div className="lawyer-profile-title" style={{color:'#fff',fontSize:'1.25rem',fontWeight:700,marginBottom:'18px',textShadow:'0 0 8px #3ec9ff'}}>Live Profile Preview</div>
              <LawyerCard lawyer={profile} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // For normal users: show all lawyers
  return (
    <div className="legal-support-root" style={{ position: 'relative', minHeight: '100vh', width: '100%', maxWidth: 'none', margin: 0, paddingTop: 36 }}>
      {/* Lawyer notification icon */}
      {user?.role === 'lawyer' && (
        <div style={{ position: 'absolute', top: 16, right: 32, zIndex: 20 }}>
          <button onClick={() => setShowNotif(!showNotif)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }} title="View Chat Notifications">
            <span style={{ fontSize: 28, color: '#6a4cff', position: 'relative' }}>🔔</span>
            {notifications.some(n => n.unreadCount > 0) && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#ff5e5e', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: 13, fontWeight: 700 }}>{notifications.reduce((a, n) => a + n.unreadCount, 0)}</span>
            )}
          </button>
          {/* Notification dropdown */}
          {showNotif && (
            <div style={{ position: 'absolute', right: 0, top: 32, background: '#23253a', borderRadius: 12, boxShadow: '0 2px 12px #0008', minWidth: 320, maxWidth: 380, padding: 12, zIndex: 100 }}>
              <div style={{ fontWeight: 700, color: '#ffe066', marginBottom: 8 }}>New Messages</div>
              {notifications.length === 0 && <div style={{ color: '#aaa', padding: 12 }}>No new messages</div>}
              {notifications.map(n => (
                <div key={n.chatRoomId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #333' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{n.userName || n.userId}</div>
                    <div style={{ color: '#ffe066', fontSize: 14, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{n.lastMessage?.text || ''}</div>
                  </div>
                  <button style={{ marginLeft: 16, background: '#6a4cff', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => {
                      // Open chat with this user
                      window.startLawyerChat({
                        name: n.userName || n.userId,
                        email: n.userId,
                        avatar: n.lastMessage?.senderAvatar || '',
                      });
                      setShowNotif(false);
                    }}>
                    Chat
                    {n.unreadCount > 0 && <span style={{ marginLeft: 6, background: '#ff5e5e', color: '#fff', borderRadius: '50%', padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>{n.unreadCount}</span>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="legal-support-title" style={{ marginTop: 0 }}>Legal Support</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <input
          type="text"
          className="resources-search"
          style={{ width: 340, borderRadius: 16, padding: '12px 18px', background: '#23253a', color: '#fff', border: 'none', fontSize: 18, boxShadow: '0 0 6px #3ec9ff33', outline: 'none', marginRight: 12 }}
          placeholder="Search lawyers..."
          disabled
        />
        <button className="resources-search-btn" style={{ height: 44, width: 44, borderRadius: 12, background: '#3ec9ff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px #3ec9ff88', cursor: 'pointer' }} disabled>
          <svg width="22" height="22" fill="#23253a" viewBox="0 0 20 20"><path d="M12.9 14.32a8 8 0 1 1 1.41-1.41l4.3 4.3a1 1 0 0 1-1.41 1.41l-4.3-4.3ZM14 8a6 6 0 1 0-12 0 6 6 0 0 0 12 0Z" /></svg>
        </button>
      </div>
      <div className="lawyer-grid">
        {lawyers.length === 0 && <div className="no-lawyers-msg">No lawyers available yet.</div>}
        {lawyers.map(lawyer => <LawyerCard key={lawyer.email} lawyer={lawyer} />)}
      </div>
    </div>
  );
}
