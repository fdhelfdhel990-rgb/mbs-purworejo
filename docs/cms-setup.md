# Mengaktifkan CMS MBS

Panel admin memakai Supabase Auth dan PostgreSQL. File gambar disimpan di Cloudflare R2. Kredensial admin dan R2 tidak disimpan di browser.

## Supabase

1. Buat project Supabase dan salin Project URL serta anon/publishable key ke `.env.local` berdasarkan `.env.example`.
2. Jalankan satu kali SQL di `supabase/migrations/202610270001_cms.sql` melalui SQL Editor. Migrasi ini membuat tabel, Row Level Security, kebijakan publikasi, dan menyalin konten website yang saat ini dipakai sebagai data awal.
3. Di Supabase Auth, buat atau undang akun admin. Pendaftaran publik tidak diperlukan.
4. Jalankan SQL berikut dengan email akun yang sudah dibuat untuk memberi akses superadmin:

```sql
insert into public.admin_profiles (id, display_name, role)
select id, 'Nama Admin', 'superadmin'
from auth.users
where email = 'email-admin@example.com'
on conflict (id) do update
set display_name = excluded.display_name, role = excluded.role, active = true;
```

5. Untuk admin konten, gunakan `content_admin` sebagai nilai `role`.

## Cloudflare R2

1. Buat bucket R2 dan aktifkan domain publik atau custom domain untuk membaca media.
2. Buat token API dengan izin Object Read & Write hanya untuk bucket tersebut.
3. Isi `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, dan `R2_PUBLIC_BASE_URL` pada `.env.local`.
4. Atur CORS bucket. Contoh aturan untuk lokal dan domain produksi:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://domain-website-anda"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. Restart Next.js setelah mengubah environment variables. Jika host R2 berubah, jalankan ulang build agar domain tersebut diizinkan Next Image.

Kemudian buka `/admin/login`. Admin mengelola teks beranda, berita, prestasi, FAQ, dan media. Konten yang berstatus Draft tidak tampil di website publik.
