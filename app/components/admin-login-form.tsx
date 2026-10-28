"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, hasSupabaseBrowserConfig } from "../../lib/supabase/browser";

export default function AdminLoginForm({ accessError = false }: { accessError?: boolean }) {
  const router = useRouter();
  const configured = hasSupabaseBrowserConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured) return;
    setBusy(true);
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      setBusy(false);

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (msg.includes("email not confirmed")) {
          setError("Email belum dikonfirmasi di Supabase Auth. Buka Supabase > Authentication > Users, klik titik tiga (...) di akun Anda lalu pilih 'Confirm email'.");
        } else if (msg.includes("invalid login credentials")) {
          setError("Email atau kata sandi tidak cocok. Anda bisa memperbarui/mereset password akun melalui dashboard Supabase (Authentication > Users).");
        } else {
          setError(`Gagal masuk (${signInError.message}).`);
        }
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err: unknown) {
      setBusy(false);
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan koneksi";
      setError(`Koneksi error: ${errorMessage}`);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="admin-login-brand" href="/" aria-label="Kembali ke situs MBS Purworejo">
          <Image src="/images/icon.png" alt="" width={52} height={52} />
          <span><strong>MBS PURWOREJO</strong><small>Panel pengelola website</small></span>
        </Link>
        <h1>Selamat datang</h1>
        <p className="admin-login-intro">Masuk untuk mengelola konten dan informasi website MBS.</p>
        {configured ? (
          <form className="admin-login-form" onSubmit={submit}>
            {accessError && <p className="admin-form-error" role="alert">Akun ini belum mendapat akses ke panel MBS. Hubungi superadmin.</p>}
            <label>
              Email
              <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Kata sandi
              <div className="admin-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan kata sandi…"
                />
                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                  title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  {showPassword ? (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            {error && <p className="admin-form-error" role="alert">{error}</p>}
            <button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Masuk ke panel"}</button>
          </form>
        ) : (
          <div className="admin-setup-note">
            <strong>Panel perlu dihubungkan terlebih dahulu</strong>
            <p>Atur variabel Supabase dari <code>.env.example</code>, jalankan migrasi di folder <code>supabase/migrations</code>, lalu buat akun admin di Supabase Auth.</p>
          </div>
        )}
        <Link className="admin-back-link" href="/">← Kembali ke website</Link>
      </section>
    </main>
  );
}
