"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";

type VisitRequest = {
  id: number;
  name: string;
  phone: string;
  visit_date: string;
  message: string;
  created_at: string;
};

function formatDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default function AdminKunjunganPage() {
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error: loadError } = await createSupabaseBrowserClient()
          .from("visit_requests")
          .select("id, name, phone, visit_date, message, created_at")
          .order("created_at", { ascending: false });

        if (!active) return;
        if (loadError) throw loadError;
        setRequests((data ?? []) as VisitRequest[]);
      } catch {
        if (active) setError("Gagal memuat permintaan. Pastikan migrasi database sudah diterapkan.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGAJUAN DARI PENGUNJUNG</span>
          <h1>Permintaan Kunjungan</h1>
          <p>Data dari formulir halaman Kontak, diurutkan dari pengajuan terbaru.</p>
        </div>
        <span className="admin-request-count">{requests.length} permintaan</span>
      </div>

      {error && <p className="admin-form-error" role="alert">{error}</p>}
      {loading ? (
        <div className="admin-panel-card admin-empty-state">Memuat permintaan kunjungan…</div>
      ) : requests.length === 0 ? (
        <div className="admin-panel-card admin-empty-state">
          <strong>Belum ada permintaan kunjungan</strong>
          <span>Kiriman dari formulir Kontak akan tampil di sini.</span>
        </div>
      ) : (
        <div className="admin-visit-request-list">
          {requests.map((item) => (
            <article className="admin-panel-card admin-visit-request" key={item.id}>
              <div className="admin-visit-request-heading">
                <div>
                  <h2>{item.name}</h2>
                  <a href={`https://wa.me/${item.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    {item.phone}
                  </a>
                </div>
                <time dateTime={item.created_at}>Dikirim {formatDate(item.created_at, true)} WIB</time>
              </div>
              <p className="admin-visit-request-date"><strong>Tanggal kunjungan:</strong> {formatDate(`${item.visit_date}T00:00:00`)}</p>
              {item.message && <p className="admin-visit-request-message">{item.message}</p>}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
