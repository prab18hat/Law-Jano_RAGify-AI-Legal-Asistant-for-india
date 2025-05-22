import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { db } from '../firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

// UI: Modern, rounded, styled like your other pages
const LawyerChat = ({ user, lawyerId, lawyerName, lawyerAvatar, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!lawyerId || !user?.uid) return;
    // Always use sorted IDs for chat room so both user and lawyer see the same chat
    const ids = [user.uid, lawyerId].sort();
    const chatRoomId = `${ids[0]}_${ids[1]}`;
    const q = query(
      collection(db, 'chats', chatRoomId, 'messages'),
      orderBy('createdAt')
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      // If current user is a lawyer, mark all messages as read where sender !== user.uid and !read
      if (user.role === 'lawyer' && msgs.some(m => m.sender !== user.uid && !m.read)) {
        for (const m of msgs) {
          if (m.sender !== user.uid && !m.read) {
            try {
              await import('firebase/firestore').then(({ doc, updateDoc }) =>
                updateDoc(doc(db, 'chats', chatRoomId, 'messages', m.id), { read: true })
              );
            } catch (err) { /* ignore */ }
          }
        }
      }
    });
    return unsub;
  }, [lawyerId, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.uid) {
      setError(!user?.uid ? 'You must be logged in to send messages.' : 'Cannot send empty message.');
      setTimeout(() => setError(''), 2500);
      return;
    }
    setSending(true);
    setError('');
    try {
      const ids = [user.uid, lawyerId].sort();
      const chatRoomId = `${ids[0]}_${ids[1]}`;
      await addDoc(collection(db, 'chats', chatRoomId, 'messages'), {
        text: input.trim(),
        sender: user.uid,
        senderName: user.name || user.displayName || user.email || 'User',
        senderAvatar: user.avatar || user.photoURL || '',
        createdAt: serverTimestamp(),
        read: user.role === 'lawyer' ? true : false, // lawyer's own messages are read
      });
      setInput('');
    } catch (err) {
      setError('Failed to send message. Please check your internet or Firebase config.');
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };


  return (
    <div style={{
      width: '100%',
      maxWidth: 480,
      margin: '40px auto',
      background: '#23272f',
      borderRadius: 16,
      boxShadow: '0 2px 16px rgba(106,76,255,0.10)',
      color: '#e3e3e3',
      display: 'flex',
      flexDirection: 'column',
      height: '80vh',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: 16, borderBottom: '1px solid #444', background: '#23272f', borderTopLeftRadius: 16, borderTopRightRadius: 16
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#ffe066', fontSize: 22, marginRight: 16, cursor: 'pointer' }}>
          <FaArrowLeft />
        </button>
        {lawyerAvatar && <img src={lawyerAvatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 12 }} />}
        <span style={{ fontWeight: 600, fontSize: 18 }}>{lawyerName || 'Lawyer'}</span>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#20232a' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: msg.sender === user?.uid ? 'row-reverse' : 'row',
            marginBottom: 12,
          }}>
            {msg.senderAvatar && <img src={msg.senderAvatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 8px' }} />}
            <div style={{
              background: msg.sender === user?.uid ? '#6a4cff' : '#2d2d38',
              color: msg.sender === user?.uid ? '#fff' : '#ffe066',
              borderRadius: 12,
              padding: '10px 16px',
              maxWidth: 280,
              fontSize: 15,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
              wordBreak: 'break-word',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              {msg.text}
              {/* Show green dot if unread and current user is lawyer */}
              {user.role === 'lawyer' && msg.sender !== user.uid && !msg.read && (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3ec97a', display: 'inline-block', marginLeft: 8 }} title="Unread"></span>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {/* Input */}
      {error && (
        <div style={{ color: '#ff5e5e', background: '#2d2d38', padding: '8px 16px', borderRadius: 10, margin: '12px 24px', textAlign: 'center', fontWeight: 500 }}>
          {error}
        </div>
      )}
      {(!user?.uid) && (
        <div style={{ color: '#ffe066', background: '#2d2d38', padding: '8px 16px', borderRadius: 10, margin: '12px 24px', textAlign: 'center', fontWeight: 500 }}>
          Please log in to send and receive messages.
        </div>
      )}
      {/* If user prop missing, show a warning */}
      {(!user) && (
        <div style={{ color: '#ff5e5e', background: '#2d2d38', padding: '8px 16px', borderRadius: 10, margin: '12px 24px', textAlign: 'center', fontWeight: 500 }}>
          User info not provided! Please contact admin.
        </div>
      )}
      <form onSubmit={sendMessage} style={{ display: 'flex', padding: 16, borderTop: '1px solid #444', background: '#23272f', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={sending || !user?.uid}
          style={{
            flex: 1,
            background: '#181a20',
            color: '#ffe066',
            border: '2px solid #6a4cff',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 16,
            outline: 'none',
            marginRight: 8,
            transition: 'border 0.2s',
            opacity: sending || !user?.uid ? 0.6 : 1,
          }}
        />
        <button type="submit" disabled={sending || !user?.uid} style={{
          background: '#6a4cff',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '0 18px',
          fontSize: 18,
          fontWeight: 600,
          cursor: sending || !user?.uid ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          opacity: sending || !user?.uid ? 0.6 : 1,
        }}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

LawyerChat.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string,
    displayName: PropTypes.string,
    photoURL: PropTypes.string,
  }),
  lawyerId: PropTypes.string.isRequired,
  lawyerName: PropTypes.string,
  lawyerAvatar: PropTypes.string,
  onBack: PropTypes.func.isRequired,
};

export default LawyerChat;
