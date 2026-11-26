"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function submitVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    setStatus("");

    try {
      const response = await fetch("/api/visit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Permintaan kunjungan gagal dikirim.");
      form.reset();
      setStatus("Permintaan kunjungan berhasil dikirim. Admin akan menindaklanjutinya.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="visit-form" onSubmit={submitVisit}>
      <label className="visit-form-trap" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label htmlFor="visit-name">Nama<span aria-hidden="true">*</span></label>
      <input id="visit-name" name="name" autoComplete="name" maxLength={120} required />

      <label htmlFor="visit-phone">Nomor Telp/WhatsApp<span aria-hidden="true">*</span></label>
      <input id="visit-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={32} required />

      <label htmlFor="visit-date">Tanggal Kunjungan<span aria-hidden="true">*</span></label>
      <input id="visit-date" name="date" type="date" required />

      <label htmlFor="visit-message">Pesan</label>
      <textarea id="visit-message" name="message" rows={5} maxLength={2000} />

      <button className="button button-green visit-submit" type="submit" disabled={sending}>
        {sending ? "Mengirim…" : "Jadwalkan kunjungan"}
      </button>
      {status && <p className="visit-form-status" role="status">{status}</p>}
    </form>
  );
}
