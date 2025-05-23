import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import "./ResourcesPage.css";

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      try {
        let resp = await fetch(`${API_URL}/api/resources`);
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        setResources(data);
        setError(null);
      } catch (err1) {
        try {
          let resp = await fetch(`${API_URL}/api/resources`);
          if (!resp.ok) throw new Error();
          const data = await resp.json();
          setResources(data);
          setError(null);
        } catch (err2) {
          setResources([]);
          setError("Could not load resources. Please check your connection or try again later.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  // Show all resources until user types something
  const filtered = search.trim() === ""
    ? resources
    : resources.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="resources-root">
      <h1 className="resources-heading">Legal Resources</h1>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
        <input
          className="resources-search"
          placeholder="Search acts, categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
          style={{flex:1}}
        />
        <button
          className="resources-search-btn"
          style={{padding:'3px 9px',height:32,minWidth:32,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'none',background:'linear-gradient(90deg,#8ec5fc 0%,#6a4cff 100%)',color:'#232323',fontWeight:600,fontSize:'1.04rem',boxShadow:'0 2px 12px #6a4cff20',cursor:'pointer',transition:'background 0.2s'}}
          tabIndex={0}
          aria-label="Search"
        >
          <span style={{fontSize:'1.15em',lineHeight:1,display:'block',marginTop:1}}>🔍</span>
        </button>
      </div>
      {loading ? (
        <div className="resources-loading">Loading resources...</div>
      ) : error ? (
        <div className="resources-empty" style={{color:'#ff4e50', fontWeight:600}}>{error}</div>
      ) : (
        <div className="resources-grid">
          {filtered.length === 0 ? (
            <div className="resources-empty">No resources found.</div>
          ) : (
            filtered.map((r, i) => (
              <div className="resource-card" key={i}>
                <div className="resource-category">{r.category}</div>
                <div className="resource-title">{r.title}</div>
                <div className="resource-desc">{r.description}</div>
                <div className="resource-buttons">
                  {r.readUrl && r.readUrl.endsWith('.pdf') ? (
                    <a href={r.readUrl} target="_blank" rel="noopener noreferrer" className="resource-btn">Read Online</a>
                  ) : (
                    <button className="resource-btn" style={{opacity:0.6,cursor:'not-allowed'}} title="PDF not available" disabled>Read Online</button>
                  )}
                  {r.pdfUrl && r.pdfUrl.endsWith('.pdf') ? (
                    <a href={r.pdfUrl} target="_blank" rel="noopener noreferrer" className="resource-btn">Download PDF</a>
                  ) : (
                    <button className="resource-btn" style={{opacity:0.6,cursor:'not-allowed'}} title="PDF not available" disabled>Download PDF</button>
                  )}
                  {r.officialUrl ? (
                    <a href={r.officialUrl} target="_blank" rel="noopener noreferrer" className="resource-btn">Official Link</a>
                  ) : (
                    <button className="resource-btn" style={{opacity:0.6,cursor:'not-allowed'}} title="Official link not available" disabled>Official Link</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
