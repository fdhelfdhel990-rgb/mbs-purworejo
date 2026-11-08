"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type BankAccount, type DonationSettings } from "../data/public-cms";
import { safeImageUrl } from "../data/image-utils";

type DonationClientProps = {
  settings: DonationSettings;
};

type FormData = {
  amount: number | string;
  selectedMethod: string;
  donorName: string;
  isAnonymous: boolean;
  phone: string;
  email: string;
  prayer: string;
  agreed: boolean;
};

type InvoiceData = {
  invoiceNumber: string;
  date: string;
  programTitle: string;
  donorDisplayName: string;
  phone: string;
  email: string;
  prayer: string;
  methodType: "qris" | "bank";
  methodName: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  bankDetail?: BankAccount;
  qrisImage?: string;
  qrisMerchant?: string;
};

function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function DonationClient({ settings }: DonationClientProps) {
  const [step, setStep] = useState<"form" | "invoice">("form");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filter valid bank accounts configured by admin
  const configuredBanks = (settings.bankAccounts || []).filter(
    (b) => b && b.bankName && b.accountNumber
  );

  // Available payment methods based strictly on admin inputs
  const availableMethods: { id: string; name: string; subtitle: string; isQris: boolean; bank?: BankAccount }[] = [];
  if (settings.qrisEnabled) {
    availableMethods.push({
      id: "qris",
      name: "QRIS",
      subtitle: settings.qrisMerchantName ? `Merchant: ${settings.qrisMerchantName}` : "Scan melalui m-Banking & E-Wallet",
      isQris: true,
    });
  }
  configuredBanks.forEach((bank) => {
    availableMethods.push({
      id: bank.id,
      name: `Transfer ${bank.bankName}`,
      subtitle: `${bank.accountNumber} a/n ${bank.accountHolder}`,
      isQris: false,
      bank,
    });
  });

  const defaultMethod = availableMethods[0]?.id || "";

  const [form, setForm] = useState<FormData>({
    amount: settings.quickAmounts?.[1] || 50000,
    selectedMethod: defaultMethod,
    donorName: "",
    isAnonymous: false,
    phone: "",
    email: "",
    prayer: "",
    agreed: true,
  });

  const [formError, setFormError] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  const rawAmount = typeof form.amount === "string"
    ? parseInt(form.amount.replace(/\D/g, "") || "0", 10)
    : Number(form.amount) || 0;

  const handleSelectQuickAmount = (val: number) => {
    setForm((curr) => ({ ...curr, amount: val }));
  };

  const handleAmountInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    const parsed = parseInt(rawDigits || "0", 10);
    setForm((curr) => ({ ...curr, amount: parsed }));
  };

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (rawAmount < 10000) {
      setFormError("Nominal donasi minimal Rp 10.000.");
      return;
    }

    if (!form.selectedMethod) {
      setFormError("Silakan pilih metode pembayaran yang tersedia.");
      return;
    }

    if (!form.phone.trim()) {
      setFormError("Silakan masukkan nomor WhatsApp aktif untuk pengiriman nota konfirmasi.");
      return;
    }

    if (!form.agreed) {
      setFormError("Silakan setujui pernyataan akad donasi terlebih dahulu.");
      return;
    }

    const selected = availableMethods.find((m) => m.id === form.selectedMethod) || availableMethods[0];
    const isQris = selected?.isQris ?? false;
    const uniqueCode = isQris ? 0 : Math.floor(Math.random() * 899) + 100;
    const totalAmount = rawAmount + uniqueCode;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    const invoiceNumber = `MBS-DON-${dateStr}-${randomDigits}`;

    const newInvoice: InvoiceData = {
      invoiceNumber,
      date: now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      programTitle: settings.campaignTitle,
      donorDisplayName: form.isAnonymous ? "Hamba Allah" : (form.donorName.trim() || "Hamba Allah"),
      phone: form.phone.trim(),
      email: form.email.trim(),
      prayer: form.prayer.trim(),
      methodType: isQris ? "qris" : "bank",
      methodName: selected?.name || "Transfer Bank",
      baseAmount: rawAmount,
      uniqueCode,
      totalAmount,
      bankDetail: selected?.bank,
      qrisImage: settings.qrisImage || "",
      qrisMerchant: settings.qrisMerchantName || "MBS PURWOREJO / LAZISMU",
    };

    setInvoice(newInvoice);
    setStep("invoice");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getWhatsAppConfirmationUrl = (inv: InvoiceData) => {
    const rawNumber = settings.confirmationPhone || "6281234567890";
    const cleanNumber = rawNumber.replace(/\D/g, "").replace(/^0/, "62");
    const text = [
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,`,
      `Konfirmasi Pembayaran Donasi MBS Purworejo:`,
      ``,
      `*No. Nota:* ${inv.invoiceNumber}`,
      `*Program:* ${inv.programTitle}`,
      `*Nama Donatur:* ${inv.donorDisplayName}`,
      `*Nominal:* ${formatRupiah(inv.totalAmount)}`,
      `*Metode:* ${inv.methodName}`,
      inv.prayer ? `*Doa/Pesan:* "${inv.prayer}"` : "",
      ``,
      `Mohon dicatat dan dikonfirmasi penerimaan donasi kami. Jazakumullah Khairan Katsiran.`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const percentage = Math.min(
    Math.round((settings.collectedAmount / (settings.targetAmount || 1)) * 100),
    100
  );

  return (
    <div className="donation-page-shell">
      <div className="donation-container donation-main-wrap">
        {step === "form" ? (
          <>
            {/* CAMPAIGN CARD */}
            <section className="donation-campaign-card">
              <div className="campaign-media">
                <Image
                  src={safeImageUrl(settings.campaignImage, "/images/card.jpeg")}
                  alt={settings.campaignTitle}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 440px"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>

              <div className="campaign-body">
                {settings.campaignCategory && (
                  <span className="campaign-category-pill">{settings.campaignCategory}</span>
                )}
                <h1 className="campaign-title">{settings.campaignTitle}</h1>
                {settings.campaignSubtitle && (
                  <p className="campaign-subtitle">{settings.campaignSubtitle}</p>
                )}
                {settings.campaignDescription && (
                  <p className="campaign-desc">{settings.campaignDescription}</p>
                )}

                <div className="campaign-progress-block">
                  <div className="campaign-stat-row">
                    <div>
                      <strong className="campaign-collected">{formatRupiah(settings.collectedAmount)}</strong>
                      <span className="campaign-target-label">
                        terkumpul dari target <strong>{formatRupiah(settings.targetAmount)}</strong>
                      </span>
                    </div>
                    <div className="campaign-donors-stat">
                      <strong>{formatNumber(settings.donorCount)}</strong>
                      <span>Donatur</span>
                    </div>
                  </div>

                  <div className="campaign-progress-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="campaign-progress-fill" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            </section>

            {/* DONATION FORM */}
            <form onSubmit={handleSubmit} className="donation-form-wrapper">
              {formError && (
                <div className="donation-alert is-error" role="alert">
                  {formError}
                </div>
              )}

              <div className="donation-card-box">
                {/* 1. NOMINAL DONASI */}
                <div className="form-group-block">
                  <label className="form-section-label">
                    Nominal Donasi <span className="req-star">*</span>
                  </label>

                  <div className="quick-amounts-grid">
                    {settings.quickAmounts.map((amt) => {
                      const isSelected = rawAmount === amt;
                      return (
                        <button
                          key={amt}
                          type="button"
                          className={`quick-chip-btn ${isSelected ? "is-selected" : ""}`}
                          onClick={() => handleSelectQuickAmount(amt)}
                        >
                          {formatRupiah(amt)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="nominal-input-wrap">
                    <span className="nominal-prefix">Rp.</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="nominal-text-input"
                      value={rawAmount ? formatNumber(rawAmount) : ""}
                      onChange={handleAmountInputChange}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* 2. PILIH METODE PEMBAYARAN */}
                <div className="form-group-block">
                  <label className="form-section-label">
                    Pilih Metode Pembayaran <span className="req-star">*</span>
                  </label>

                  {availableMethods.length > 0 ? (
                    <div className="payment-methods-stack">
                      {availableMethods.map((method) => {
                        const isChecked = form.selectedMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`payment-method-card ${isChecked ? "is-active" : ""}`}
                          >
                            <input
                              type="radio"
                              name="payment_method"
                              value={method.id}
                              checked={isChecked}
                              onChange={(e) => setForm((curr) => ({ ...curr, selectedMethod: e.target.value }))}
                            />
                            <div className="method-info">
                              <strong>{method.name}</strong>
                              <p className="method-sub">{method.subtitle}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: "#667085", fontSize: "14px", fontStyle: "italic" }}>
                      Metode pembayaran belum diaktifkan oleh admin.
                    </p>
                  )}
                </div>

                {/* 3. DATA DONATUR */}
                <div className="form-group-block">
                  <label className="form-section-label">
                    Nama Lengkap <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="donation-text-field"
                    placeholder="Nama Lengkap Donatur"
                    value={form.donorName}
                    disabled={form.isAnonymous}
                    onChange={(e) => setForm((curr) => ({ ...curr, donorName: e.target.value }))}
                    required={!form.isAnonymous}
                  />

                  <label className="donation-checkbox-row" style={{ marginTop: "10px" }}>
                    <input
                      type="checkbox"
                      checked={form.isAnonymous}
                      onChange={(e) => setForm((curr) => ({ ...curr, isAnonymous: e.target.checked }))}
                    />
                    <span>Sembunyikan nama saya (Hamba Allah)</span>
                  </label>
                </div>

                {/* 4. KONTAK DONATUR */}
                <div className="form-group-block">
                  <div className="form-two-col">
                    <div>
                      <label className="form-sub-label">
                        Nomor WhatsApp Aktif <span className="req-star">*</span>
                      </label>
                      <input
                        type="tel"
                        className="donation-text-field"
                        placeholder="Contoh: 081234567890"
                        value={form.phone}
                        onChange={(e) => setForm((curr) => ({ ...curr, phone: e.target.value }))}
                        required
                      />
                      <small className="field-hint">Untuk keperluan konfirmasi dan bukti nota donasi</small>
                    </div>

                    <div>
                      <label className="form-sub-label">Alamat Email (Opsional)</label>
                      <input
                        type="email"
                        className="donation-text-field"
                        placeholder="nama@email.com"
                        value={form.email}
                        onChange={(e) => setForm((curr) => ({ ...curr, email: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* 5. DOA / PESAN */}
                <div className="form-group-block">
                  <label className="form-section-label">
                    Tulis Pesan atau Doa (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    className="donation-text-field"
                    placeholder="Tuliskan doa atau pesan kebaikan untuk santri MBS Purworejo..."
                    value={form.prayer}
                    onChange={(e) => setForm((curr) => ({ ...curr, prayer: e.target.value }))}
                  />
                </div>

                {/* NOTE PERINGATAN */}
                <div className="donation-notice-red">
                  <strong>Catatan:</strong>
                  <ol>
                    <li>Pastikan data nominal dan nomor WhatsApp sudah benar untuk keperluan konfirmasi donasi.</li>
                    <li>Pastikan infaq dan donasi yang ditunaikan bersumber dari harta halal yang dimiliki secara sah.</li>
                  </ol>
                </div>

                {/* AKAD & DISCLAIMER CHECKBOX */}
                <div className="donation-agreement-box">
                  <label className="donation-checkbox-row align-top">
                    <input
                      type="checkbox"
                      checked={form.agreed}
                      onChange={(e) => setForm((curr) => ({ ...curr, agreed: e.target.checked }))}
                      required
                    />
                    <span className="agreement-text">
                      {settings.disclaimerText ||
                        "Dengan mengisi formulir ini, saya menyatakan bahwa donasi yang ditunaikan berasal dari harta halal yang dimiliki secara sah dan sempurna sesuai ketentuan syariat Islam."}
                    </span>
                  </label>
                </div>

                {/* TOMBOL SELANJUTNYA */}
                <button type="submit" className="donation-btn-submit">
                  Lanjutkan ke Pembayaran →
                </button>
              </div>
            </form>
          </>
        ) : (
          /* STEP 2: NOTA KETERANGAN PEMBAYARAN */
          invoice && (
            <div className="invoice-screen-wrap">
              <div className="invoice-top-actions no-print">
                <button
                  type="button"
                  className="invoice-back-btn"
                  onClick={() => setStep("form")}
                >
                  ← Kembali ke Formulir
                </button>
                <button type="button" className="invoice-print-btn" onClick={handlePrint}>
                  Cetak / Simpan Nota (PDF)
                </button>
              </div>

              {/* OFFICIAL NOTA CARD */}
              <div className="official-invoice-card" id="printable-invoice">
                <div className="invoice-card-header">
                  <div className="invoice-brand">
                    <Image
                      src="/images/icon.png"
                      alt="Logo MBS Purworejo"
                      width={48}
                      height={48}
                      unoptimized
                    />
                    <div>
                      <h2 className="invoice-mbs-title">PONDOK PESANTREN MODERN MBS PURWOREJO</h2>
                      <span className="invoice-mbs-sub">Layanan Infaq & Donasi Pendidikan Santri</span>
                      <small className="invoice-mbs-addr">Pituruh, Kabupaten Purworejo, Jawa Tengah</small>
                    </div>
                  </div>

                  <div className="invoice-status-badge">
                    <span className="badge-pill is-pending">Menunggu Pembayaran</span>
                    <span className="invoice-id-tag">{invoice.invoiceNumber}</span>
                  </div>
                </div>

                <div className="invoice-divider" />

                <div className="invoice-banner-info">
                  <h3 className="invoice-doc-title">KETERANGAN PEMBAYARAN DONASI</h3>
                  <p className="invoice-doc-desc">
                    Silakan selesaikan pembayaran sesuai rincian nominal dan instruksi di bawah ini.
                  </p>
                </div>

                {/* RINCIAN DATA DONATUR */}
                <div className="invoice-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Tanggal Transaksi:</span>
                    <strong className="detail-val">{invoice.date}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Program Donasi:</span>
                    <strong className="detail-val text-green">{invoice.programTitle}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nama Donatur:</span>
                    <strong className="detail-val">{invoice.donorDisplayName}</strong>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">No. WhatsApp:</span>
                    <strong className="detail-val">{invoice.phone}</strong>
                  </div>
                  {invoice.email && (
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <strong className="detail-val">{invoice.email}</strong>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Metode Pembayaran:</span>
                    <strong className="detail-val">{invoice.methodName}</strong>
                  </div>
                </div>

                {invoice.prayer && (
                  <div className="invoice-prayer-quote">
                    <span className="prayer-label">Doa / Pesan Donatur:</span>
                    <p className="prayer-text">“{invoice.prayer}”</p>
                  </div>
                )}

                <div className="invoice-divider" />

                {/* RINCIAN NOMINAL */}
                <div className="invoice-amount-summary">
                  <div className="amount-row">
                    <span>Donasi Pokok:</span>
                    <span>{formatRupiah(invoice.baseAmount)}</span>
                  </div>
                  {invoice.uniqueCode > 0 && (
                    <div className="amount-row unique-row">
                      <span>Kode Unik Verifikasi:</span>
                      <span>+{invoice.uniqueCode}</span>
                    </div>
                  )}
                  <div className="amount-total-row">
                    <div className="total-label-wrap">
                      <strong>Total Pembayaran:</strong>
                      <small>Transfer tepat hingga 3 digit terakhir</small>
                    </div>
                    <div className="total-val-wrap">
                      <span className="total-sum-text">{formatRupiah(invoice.totalAmount)}</span>
                      <button
                        type="button"
                        className="btn-copy-chip no-print"
                        onClick={() => copyToClipboard(invoice.totalAmount.toString(), "amount")}
                      >
                        {copiedKey === "amount" ? "✓ Tersalin" : "Salin Nominal"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* INSTRUKSI PEMBAYARAN */}
                <div className="invoice-payment-instructions">
                  {invoice.methodType === "qris" ? (
                    <div className="invoice-qris-box">
                      <div className="qris-box-header">
                        <span className="qris-title">PEMBAYARAN QRIS</span>
                        {invoice.qrisMerchant && (
                          <span className="qris-merchant">{invoice.qrisMerchant}</span>
                        )}
                      </div>

                      <div className="qris-image-container">
                        {invoice.qrisImage ? (
                          <Image
                            src={safeImageUrl(invoice.qrisImage, "/images/card.jpeg")}
                            alt="Kode QRIS Donasi MBS Purworejo"
                            width={260}
                            height={260}
                            unoptimized
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className="qris-placeholder-box">
                            <span>Gambar QRIS belum diunggah admin. Silakan konfirmasi via WhatsApp.</span>
                          </div>
                        )}
                      </div>

                      {invoice.qrisImage && (
                        <div className="no-print" style={{ marginBottom: "16px" }}>
                          <a
                            href={safeImageUrl(invoice.qrisImage)}
                            download="QRIS-Donasi-MBS-Purworejo.png"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-download-qris"
                          >
                            Unduh Gambar QRIS
                          </a>
                        </div>
                      )}

                      <div className="qris-steps">
                        <h4>Panduan Pembayaran QRIS:</h4>
                        <ol>
                          <li>Buka aplikasi m-Banking atau E-Wallet (BCA, Mandiri, BSI, GoPay, OVO, Dana, dll).</li>
                          <li>Pilih menu <strong>Scan QRIS</strong>.</li>
                          <li>Scan kode QR di atas dan masukkan nominal tepat sejumlah <strong>{formatRupiah(invoice.totalAmount)}</strong>.</li>
                          <li>Konfirmasi pembayaran dan simpan bukti transfer.</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="invoice-bank-box">
                      <h4 className="bank-section-title">Rekening Tujuan Transfer:</h4>

                      {invoice.bankDetail && (
                        <div className="bank-account-card">
                          <div className="bank-name-badge">{invoice.bankDetail.bankName}</div>
                          <div className="account-number-row">
                            <span className="account-num-label">Nomor Rekening:</span>
                            <strong className="account-num-big">{invoice.bankDetail.accountNumber}</strong>
                            <button
                              type="button"
                              className="btn-copy-chip no-print"
                              onClick={() => copyToClipboard(invoice.bankDetail?.accountNumber || "", "rekening")}
                            >
                              {copiedKey === "rekening" ? "✓ Tersalin" : "Salin No. Rekening"}
                            </button>
                          </div>
                          <div className="account-holder-row">
                            <span>Atas Nama:</span>
                            <strong>{invoice.bankDetail.accountHolder}</strong>
                          </div>
                        </div>
                      )}

                      <div className="bank-transfer-steps">
                        <h4>Petunjuk Transfer:</h4>
                        <ol>
                          <li>Transfer ke nomor rekening di atas melalui ATM, Mobile Banking, atau Internet Banking.</li>
                          <li>Pastikan nominal transfer <strong>TEPAT</strong> sejumlah: <strong>{formatRupiah(invoice.totalAmount)}</strong>.</li>
                          <li>Simpan bukti transfer dan klik tombol konfirmasi WhatsApp di bawah.</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>

                <div className="invoice-card-footer">
                  <p className="invoice-thankyou-text">
                    “Dan apa saja yang kamu infakkan, Allah akan menggantinya dan Dia-lah sebaik-baik pemberi rezeki.” (QS. Saba: 39)
                  </p>
                  <span className="invoice-mbs-signature">
                    Pondok Pesantren Modern MBS Purworejo
                  </span>
                </div>
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="invoice-bottom-actions no-print">
                <a
                  href={getWhatsAppConfirmationUrl(invoice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-confirm-whatsapp"
                >
                  Konfirmasi Pembayaran via WhatsApp Bendahara
                </a>

                <button
                  type="button"
                  className="btn-new-donation"
                  onClick={() => {
                    setStep("form");
                    setInvoice(null);
                  }}
                >
                  Kembali ke Formulir
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
