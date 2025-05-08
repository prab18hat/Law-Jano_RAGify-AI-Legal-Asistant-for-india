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
        {lawyer.contact_email && (
          <>
            <a href={`mailto:${lawyer.contact_email}`} className="lawyer-contact-btn" title={`Send email to ${lawyer.contact_email}`}>Contact</a>
            <button className="lawyer-contact-btn" style={{background:'#3ec9ff33',color:'#3ec9ff',border:'1px solid #3ec9ff'}} onClick={handleCopyEmail} title="Copy email to clipboard">📋</button>
          </>
        )}
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
    contact_email: user.email,
    phone: ""
  });
  const [status, setStatus] = useState("");

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus("Saving...");
    const resp = await fetch("http://localhost:8000/lawyer/profile", {
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
      <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Contact Email" type="email" required />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone (optional)" />
      <button className="lawyer-profile-save-btn" type="submit">Save Profile</button>
      {status && <div className="lawyer-profile-status">{status}</div>}
    </form>
  );
}

export default function LegalSupport({ user, onHome }) {
  const [lawyers, setLawyers] = useState([]);
  const [profile, setProfile] = useState(null);

  // Fetch lawyers if user is not a lawyer
  useEffect(() => {
    if (user?.role === "lawyer") return;
    fetch("http://localhost:8000/lawyer/profiles")
      .then(res => res.json())
      .then(data => setLawyers(data));
  }, [user]);

  // Fetch own profile if lawyer
  useEffect(() => {
    if (user?.role !== "lawyer") return;
    fetch("http://localhost:8000/lawyer/profiles")
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
    const resp = await fetch("http://localhost:8000/lawyer/profile", {
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
