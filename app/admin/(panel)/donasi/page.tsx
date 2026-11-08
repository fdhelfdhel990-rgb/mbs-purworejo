"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import {
  type BankAccount,
  type DonationSettings,
  defaultDonationSettings,
} from "../../../data/public-cms";
import ImageUploadDropzone from "../../components/image-upload-dropzone";

export default function AdminDonasiPage() {
  const [data, setData] = useState<DonationSettings>(defaultDonationSettings);
  const [savedSnapshot, setSavedSnapshot] = useState<DonationSettings>(defaultDonationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [quickAmountsStr, setQuickAmountsStr] = useState("25000, 50000, 100000, 250000, 500000, 1000000");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: row, error: loadError } = await createSupabaseBrowserClient()
          .from("site_settings")
          .select("data")
          .eq("key", "donation")
          .maybeSingle();

        if (!active) return;
        if (row?.data && typeof row.data === "object") {
          const d = row.data as Partial<DonationSettings>;
          const loaded: DonationSettings = {
            ...defaultDonationSettings,
            ...d,
            bankAccounts: Array.isArray(d.bankAccounts) && d.bankAccounts.length > 0
              ? (d.bankAccounts as BankAccount[])
              : defaultDonationSettings.bankAccounts,
          };
          setData(loaded);
          setSavedSnapshot(loaded);
          if (Array.isArray(loaded.quickAmounts)) {
            setQuickAmountsStr(loaded.quickAmounts.join(", "));
          }
        }
        if (loadError) {
          setError("Pengaturan donasi belum termuat dari database. Menggunakan setelan standar.");
        }
      } catch {
        setError("Gagal menghubungi server database.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleBankChange = (index: number, field: keyof BankAccount, value: string) => {
    setData((curr) => {
      const next = [...curr.bankAccounts];
      next[index] = { ...next[index], [field]: value };
      return { ...curr, bankAccounts: next };
    });
  };

  const handleAddBank = () => {
    setData((curr) => ({
      ...curr,
      bankAccounts: [
        ...curr.bankAccounts,
        {
          id: `bank-${Date.now().toString(36)}`,
          bankName: "Bank Syariah Indonesia (BSI)",
          accountNumber: "",
          accountHolder: "Ponpes Modern MBS Purworejo",
        },
      ],
    }));
  };

  const handleRemoveBank = (index: number) => {
    setData((curr) => {
      const next = curr.bankAccounts.filter((_, i) => i !== index);
      return { ...curr, bankAccounts: next };
    });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const client = createSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();

      const parsedAmounts = quickAmountsStr
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);

      const payload: DonationSettings = {
        ...data,
        quickAmounts: parsedAmounts.length > 0 ? parsedAmounts : defaultDonationSettings.quickAmounts,
        targetAmount: Number(data.targetAmount) || defaultDonationSettings.targetAmount,
        collectedAmount: Number(data.collectedAmount) || defaultDonationSettings.collectedAmount,
        donorCount: Number(data.donorCount) || defaultDonationSettings.donorCount,
      };

      const { error: saveError } = await client
        .from("site_settings")
        .upsert({
          key: "donation",
          data: payload,
          public_visible: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (saveError) throw new Error(saveError.message);

      await fetch("/api/admin/revalidate", { method: "POST" });
      setSavedSnapshot(payload);
      setMessage("✓ Pengaturan halaman donasi dan metode pembayaran berhasil disimpan!");
    } catch (err) {
      setError(err instanceof Error ? `Gagal menyimpan: ${err.message}` : "Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <p>Memuat pengaturan donasi…</p>
      </div>
    );
  }

  const isDirty = JSON.stringify(data) !== JSON.stringify(savedSnapshot);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGATURAN & LAYANAN</span>
          <h1>Program Donasi</h1>
          <p>
            Kelola program donasi, poster, metode pembayaran QRIS, nomor rekening transfer bank, dan kontak bendahara.
          </p>
        </div>
        <Link className="admin-btn-outline" href="/donasi" target="_blank">
          Lihat Halaman Donasi ↗
        </Link>
      </div>

      <form onSubmit={save}>
        {message && <div className="admin-alert is-success">{message}</div>}
        {error && <div className="admin-alert is-error">{error}</div>}

        {/* STATUS PROGRAM */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>Status Program Donasi</h2>
            <p>Aktifkan atau nonaktifkan penerimaan donasi publik di website.</p>
          </div>
          <div className="admin-input-group">
            <label className="admin-checkbox-label" style={{ fontSize: "15px", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={data.enabled}
                onChange={(e) => setData((curr) => ({ ...curr, enabled: e.target.checked }))}
              />
              <span>Aktifkan Halaman Donasi Publik (/donasi)</span>
            </label>
          </div>
        </section>

        {/* KATEGORI 1: INFORMASI PROGRAM DONASI */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>1. Informasi Program Donasi</h2>
            <p>Judul program, kategori, poster kampanye, serta target dana yang dihimpun.</p>
          </div>

          <div className="admin-field-row">
            <div className="admin-field-group">
              <label className="admin-field-label">Judul Program Donasi</label>
              <input
                type="text"
                className="admin-input-field"
                value={data.campaignTitle}
                onChange={(e) => setData((curr) => ({ ...curr, campaignTitle: e.target.value }))}
                placeholder="Contoh: Donasi Pengembangan Fasilitas Santri"
                required
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Kategori Program</label>
              <input
                type="text"
                className="admin-input-field"
                value={data.campaignCategory}
                onChange={(e) => setData((curr) => ({ ...curr, campaignCategory: e.target.value }))}
                placeholder="Contoh: Infaq & Sedekah Pendidikan"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-field-label">Subjudul / Slogan Singkat</label>
            <input
              type="text"
              className="admin-input-field"
              value={data.campaignSubtitle}
              onChange={(e) => setData((curr) => ({ ...curr, campaignSubtitle: e.target.value }))}
              placeholder="Ajakan singkat kepada donatur..."
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-field-label">Deskripsi Lengkap Program</label>
            <textarea
              className="admin-input-field"
              rows={4}
              value={data.campaignDescription}
              onChange={(e) => setData((curr) => ({ ...curr, campaignDescription: e.target.value }))}
              placeholder="Jelaskan tujuan donasi, pemanfaatan dana, dan kebaikan yang akan dirasakan santri..."
            />
          </div>

          <div className="admin-field-row">
            <div className="admin-field-group">
              <label className="admin-field-label">Target Dana (Rp)</label>
              <input
                type="number"
                className="admin-input-field"
                value={data.targetAmount}
                onChange={(e) => setData((curr) => ({ ...curr, targetAmount: Number(e.target.value) || 0 }))}
                placeholder="250000000"
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Dana Terkumpul Saat Ini (Rp)</label>
              <input
                type="number"
                className="admin-input-field"
                value={data.collectedAmount}
                onChange={(e) => setData((curr) => ({ ...curr, collectedAmount: Number(e.target.value) || 0 }))}
                placeholder="85400000"
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Jumlah Donatur Terdata</label>
              <input
                type="number"
                className="admin-input-field"
                value={data.donorCount}
                onChange={(e) => setData((curr) => ({ ...curr, donorCount: Number(e.target.value) || 0 }))}
                placeholder="146"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <ImageUploadDropzone
              value={data.campaignImage}
              label="Foto / Poster Program Donasi"
              placeholderTitle="Unggah Poster Program Donasi"
              onChange={(url) => setData((curr) => ({ ...curr, campaignImage: url }))}
            />
          </div>

          <div className="admin-input-group">
            <label className="admin-field-label">Pilihan Nominal Cepat (Pisahkan dengan koma)</label>
            <input
              type="text"
              className="admin-input-field"
              value={quickAmountsStr}
              onChange={(e) => setQuickAmountsStr(e.target.value)}
              placeholder="25000, 50000, 100000, 250000, 500000, 1000000"
            />
            <small style={{ color: "#667085", display: "block", marginTop: "4px" }}>
              Tombol nominal instan yang dapat langsung dipilih oleh donatur pada formulir.
            </small>
          </div>
        </section>

        {/* KATEGORI 2: METODE PEMBAYARAN QRIS */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>2. Metode Pembayaran QRIS</h2>
            <p>
              Terima donasi melalui scan QRIS (GoPay, OVO, Dana, ShopeePay, BCA, Livin Mandiri, BSI Mobile, dan semua aplikasi QRIS).
            </p>
          </div>

          <div className="admin-input-group">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={data.qrisEnabled}
                onChange={(e) => setData((curr) => ({ ...curr, qrisEnabled: e.target.checked }))}
              />
              <strong>Aktifkan Pembayaran via QRIS</strong>
            </label>
          </div>

          {data.qrisEnabled && (
            <>
              <div className="admin-input-group">
                <label className="admin-field-label">Nama Merchant QRIS (NMID / Akun)</label>
                <input
                  type="text"
                  className="admin-input-field"
                  value={data.qrisMerchantName}
                  onChange={(e) => setData((curr) => ({ ...curr, qrisMerchantName: e.target.value }))}
                  placeholder="Contoh: MBS PURWOREJO / LAZISMU"
                />
              </div>

              <div className="admin-input-group">
                <ImageUploadDropzone
                  value={data.qrisImage}
                  label="Gambar Kode QRIS Resmi"
                  placeholderTitle="Unggah Gambar QR Code QRIS"
                  onChange={(url) => setData((curr) => ({ ...curr, qrisImage: url }))}
                />
                <small style={{ color: "#667085", display: "block", marginTop: "6px" }}>
                  💡 Gambar QRIS ini akan tampil otomatis pada nota keterangan pembayaran donatur dan dapat diunduh langsung.
                </small>
              </div>
            </>
          )}
        </section>

        {/* KATEGORI 3: METODE PEMBAYARAN TRANSFER BANK */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>3. Metode Pembayaran Transfer Bank</h2>
            <p>Daftar nomor rekening bank resmi yayasan/pesantren untuk transfer manual atau mobile banking.</p>
          </div>

          <div className="admin-slides-stack">
            {data.bankAccounts.map((bank, index) => (
              <div key={bank.id || index} className="admin-slide-card">
                <div className="admin-slide-card-header">
                  <div className="admin-slide-header-left">
                    <span className="admin-slide-badge-num">{index + 1}</span>
                    <strong>{bank.bankName || `Rekening ${index + 1}`}</strong>
                  </div>
                  {data.bankAccounts.length > 1 && (
                    <button
                      type="button"
                      className="admin-slide-btn-del"
                      onClick={() => handleRemoveBank(index)}
                      title="Hapus rekening ini"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="admin-field-row" style={{ marginTop: "12px" }}>
                  <div className="admin-field-group">
                    <label className="admin-field-label">Nama Bank</label>
                    <input
                      type="text"
                      className="admin-input-field"
                      value={bank.bankName}
                      onChange={(e) => handleBankChange(index, "bankName", e.target.value)}
                      placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                      required
                    />
                  </div>
                  <div className="admin-field-group">
                    <label className="admin-field-label">Nomor Rekening</label>
                    <input
                      type="text"
                      className="admin-input-field"
                      value={bank.accountNumber}
                      onChange={(e) => handleBankChange(index, "accountNumber", e.target.value)}
                      placeholder="Contoh: 7188822331"
                      required
                    />
                  </div>
                  <div className="admin-field-group">
                    <label className="admin-field-label">Atas Nama (A/N)</label>
                    <input
                      type="text"
                      className="admin-input-field"
                      value={bank.accountHolder}
                      onChange={(e) => handleBankChange(index, "accountHolder", e.target.value)}
                      placeholder="Contoh: Ponpes Modern MBS Purworejo"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn-outline"
            style={{ marginTop: "14px" }}
            onClick={handleAddBank}
          >
            + Tambah Rekening Bank Lain
          </button>
        </section>

        {/* KATEGORI 4: KONTAK KONFIRMASI BENDAHARA */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>4. Kontak Konfirmasi & Bendahara</h2>
            <p>Kontak WhatsApp yang akan dihubungi donatur untuk mengirimkan konfirmasi bukti transfer atau bertanya.</p>
          </div>

          <div className="admin-field-row">
            <div className="admin-field-group">
              <label className="admin-field-label">Nomor WhatsApp Bendahara (Diawali 62 atau 08)</label>
              <input
                type="text"
                className="admin-input-field"
                value={data.confirmationPhone}
                onChange={(e) => setData((curr) => ({ ...curr, confirmationPhone: e.target.value }))}
                placeholder="Contoh: 6281234567890"
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Nama Petugas / Bendahara</label>
              <input
                type="text"
                className="admin-input-field"
                value={data.confirmationName}
                onChange={(e) => setData((curr) => ({ ...curr, confirmationName: e.target.value }))}
                placeholder="Contoh: Bendahara MBS Purworejo"
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-field-label">Teks Persetujuan & Akad Donatur</label>
            <textarea
              className="admin-input-field"
              rows={3}
              value={data.disclaimerText}
              onChange={(e) => setData((curr) => ({ ...curr, disclaimerText: e.target.value }))}
            />
          </div>
        </section>

        {/* SAVE BAR */}
        <div className="admin-save-bar">
          <div className="admin-save-bar-info">
            {isDirty ? (
              <span className="admin-dirty-indicator">● Ada perubahan yang belum disimpan</span>
            ) : (
              <span>Seluruh perubahan tersimpan aman.</span>
            )}
          </div>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Pengaturan Donasi"}
          </button>
        </div>
      </form>
    </>
  );
}
