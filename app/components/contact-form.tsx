"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function submitVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const date = String(formData.get("date") ?? "");
    const message = String(formData.get("message") ?? "");
    const text = [
      "Assalamu’alaikum, saya ingin menjadwalkan kunjungan ke MBS Purworejo.",
      `Nama: ${name}`,
      `Nomor WhatsApp: ${phone}`,
      `Tanggal kunjungan: ${date}`,
      message ? `Pesan: ${message}` : "",
    ].filter(Boolean).join("\n");

    setSent(true);
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form className="visit-form" onSubmit={submitVisit}>
      <label htmlFor="visit-name">Nama<span aria-hidden="true">*</span></label>
      <input id="visit-name" name="name" autoComplete="name" required />

      <label htmlFor="visit-phone">Nomor Telp/WhatsApp<span aria-hidden="true">*</span></label>
      <input id="visit-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required />

      <label htmlFor="visit-date">Tanggal Kunjungan<span aria-hidden="true">*</span></label>
      <input id="visit-date" name="date" type="date" required />

      <label htmlFor="visit-message">Pesan</label>
      <textarea id="visit-message" name="message" rows={5} />

      <button className="button button-green visit-submit" type="submit">
        {sent ? "Kirim ulang melalui WhatsApp" : "Jadwalkan kunjungan"}
      </button>
    </form>
  );
}
