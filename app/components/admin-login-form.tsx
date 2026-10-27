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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await createSupabaseBrowserClient().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signInError) {
      setError("Email atau kata sandi tidak sesuai.");
      return;
    }
    router.replace("/admin");
    router.refresh();
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
            <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Kata sandi<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
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
