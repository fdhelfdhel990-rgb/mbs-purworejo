create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Admin MBS',
  role text not null check (role in ('superadmin', 'content_admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_cms_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_cms_superadmin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and active = true and role = 'superadmin'
  );
$$;

create table if not exists public.site_settings (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  public_visible boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.news_articles (
  id text primary key,
  title text not null,
  excerpt text not null default '',
  paragraphs jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  image_alt text not null default '',
  category text not null default 'Kegiatan',
  published_at date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null default '',
  image_url text not null,
  image_alt text not null default '',
  year integer,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  public_url text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  alt_text text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.admin_profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.news_articles enable row level security;
alter table public.achievements enable row level security;
alter table public.faqs enable row level security;
alter table public.media_assets enable row level security;

create policy "Admins read admin profiles" on public.admin_profiles
  for select to authenticated using (id = auth.uid() or public.is_cms_superadmin());
create policy "Superadmins manage admin profiles" on public.admin_profiles
  for all to authenticated using (public.is_cms_superadmin()) with check (public.is_cms_superadmin());

create policy "Public reads visible settings" on public.site_settings
  for select to anon, authenticated using (public_visible = true);
create policy "Admins manage settings" on public.site_settings
  for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

create policy "Public reads published news" on public.news_articles
  for select to anon, authenticated using (status = 'published');
create policy "Admins manage news" on public.news_articles
  for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

create policy "Public reads published achievements" on public.achievements
  for select to anon, authenticated using (status = 'published');
create policy "Admins manage achievements" on public.achievements
  for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

create policy "Public reads published FAQs" on public.faqs
  for select to anon, authenticated using (status = 'published');
create policy "Admins manage FAQs" on public.faqs
  for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

create policy "Admins manage media" on public.media_assets
  for all to authenticated using (public.is_cms_admin()) with check (public.is_cms_admin());

grant execute on function public.is_cms_admin() to anon, authenticated;
grant execute on function public.is_cms_superadmin() to anon, authenticated;

grant select on public.site_settings, public.news_articles, public.achievements, public.faqs to anon, authenticated;
grant insert, update, delete on public.site_settings, public.news_articles, public.achievements, public.faqs, public.media_assets to authenticated;
grant select on public.media_assets to authenticated;
grant select, update on public.admin_profiles to authenticated;
grant insert, delete on public.admin_profiles to authenticated;

insert into public.site_settings (key, data, public_visible) values (
  'homepage',
  '{"arabic":"معهد محمدية التربية الإسلامية الحديثة","heroKicker":"Pondok Pesantren Modern","heroTitle":"MBS Purworejo","heroImage":"/images/card.jpeg","profileDescription":"Pondok Pesantren Modern MBS Purworejo menghadirkan pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian. Sejak 1986, kami mendampingi santri untuk bertumbuh menjadi pribadi yang beriman, berwawasan luas, dan membawa manfaat.","profileVideoUrl":"https://youtu.be/GrEcOhJ4900","valuesTitle":"Mendidik dengan Kasih Sayang, Keteladanan & Inspirasi","valuesDescription":"Di MBS Purworejo, pendidikan bukan sekadar transfer ilmu. Proses belajar dirancang untuk membangun karakter, menumbuhkan kepedulian, dan membiasakan santri mengamalkan ilmu dalam keseharian.","valuesImage":"/images/santri1.jpg"}'::jsonb,
  true
) on conflict (key) do nothing;

insert into public.news_articles (id, title, excerpt, paragraphs, image_url, image_alt, category, published_at, status) values
('relawan-perpustakaan-desa','Semangat 20 Relawan Membina 2 Perpustakaan Desa di Wilayah Tambun Selatan','Tambun Selatan - Memiliki visi bersama dalam memajukan literasi, 20 relawan Komunitas Literasi Remaja Tambun Selatan secara aktif mendampingi...',jsonb_build_array('Gerobak Angkasa merupakan perpustakaan keliling yang menjadi ujung tombak pergerakan Komunitas Literasi Remaja Tambun Selatan. Gerobak ini membawa ratusan buku bacaan anak langsung ke lingkungan tempat tinggal anak-anak di desa dan kelurahan.','Dipandu oleh 20 sukarelawan aktif, kegiatan Gerobak Angkasa tidak hanya menyajikan buku, namun juga menghadirkan ruang membaca bersama, pendampingan belajar, dan cerita gembira bagi lebih dari 400 anak yang telah merasakan dampak positifnya.','Bergabung mendampingi Gerobak Angkasa menjadi pengalaman yang hangat bagi para relawan. Mereka bersama-sama membangun kebiasaan membaca dan membuka ruang belajar yang menyenangkan bagi anak-anak.'),'/images/santri1.jpg','Relawan mendampingi kegiatan literasi','Kegiatan','2026-08-20','published'),
('belajar-generasi-mandiri','Belajar bersama, tumbuh menjadi generasi berakhlak dan mandiri','Suasana belajar di lingkungan pesantren mendorong para santri untuk saling berbagi ilmu, menjaga semangat, dan berkembang bersama...',jsonb_build_array('Kegiatan belajar di MBS Purworejo dirancang untuk membantu santri memahami pelajaran sekaligus membangun kebiasaan baik. Suasana yang akrab memberi ruang bagi mereka untuk bertanya, mencoba, dan saling membantu.','Dengan pendampingan para ustaz dan ustazah, santri belajar mengatur tanggung jawab, menjaga disiplin, serta mengembangkan kemandirian dalam keseharian.'),'/images/card.jpeg','Suasana lingkungan MBS Purworejo','Pendidikan','2026-08-20','published'),
('prestasi-santri-mbs','Santri MBS Purworejo meraih prestasi di ajang pelajar','Kerja keras dan dukungan bersama mengantarkan santri MBS Purworejo meraih pencapaian yang membanggakan...',jsonb_build_array('Santri MBS Purworejo kembali menunjukkan hasil dari ketekunan dan semangat belajar melalui pencapaian di ajang pelajar. Prestasi ini menjadi kebanggaan bagi keluarga besar pesantren.','Dukungan guru, latihan yang konsisten, dan keberanian untuk mencoba menjadi bagian penting dari perjalanan mereka. Semoga pencapaian ini menginspirasi santri lain untuk terus mengembangkan potensi.'),'/images/prestasi1.jpg','Poster prestasi santri MBS Purworejo','Prestasi','2026-08-20','published'),
('kebersamaan-kegiatan-pesantren','Kebersamaan santri dalam kegiatan dan karya pesantren','Beragam kegiatan menjadi ruang bagi santri untuk belajar bekerja sama, mencoba hal baru, dan membangun rasa percaya diri...',jsonb_build_array('Beragam kegiatan di pesantren memberi kesempatan kepada santri untuk bekerja sama dan mengenali minat mereka. Setiap kegiatan menjadi pengalaman belajar yang melengkapi pembelajaran di kelas.','Melalui kebersamaan, santri belajar menghargai peran teman, berani menyampaikan gagasan, dan menyelesaikan tanggung jawab bersama.'),'/images/prestasi2.jpg','Santri mengikuti kegiatan bersama','Kegiatan','2026-08-17','published'),
('marawis-mbs-purworejo','Grup Marawis MBS Purworejo tampil penuh semangat','Kreativitas santri tumbuh melalui latihan rutin, kekompakan, dan keberanian tampil di hadapan masyarakat...',jsonb_build_array('Grup marawis MBS Purworejo terus mengasah kekompakan melalui latihan rutin. Para santri belajar menjaga irama, saling mendengarkan, dan tampil percaya diri.','Penampilan mereka menjadi salah satu cara untuk menyalurkan kreativitas sekaligus mengenalkan semangat seni islami kepada masyarakat.'),'/images/prestasi3.jpg','Grup marawis MBS Purworejo','Prestasi','2026-08-14','published'),
('santri-berbagi-literasi','Santri berbagi semangat literasi bersama masyarakat','Kegiatan bersama masyarakat menjadi pengalaman belajar untuk menumbuhkan kepedulian dan kebiasaan membaca...',jsonb_build_array('Santri dan masyarakat berbagi waktu dalam kegiatan literasi yang menghadirkan buku, permainan edukatif, dan obrolan ringan. Suasana terbuka membuat anak-anak lebih mudah menikmati kegiatan membaca.','Kegiatan ini juga menjadi kesempatan bagi santri untuk belajar peduli dan terlibat langsung dalam aktivitas positif bersama warga.'),'/images/santri1.jpg','Kegiatan berbagi literasi','Kegiatan','2026-08-12','published'),
('kegiatan-belajar-harian','Mengenal kegiatan belajar harian di MBS Purworejo','Hari-hari santri diisi dengan kegiatan belajar, ibadah, dan kebersamaan yang mendukung tumbuh kembang mereka...',jsonb_build_array('Hari-hari santri di MBS Purworejo diisi dengan kegiatan belajar, ibadah, dan kebersamaan. Rutinitas yang terarah membantu santri menjaga keseimbangan antara belajar dan kehidupan sehari-hari.','Di dalam maupun di luar kelas, mereka mendapat kesempatan untuk membangun rasa ingin tahu, tanggung jawab, dan kemandirian.'),'/images/card.jpeg','Lingkungan belajar MBS Purworejo','Pendidikan','2026-08-10','published'),
('apresiasi-prestasi-santri','Apresiasi untuk kerja keras dan ketekunan para santri','Setiap pencapaian berawal dari langkah kecil, latihan yang tekun, dan dukungan dari lingkungan pesantren...',jsonb_build_array('Setiap pencapaian berawal dari langkah kecil dan latihan yang tekun. MBS Purworejo mengapresiasi usaha para santri yang terus belajar dan berani mencoba hal baru.','Apresiasi ini diharapkan menjaga semangat mereka untuk tumbuh, memperbaiki diri, dan berbagi inspirasi dengan teman-teman.'),'/images/prestasi1.jpg','Dokumentasi prestasi santri','Prestasi','2026-08-06','published'),
('hari-kebersamaan-santri','Hari kebersamaan yang mempererat persaudaraan santri','Momen bersama di pesantren menghadirkan cerita hangat dan kenangan yang tumbuh bersama...',jsonb_build_array('Kegiatan kebersamaan menghadirkan momen hangat yang mempererat hubungan antar santri. Mereka mengikuti aktivitas bersama, berbagi cerita, dan saling mendukung.','Pengalaman sederhana seperti ini menjadi bagian penting dari kehidupan pesantren dan kenangan yang tumbuh bersama.'),'/images/prestasi2.jpg','Kebersamaan para santri','Kegiatan','2026-08-04','published')
on conflict (id) do nothing;

insert into public.achievements (title, detail, image_url, image_alt, year, sort_order, status) values
('Prestasi santri MBS Purworejo','Terus berkarya dan menginspirasi','/images/prestasi1.jpg','Poster prestasi santri MBS Purworejo',2026,1,'published'),
('Syukuri hari ini, esok berprestasi lagi','Pencapaian santri','/images/prestasi2.jpg','Poster pencapaian santri',2026,2,'published'),
('Juara 3 Cyber Security tingkat Kota Depok','Lomba Kompetensi Siswa','/images/prestasi3.jpg','Poster lomba kompetensi siswa',2026,3,'published'),
('Prestasi santri MBS Purworejo','Terus berkarya dan menginspirasi','/images/prestasi1.jpg','Poster pencapaian santri MBS',2026,4,'published'),
('Kebersamaan meraih prestasi','Tumbuh bersama MBS Purworejo','/images/prestasi2.jpg','Dokumentasi kebersamaan santri',2026,5,'published')
on conflict do nothing;

insert into public.faqs (question, answer, sort_order, status) values
('Berapa biaya pendidikan per bulan?','Biaya pendidikan menyesuaikan jalur dan kebutuhan santri. Hubungi panitia PSB untuk memperoleh rincian biaya dan informasi terbaru.',1,'published'),
('Bagaimana cara mendaftar sebagai santri baru?','Isi formulir pendaftaran melalui tombol Daftar PSB atau hubungi panitia penerimaan santri baru kami.',2,'published'),
('Apa saja jenjang pendidikan yang tersedia?','Informasi jenjang dan program pendidikan dapat ditanyakan langsung kepada tim penerimaan santri baru.',3,'published'),
('Apakah santri tinggal di asrama?','MBS Purworejo menyediakan lingkungan pesantren dan pendampingan santri. Hubungi kami untuk informasi kehidupan asrama.',4,'published')
on conflict do nothing;

insert into public.admin_profiles (id, display_name, role)
select id, 'Admin Utama', 'superadmin'
from auth.users
where email = 'mbspwr@gmail.com'
on conflict (id) do update
set display_name = excluded.display_name, role = excluded.role, active = true;

