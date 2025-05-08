import React from "react";
import "./Navbar.css";

const navLinks = [
  { name: "Chatbot", key: "chatbot" },
  { name: "Resources", key: "resources" },
  { name: "Legal Support", key: "legalsupport" },
  { name: "FAQ", key: "faq" },
];

export default function Navbar({ onNavigate }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    // Close nav menu on window resize above 700px
    const handleResize = () => {
      if (window.innerWidth > 700 && open) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);
  return (
    <nav className={`navbar${open ? ' open' : ''}`} style={{position:'relative'}}>

      <button className="navbar-hamburger" onClick={() => setOpen((v) => !v)} aria-label="Menu">☰</button>
      <ul className="navbar-list" style={open || window.innerWidth > 700 ? {display:'flex'} : {}}>
        {navLinks.map((link) => (
          <li key={link.name} className="navbar-item">
            {link.key === "chatbot" ? (
              <span className="navbar-link" onClick={() => { setOpen(false); onNavigate && onNavigate("chatbot") }}>{link.name}</span>
            ) : link.key === "resources" ? (
              <span className="navbar-link" onClick={() => { setOpen(false); onNavigate && onNavigate("resources") }}>{link.name}</span>
            ) : link.key === "faq" ? (
              <span className="navbar-link" onClick={() => { setOpen(false); onNavigate && onNavigate("faq") }}>{link.name}</span>
            ) : link.key === "legalsupport" ? (
              <span className="navbar-link" onClick={() => { setOpen(false); onNavigate && onNavigate("legalsupport") }}>{link.name}</span>
            ) : (
              <span className="navbar-link" onClick={() => setOpen(false)}>{link.name}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
