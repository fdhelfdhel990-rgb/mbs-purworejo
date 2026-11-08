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

function formatRp(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function AdminDonasiPage() {
  const [data, setData] = useState<DonationSettings>(defaultDonationSettings);
  const [savedSnapshot, setSavedSnapshot] = useState<DonationSettings>(defaultDonationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [quickAmountsStr, setQuickAmountsStr] = useState("25000, 50000, 100000, 250000, 500000, 1000000");

  // State to control which card is expanded / collapsed
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({
    program: true,
    payment: false,
    contact: false,
  });

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRelLink, setCopiedRelLink] = useState(false);

  const toggleCard = (key: string) => {
    setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  const handleCancel = () => {
    setData(savedSnapshot);
    if (Array.isArray(savedSnapshot.quickAmounts)) {
      setQuickAmountsStr(savedSnapshot.quickAmounts.join(", "));
    }
    setMessage("Perubahan dibatalkan.");
    setTimeout(() => setMessage(""), 3000);
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
      setMessage("✓ Pengaturan donasi berhasil disimpan!");
      setTimeout(() => setMessage(""), 4000);
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
  const fullDonationUrl = typeof window !== "undefined" ? `${window.location.origin}/donasi` : "https://mbs-purworejo.sch.id/donasi";

  const handleCopyFull = () => {
    void navigator.clipboard.writeText(fullDonationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRel = () => {
    void navigator.clipboard.writeText("/donasi");
    setCopiedRelLink(true);
    setTimeout(() => setCopiedRelLink(false), 2500);
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGATURAN & LAYANAN</span>
          <h1>Program Donasi</h1>
          <p>
            Kelola rincian program donasi, poster, metode pembayaran QRIS, nomor rekening transfer bank, dan kontak bendahara.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link className="admin-btn-outline" href="/donasi" target="_blank">
            Lihat Halaman Donasi ↗
          </Link>
        </div>
      </div>

      {message && <div className="admin-alert is-success">{message}</div>}
      {error && <div className="admin-alert is-error">{error}</div>}

      {/* GENERATE LINK OTOMATIS UNTUK BANNER */}
      <section className="admin-link-card">
        <div className="admin-link-card-body">
          <strong>🔗 Tautan Otomatis Halaman Donasi</strong>
          <p>
            Salin link ini untuk ditempelkan pada kolom <strong>Tautan Banner</strong> di menu <strong>Konten Beranda</strong>. Ketika pengunjung menekan banner tersebut di beranda, mereka langsung diarahkan ke halaman donasi.
          </p>
          <div className="admin-link-pill-row">
            <span className="admin-link-code">{fullDonationUrl}</span>
            <button
              type="button"
              className={`admin-btn-copy-link ${copiedLink ? "is-copied" : ""}`}
              onClick={handleCopyFull}
              title="Salin tautan lengkap"
            >
              {copiedLink ? "✓ Link Tersalin!" : "📋 Salin Link Lengkap"}
            </button>
            <button
              type="button"
              className={`admin-btn-outline ${copiedRelLink ? "is-copied" : ""}`}
              style={{ fontSize: "12px", minHeight: "36px", padding: "0 12px" }}
              onClick={handleCopyRel}
              title="Salin path /donasi"
            >
              {copiedRelLink ? "✓ Tersalin /donasi" : "Salin /donasi"}
            </button>
          </div>
        </div>
        <Link href="/admin/konten" className="admin-btn-shortcut">
          Buka Pengaturan Banner di Konten Beranda →
        </Link>
      </section>

      <form onSubmit={save}>
        {/* CARD 1: INFORMASI PROGRAM DONASI */}
        <div className={`admin-accordion-card ${openCards.program ? "is-open" : ""}`}>
          <div
            className="admin-accordion-header"
            onClick={() => toggleCard("program")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleCard("program"); }}
          >
            <div className="admin-accordion-header-left">
              <span className="admin-accordion-icon">📋</span>
              <div className="admin-accordion-title-wrap">
                <strong>1. Informasi Program Donasi</strong>
                <small>{data.campaignTitle || "Belum ada judul program"}</small>
              </div>
            </div>
            <div className="admin-accordion-header-right">
              <span className="admin-accordion-summary-tag">
                Target: {formatRp(data.targetAmount)}
              </span>
              <span className="admin-accordion-summary-tag">
                Terkumpul: {formatRp(data.collectedAmount)}
              </span>
              <span className="admin-accordion-toggle-btn">
                {openCards.program ? "Tutup Detail ▲" : "Lihat & Edit Detail ▼"}
              </span>
            </div>
          </div>

          {openCards.program && (
            <div className="admin-accordion-body">
              <div className="admin-input-group" style={{ marginBottom: "18px" }}>
                <label className="admin-checkbox-label" style={{ fontSize: "14px", fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={data.enabled}
                    onChange={(e) => setData((curr) => ({ ...curr, enabled: e.target.checked }))}
                  />
                  <span>Aktifkan status publikasi halaman donasi ini</span>
                </label>
              </div>

              <div className="admin-form-grid-2">
                <div className="admin-input-group">
                  <label className="admin-label-text">Judul Program Donasi *</label>
                  <input
                    type="text"
                    className="admin-input-field"
                    value={data.campaignTitle}
                    onChange={(e) => setData((curr) => ({ ...curr, campaignTitle: e.target.value }))}
                    placeholder="Contoh: Donasi Pengembangan Fasilitas Santri"
                    required
                  />
                </div>
                <div className="admin-input-group">
                  <label className="admin-label-text">Kategori Program</label>
                  <input
                    type="text"
                    className="admin-input-field"
                    value={data.campaignCategory}
                    onChange={(e) => setData((curr) => ({ ...curr, campaignCategory: e.target.value }))}
                    placeholder="Contoh: Infaq & Sedekah Pendidikan"
                  />
                </div>
              </div>

              <div className="admin-input-group" style={{ marginTop: "14px" }}>
                <label className="admin-label-text">Subjudul / Slogan Singkat</label>
                <input
                  type="text"
                  className="admin-input-field"
                  value={data.campaignSubtitle}
                  onChange={(e) => setData((curr) => ({ ...curr, campaignSubtitle: e.target.value }))}
                  placeholder="Contoh: Salurkan infaq terbaik Anda untuk mencetak generasi penghafal Al-Qur'an..."
                />
              </div>

              <div className="admin-input-group" style={{ marginTop: "14px" }}>
                <label className="admin-label-text">Deskripsi Lengkap Program</label>
                <textarea
                  className="admin-textarea-field"
                  rows={4}
                  value={data.campaignDescription}
                  onChange={(e) => setData((curr) => ({ ...curr, campaignDescription: e.target.value }))}
                  placeholder="Jelaskan tujuan donasi, rencana pemanfaatan dana, dan kebaikan yang akan dirasakan santri..."
                />
              </div>

              <div className="admin-form-grid-2" style={{ marginTop: "14px" }}>
                <div className="admin-input-group">
                  <label className="admin-label-text">Target Dana (Rp)</label>
                  <input
                    type="number"
                    className="admin-input-field"
                    value={data.targetAmount}
                    onChange={(e) => setData((curr) => ({ ...curr, targetAmount: Number(e.target.value) || 0 }))}
                    placeholder="250000000"
                  />
                </div>
                <div className="admin-input-group">
                  <label className="admin-label-text">Dana Terkumpul Saat Ini (Rp)</label>
                  <input
                    type="number"
                    className="admin-input-field"
                    value={data.collectedAmount}
                    onChange={(e) => setData((curr) => ({ ...curr, collectedAmount: Number(e.target.value) || 0 }))}
                    placeholder="85400000"
                  />
                </div>
              </div>

              <div className="admin-form-grid-2" style={{ marginTop: "14px" }}>
                <div className="admin-input-group">
                  <label className="admin-label-text">Jumlah Donatur Terdata</label>
                  <input
                    type="number"
                    className="admin-input-field"
                    value={data.donorCount}
                    onChange={(e) => setData((curr) => ({ ...curr, donorCount: Number(e.target.value) || 0 }))}
                    placeholder="146"
                  />
                </div>
                <div className="admin-input-group">
                  <label className="admin-label-text">Pilihan Nominal Cepat (Pisahkan koma)</label>
                  <input
                    type="text"
                    className="admin-input-field"
                    value={quickAmountsStr}
                    onChange={(e) => setQuickAmountsStr(e.target.value)}
                    placeholder="25000, 50000, 100000, 250000, 500000, 1000000"
                  />
                </div>
              </div>

              <div className="admin-input-group" style={{ marginTop: "16px" }}>
                <ImageUploadDropzone
                  value={data.campaignImage}
                  label="Poster / Gambar Program Donasi"
                  placeholderTitle="Unggah Poster Program Donasi (Ukuran rekomendasi 800 × 500 px)"
                  onChange={(url) => setData((curr) => ({ ...curr, campaignImage: url }))}
                />
              </div>

              <div className="admin-card-save-row">
                <button type="submit" className="admin-btn-save" disabled={saving}>
                  {saving ? "Menyimpan…" : "Simpan Informasi Program"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: METODE PEMBAYARAN (QRIS & TRANSFER BANK) */}
        <div className={`admin-accordion-card ${openCards.payment ? "is-open" : ""}`}>
          <div
            className="admin-accordion-header"
            onClick={() => toggleCard("payment")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleCard("payment"); }}
          >
            <div className="admin-accordion-header-left">
              <span className="admin-accordion-icon">💳</span>
              <div className="admin-accordion-title-wrap">
                <strong>2. Metode Pembayaran (QRIS & Transfer Bank)</strong>
                <small>Hanya metode yang diisi dan diaktifkan di sini yang akan muncul bagi donatur</small>
              </div>
            </div>
            <div className="admin-accordion-header-right">
              <span className="admin-accordion-summary-tag">
                {data.qrisEnabled ? "QRIS Aktif" : "QRIS Nonaktif"}
              </span>
              <span className="admin-accordion-summary-tag">
                {data.bankAccounts.length} Rekening Bank
              </span>
              <span className="admin-accordion-toggle-btn">
                {openCards.payment ? "Tutup Detail ▲" : "Lihat & Edit Detail ▼"}
              </span>
            </div>
          </div>

          {openCards.payment && (
            <div className="admin-accordion-body">
              {/* SUB-SEKSI QRIS */}
              <div style={{ background: "#f8fbf8", border: "1px solid #dce8db", borderRadius: "10px", padding: "18px 20px", marginBottom: "20px" }}>
                <div style={{ marginBottom: "14px" }}>
                  <label className="admin-checkbox-label" style={{ fontSize: "14px", fontWeight: 700 }}>
                    <input
                      type="checkbox"
                      checked={data.qrisEnabled}
                      onChange={(e) => setData((curr) => ({ ...curr, qrisEnabled: e.target.checked }))}
                    />
                    <span>Aktifkan Pembayaran QRIS (GoPay, OVO, Dana, ShopeePay, m-Banking)</span>
                  </label>
                </div>

                {data.qrisEnabled && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px" }}>
                    <div className="admin-input-group">
                      <label className="admin-label-text">Nama Merchant QRIS (NMID / Atas Nama Toko)</label>
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
                      <small style={{ color: "#667085", marginTop: "4px" }}>
                        💡 Gambar QRIS ini akan tampil otomatis di nota pembayaran donatur dan bisa diunduh.
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* SUB-SEKSI REKENING BANK */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--green-950)" }}>Daftar Rekening Bank Resmi</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#667085" }}>
                      Nomor rekening untuk tujuan transfer manual donatur.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn-outline"
                    style={{ fontSize: "12px", padding: "6px 14px", height: "auto" }}
                    onClick={handleAddBank}
                  >
                    + Tambah Rekening
                  </button>
                </div>

                <div className="admin-slides-stack">
                  {data.bankAccounts.map((bank, index) => (
                    <div key={bank.id || index} className="admin-slide-card">
                      <div className="admin-slide-card-header">
                        <div className="admin-slide-header-left">
                          <span className="admin-slide-badge-num">{index + 1}</span>
                          <strong>{bank.bankName || `Rekening Bank ${index + 1}`}</strong>
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

                      <div className="admin-form-grid-2" style={{ marginTop: "10px" }}>
                        <div className="admin-input-group">
                          <label className="admin-label-text">Nama Bank *</label>
                          <input
                            type="text"
                            className="admin-input-field"
                            value={bank.bankName}
                            onChange={(e) => handleBankChange(index, "bankName", e.target.value)}
                            placeholder="Contoh: Bank Syariah Indonesia (BSI)"
                            required
                          />
                        </div>
                        <div className="admin-input-group">
                          <label className="admin-label-text">Nomor Rekening *</label>
                          <input
                            type="text"
                            className="admin-input-field"
                            value={bank.accountNumber}
                            onChange={(e) => handleBankChange(index, "accountNumber", e.target.value)}
                            placeholder="Contoh: 7188822331"
                            required
                          />
                        </div>
                      </div>

                      <div className="admin-input-group" style={{ marginTop: "8px" }}>
                        <label className="admin-label-text">Atas Nama (A/N)</label>
                        <input
                          type="text"
                          className="admin-input-field"
                          value={bank.accountHolder}
                          onChange={(e) => handleBankChange(index, "accountHolder", e.target.value)}
                          placeholder="Contoh: Pondok Pesantren Modern MBS Purworejo"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card-save-row">
                <button type="submit" className="admin-btn-save" disabled={saving}>
                  {saving ? "Menyimpan…" : "Simpan Metode Pembayaran"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: KONTAK KONFIRMASI BENDAHARA & AKAD */}
        <div className={`admin-accordion-card ${openCards.contact ? "is-open" : ""}`}>
          <div
            className="admin-accordion-header"
            onClick={() => toggleCard("contact")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleCard("contact"); }}
          >
            <div className="admin-accordion-header-left">
              <span className="admin-accordion-icon">📱</span>
              <div className="admin-accordion-title-wrap">
                <strong>3. Narahubung WhatsApp Bendahara & Teks Akad</strong>
                <small>Nomor tujuan konfirmasi nota donasi melalui chat WhatsApp</small>
              </div>
            </div>
            <div className="admin-accordion-header-right">
              <span className="admin-accordion-summary-tag">
                WA: {data.confirmationPhone || "-"}
              </span>
              <span className="admin-accordion-toggle-btn">
                {openCards.contact ? "Tutup Detail ▲" : "Lihat & Edit Detail ▼"}
              </span>
            </div>
          </div>

          {openCards.contact && (
            <div className="admin-accordion-body">
              <div className="admin-form-grid-2">
                <div className="admin-input-group">
                  <label className="admin-label-text">Nomor WhatsApp Bendahara *</label>
                  <input
                    type="tel"
                    className="admin-input-field"
                    value={data.confirmationPhone}
                    onChange={(e) => setData((curr) => ({ ...curr, confirmationPhone: e.target.value }))}
                    placeholder="Contoh: 081234567890"
                    required
                  />
                  <small style={{ color: "#667085", marginTop: "4px" }}>
                    Donatur akan otomatis diarahkan ke chat nomor WhatsApp ini saat mengklik &quot;Konfirmasi via WhatsApp&quot;.
                  </small>
                </div>
                <div className="admin-input-group">
                  <label className="admin-label-text">Nama Kontak Bendahara</label>
                  <input
                    type="text"
                    className="admin-input-field"
                    value={data.confirmationName}
                    onChange={(e) => setData((curr) => ({ ...curr, confirmationName: e.target.value }))}
                    placeholder="Contoh: Bendahara MBS Purworejo"
                  />
                </div>
              </div>

              <div className="admin-input-group" style={{ marginTop: "14px" }}>
                <label className="admin-label-text">Pernyataan Akad Donatur (Disclaimer)</label>
                <textarea
                  className="admin-textarea-field"
                  rows={3}
                  value={data.disclaimerText}
                  onChange={(e) => setData((curr) => ({ ...curr, disclaimerText: e.target.value }))}
                  placeholder="Dengan mengisi formulir ini, saya menyatakan bahwa donasi yang ditunaikan bersumber dari harta halal..."
                />
              </div>

              <div className="admin-card-save-row">
                <button type="submit" className="admin-btn-save" disabled={saving}>
                  {saving ? "Menyimpan…" : "Simpan Kontak & Akad"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM ACTIONS */}
        <div className="admin-bottom-actions">
          {isDirty && (
            <span style={{ fontSize: "12px", color: "#b45309", fontWeight: 600, marginRight: "auto" }}>
              ● Ada perubahan yang belum disimpan
            </span>
          )}
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={handleCancel}
            disabled={saving || !isDirty}
          >
            Batal
          </button>
          <button type="submit" className="admin-btn-save" disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan Semua Perubahan"}
          </button>
        </div>
      </form>
    </>
  );
}
