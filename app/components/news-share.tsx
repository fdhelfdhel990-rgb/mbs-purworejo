"use client";

import { useState } from "react";

function ShareIcon({ name }: { name: "whatsapp" | "facebook" | "instagram" | "link" | "check" }) {
  if (name === "whatsapp") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.1Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8.4 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4-.1.6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .4-.2 1.3-.8 1.7-.6.5-1.4.7-2.3.5-1-.2-2.3-.7-3.9-2.1-1.9-1.7-3-3.8-3.2-4.7-.2-.9 0-1.5.3-1.9.4-.4.8-.6 1-.6Z" fill="currentColor" /></svg>;
  if (name === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z" /></svg>;
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.6" cy="6.5" r="1.2" fill="currentColor" /></svg>;
  if (name === "check") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function NewsShare({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const shareText = encodeURIComponent(title);
  const openShare = (event: React.MouseEvent<HTMLAnchorElement>, service: "whatsapp" | "facebook") => {
    event.preventDefault();
    const url = encodeURIComponent(window.location.href);
    const destination = service === "whatsapp"
      ? `https://wa.me/?text=${shareText}%20${url}`
      : `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(destination, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="detail-share" aria-label="Bagikan berita">
      <a className="share-whatsapp" href="https://wa.me/" onClick={(event) => openShare(event, "whatsapp")} aria-label="Bagikan melalui WhatsApp"><ShareIcon name="whatsapp" /></a>
      <a className="share-facebook" href="https://www.facebook.com/sharer/" onClick={(event) => openShare(event, "facebook")} aria-label="Bagikan melalui Facebook"><ShareIcon name="facebook" /></a>
      <a className="share-instagram" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Buka Instagram"><ShareIcon name="instagram" /></a>
      <button className="share-copy" type="button" onClick={copyLink} aria-label={copied ? "Tautan tersalin" : "Salin tautan berita"}><ShareIcon name={copied ? "check" : "link"} /></button>
      <span className="share-status" aria-live="polite">{copied ? "Tautan tersalin" : ""}</span>
    </div>
  );
}
