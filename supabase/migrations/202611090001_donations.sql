-- Migration: Add default site_settings entry for donation
insert into public.site_settings (key, data, public_visible) values (
  'donation',
  '{
    "enabled": true,
    "campaignTitle": "Donasi Pengembangan Pendidikan & Fasilitas Santri",
    "campaignCategory": "Infaq & Sedekah Pendidikan",
    "campaignSubtitle": "Salurkan infaq dan donasi terbaik Anda untuk mencetak generasi penghafal Al-Qur''an dan kader dakwah berakhlak mulia di MBS Purworejo.",
    "campaignDescription": "Setiap rupiah infaq dan donasi yang Anda amanahkan akan disalurkan untuk pemenuhan fasilitas asrama, laboratorium, beasiswa santri berprestasi/dhuafa, serta pengembangan sarana ibadah di lingkungan Pondok Pesantren Modern MBS Purworejo.",
    "campaignImage": "/images/card.jpeg",
    "targetAmount": 250000000,
    "collectedAmount": 85400000,
    "donorCount": 146,
    "quickAmounts": [25000, 50000, 100000, 250000, 500000, 1000000],
    "qrisEnabled": true,
    "qrisImage": "",
    "qrisMerchantName": "MBS PURWOREJO / LAZISMU",
    "bankAccounts": [
      {
        "id": "bank-bsi",
        "bankName": "Bank Syariah Indonesia (BSI)",
        "accountNumber": "7188822331",
        "accountHolder": "Ponpes Modern MBS Purworejo"
      },
      {
        "id": "bank-jateng",
        "bankName": "Bank Jateng Syariah",
        "accountNumber": "5032001122",
        "accountHolder": "MBS Purworejo Infaq"
      },
      {
        "id": "bank-bri",
        "bankName": "Bank BRI",
        "accountNumber": "007701001234538",
        "accountHolder": "Pondok Pesantren Modern MBS Purworejo"
      }
    ],
    "confirmationPhone": "6281234567890",
    "confirmationName": "Bendahara MBS Purworejo",
    "disclaimerText": "Dengan mengisi formulir ini, saya menyatakan bahwa zakat, infak, sedekah, serta donasi yang ditunaikan berasal dari harta halal yang dimiliki secara sah dan sempurna sesuai ketentuan syariat Islam."
  }'::jsonb,
  true
) on conflict (key) do nothing;
