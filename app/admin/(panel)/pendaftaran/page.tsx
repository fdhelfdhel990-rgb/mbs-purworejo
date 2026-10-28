"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import { type RegistrationTrack, defaultRegistrationTracks } from "../../../data/public-cms";

type PendaftaranContent = {
  registrationAcademicYear: string;
  registrationUrl: string;
  registrationTracks: RegistrationTrack[];
};

const initialPendaftaran: PendaftaranContent = {
  registrationAcademicYear: "PSB Tahun Ajaran 2026/2027",
  registrationUrl: "https://forms.google.com",
  registrationTracks: defaultRegistrationTracks,
};

export default function AdminPendaftaranPage() {
  const [data, setData] = useState<PendaftaranContent>(initialPendaftaran);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: row, error: loadError } = await createSupabaseBrowserClient()
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();

      if (!active) return;
      if (row?.data && typeof row.data === "object") {
        const d = row.data as Record<string, unknown>;
        setData({
          registrationAcademicYear: typeof d.registrationAcademicYear === "string" ? d.registrationAcademicYear : initialPendaftaran.registrationAcademicYear,
          registrationUrl: typeof d.registrationUrl === "string" ? d.registrationUrl : initialPendaftaran.registrationUrl,
          registrationTracks: Array.isArray(d.registrationTracks) && d.registrationTracks.length > 0
            ? (d.registrationTracks as RegistrationTrack[])
            : defaultRegistrationTracks,
        });
      }
      if (loadError) {
        setError("Pengaturan pendaftaran belum termuat dari database.");
      }
      setLoading(false);
    })();

    return () => { active = false; };
  }, []);

  const handleTrackChange = (index: number, field: keyof RegistrationTrack, value: string) => {
    setData((curr) => {
      const updated = [...curr.registrationTracks];
      updated[index] = { ...updated[index], [field]: value };
      return { ...curr, registrationTracks: updated };
    });
  };

  const handleAddTrack = () => {
    setData((curr) => ({
      ...curr,
      registrationTracks: [
        ...curr.registrationTracks,
        {
          id: `track-${Date.now().toString(36)}`,
          name: "Jalur baru",
          status: "Pendaftaran dibuka",
          description: "Informasi jadwal melalui panitia PSB",
          url: "",
        },
      ],
    }));
  };

  const handleRemoveTrack = (index: number) => {
    if (data.registrationTracks.length <= 1) return;
    setData((curr) => ({
      ...curr,
      registrationTracks: curr.registrationTracks.filter((_, i) => i !== index),
    }));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const client = createSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();

      // Ambil data homepage yang ada agar data lain (hero, profil, banner) tidak tertimpa
      const { data: existingRow } = await client
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();

      const existingData = existingRow?.data && typeof existingRow.data === "object" ? existingRow.data : {};

      const mergedData = {
        ...existingData,
        registrationAcademicYear: data.registrationAcademicYear.trim() || initialPendaftaran.registrationAcademicYear,
        registrationUrl: data.registrationUrl.trim() || initialPendaftaran.registrationUrl,
        registrationTracks: data.registrationTracks,
      };

      const { error: saveError } = await client
        .from("site_settings")
        .upsert({
          key: "homepage",
          data: mergedData,
          public_visible: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        throw new Error(saveError.message);
      }

      await fetch("/api/admin/revalidate", { method: "POST" });
      setMessage("Pengaturan pendaftaran santri baru (PSB) berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? `Gagal menyimpan: ${err.message}` : "Terjadi kesalahan saat menyimpan pengaturan pendaftaran.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENERIMAAN SANTRI BARU (PSB)</span>
          <h1>Pengaturan Pendaftaran</h1>
          <p>Kelola tahun ajaran, tautan Google Formulir pendaftaran utama, dan daftar jalur pendaftaran pada kartu PSB di halaman depan.</p>
        </div>
      </div>

      <form className="admin-panel-card admin-settings-form" onSubmit={save}>
        {/* Pengaturan Formulir Utama */}
        <div className="admin-card-heading">
          <div>
            <h2>Tautan Utama Google Formulir & Tahun Ajaran</h2>
            <p>Tautan default yang digunakan untuk tombol &quot;Daftar sekarang&quot; di beranda.</p>
          </div>
        </div>

        <div className="admin-content-form">
          <label className="is-wide">
            Judul / Periode Tahun Ajaran PSB
            <input
              type="text"
              required
              placeholder="Contoh: PSB Tahun Ajaran 2026/2027"
              value={data.registrationAcademicYear}
              onChange={(e) => setData((curr) => ({ ...curr, registrationAcademicYear: e.target.value }))}
            />
            <small>Judul ini akan tampil sebagai tajuk utama pada kartu pendaftaran di beranda.</small>
          </label>

          <label className="is-wide">
            Tautan Google Formulir Utama
            <input
              type="text"
              required
              placeholder="Contoh: https://forms.gle/..."
              value={data.registrationUrl}
              onChange={(e) => setData((curr) => ({ ...curr, registrationUrl: e.target.value }))}
            />
            <small>Masukkan URL lengkap Google Form pendaftaran santri baru.</small>
          </label>
        </div>

        {/* Pengaturan Jalur Pendaftaran */}
        <div className="admin-card-heading admin-settings-heading">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2>Jalur Pendaftaran (Card PSB)</h2>
              <p>Kelola jalur yang tersedia, seperti Jalur Prestasi, Reguler, Tahfidz, Beasiswa, dsb.</p>
            </div>
            <button
              type="button"
              className="admin-primary-button"
              style={{ fontSize: "12px", padding: "6px 14px" }}
              onClick={handleAddTrack}
            >
              ＋ Tambah Jalur Pendaftaran
            </button>
          </div>
        </div>

        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ display: "grid", gap: "12px" }}>
            {data.registrationTracks.map((track, idx) => (
              <div
                key={track.id || idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1.3fr 1fr auto",
                  gap: "10px",
                  alignItems: "end",
                  padding: "14px",
                  background: "#f7faf7",
                  border: "1px solid #dce4dc",
                  borderRadius: "8px",
                }}
              >
                <label style={{ margin: 0, fontSize: "11.5px", fontWeight: 600, color: "#2d4432" }}>
                  Nama Jalur
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jalur prestasi"
                    value={track.name}
                    onChange={(e) => handleTrackChange(idx, "name", e.target.value)}
                    style={{ marginTop: "4px", width: "100%", padding: "7px 10px", fontSize: "12.5px" }}
                  />
                </label>
                <label style={{ margin: 0, fontSize: "11.5px", fontWeight: 600, color: "#2d4432" }}>
                  Status
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pendaftaran dibuka"
                    value={track.status}
                    onChange={(e) => handleTrackChange(idx, "status", e.target.value)}
                    style={{ marginTop: "4px", width: "100%", padding: "7px 10px", fontSize: "12.5px" }}
                  />
                </label>
                <label style={{ margin: 0, fontSize: "11.5px", fontWeight: 600, color: "#2d4432" }}>
                  Keterangan Singkat
                  <input
                    type="text"
                    placeholder="Contoh: Seleksi dan informasi menyusul"
                    value={track.description}
                    onChange={(e) => handleTrackChange(idx, "description", e.target.value)}
                    style={{ marginTop: "4px", width: "100%", padding: "7px 10px", fontSize: "12.5px" }}
                  />
                </label>
                <label style={{ margin: 0, fontSize: "11.5px", fontWeight: 600, color: "#2d4432" }}>
                  Link Khusus (Opsional)
                  <input
                    type="text"
                    placeholder="Kosongkan jika pakai link utama"
                    value={track.url || ""}
                    onChange={(e) => handleTrackChange(idx, "url", e.target.value)}
                    style={{ marginTop: "4px", width: "100%", padding: "7px 10px", fontSize: "12.5px" }}
                  />
                </label>
                <button
                  type="button"
                  className="admin-danger-button"
                  title="Hapus jalur ini"
                  style={{ height: "35px", padding: "0 10px", fontSize: "13px" }}
                  disabled={data.registrationTracks.length <= 1}
                  onClick={() => handleRemoveTrack(idx)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Pratinjau Kartu Pendaftaran di Beranda</h2>
            <p>Tampilan kartu seperti yang dilihat oleh calon santri dan orang tua murid.</p>
          </div>
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <div className="schedule" style={{ maxWidth: "560px", margin: "0 auto" }}>
            <span className="schedule-label">Jalur pendaftaran</span>
            <h3>{data.registrationAcademicYear || "PSB Tahun Ajaran 2026/2027"}</h3>
            {data.registrationTracks.map((track, idx) => (
              <div className="schedule-row" key={track.id || idx}>
                <strong>{track.name || "Nama Jalur"}</strong>
                <span>
                  <b>{track.status || "Status"}</b>
                  {track.description || "Keterangan"}
                </span>
                <span className="schedule-status">Daftar</span>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="admin-form-error" role="alert" style={{ margin: "0 24px 16px" }}>{error}</p>}
        {message && <p className="admin-success" role="status" style={{ margin: "0 24px 16px" }}>{message}</p>}

        <div className="admin-form-actions">
          <button className="admin-primary-button" type="submit" disabled={saving || loading}>
            {saving ? "Menyimpan…" : loading ? "Memuat…" : "Simpan Pengaturan Pendaftaran"}
          </button>
          <Link href="/#pendaftaran" target="_blank" className="admin-secondary-button">
            Lihat di Beranda ↗
          </Link>
        </div>
      </form>
    </>
  );
}

