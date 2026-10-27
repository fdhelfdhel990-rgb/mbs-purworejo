export type NewsArticle = {
  id: string;
  image: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
};

export const newsArticles: NewsArticle[] = [
  {
    id: "relawan-perpustakaan-desa",
    image: "/images/santri1.jpg",
    category: "Kegiatan",
    date: "Kamis, 20 Agustus 2026",
    title: "Semangat 20 Relawan Membina 2 Perpustakaan Desa di Wilayah Tambun Selatan",
    excerpt: "Tambun Selatan - Memiliki visi bersama dalam memajukan literasi, 20 relawan Komunitas Literasi Remaja Tambun Selatan secara aktif mendampingi...",
    paragraphs: [
      "Gerobak Angkasa merupakan perpustakaan keliling yang menjadi ujung tombak pergerakan Komunitas Literasi Remaja Tambun Selatan. Gerobak ini membawa ratusan buku bacaan anak langsung ke lingkungan tempat tinggal anak-anak di desa dan kelurahan.",
      "Dipandu oleh 20 sukarelawan aktif, kegiatan Gerobak Angkasa tidak hanya menyajikan buku, namun juga menghadirkan ruang membaca bersama, pendampingan belajar, dan cerita gembira bagi lebih dari 400 anak yang telah merasakan dampak positifnya.",
      "Bergabung mendampingi Gerobak Angkasa menjadi pengalaman yang hangat bagi para relawan. Mereka bersama-sama membangun kebiasaan membaca dan membuka ruang belajar yang menyenangkan bagi anak-anak.",
    ],
  },
  {
    id: "belajar-generasi-mandiri",
    image: "/images/card.jpeg",
    category: "Pendidikan",
    date: "Kamis, 20 Agustus 2026",
    title: "Belajar bersama, tumbuh menjadi generasi berakhlak dan mandiri",
    excerpt: "Suasana belajar di lingkungan pesantren mendorong para santri untuk saling berbagi ilmu, menjaga semangat, dan berkembang bersama...",
    paragraphs: [
      "Kegiatan belajar di MBS Purworejo dirancang untuk membantu santri memahami pelajaran sekaligus membangun kebiasaan baik. Suasana yang akrab memberi ruang bagi mereka untuk bertanya, mencoba, dan saling membantu.",
      "Dengan pendampingan para ustaz dan ustazah, santri belajar mengatur tanggung jawab, menjaga disiplin, serta mengembangkan kemandirian dalam keseharian.",
    ],
  },
  {
    id: "prestasi-santri-mbs",
    image: "/images/prestasi1.jpg",
    category: "Prestasi",
    date: "Kamis, 20 Agustus 2026",
    title: "Santri MBS Purworejo meraih prestasi di ajang pelajar",
    excerpt: "Kerja keras dan dukungan bersama mengantarkan santri MBS Purworejo meraih pencapaian yang membanggakan...",
    paragraphs: [
      "Santri MBS Purworejo kembali menunjukkan hasil dari ketekunan dan semangat belajar melalui pencapaian di ajang pelajar. Prestasi ini menjadi kebanggaan bagi keluarga besar pesantren.",
      "Dukungan guru, latihan yang konsisten, dan keberanian untuk mencoba menjadi bagian penting dari perjalanan mereka. Semoga pencapaian ini menginspirasi santri lain untuk terus mengembangkan potensi.",
    ],
  },
  {
    id: "kebersamaan-kegiatan-pesantren",
    image: "/images/prestasi2.jpg",
    category: "Kegiatan",
    date: "Senin, 17 Agustus 2026",
    title: "Kebersamaan santri dalam kegiatan dan karya pesantren",
    excerpt: "Beragam kegiatan menjadi ruang bagi santri untuk belajar bekerja sama, mencoba hal baru, dan membangun rasa percaya diri...",
    paragraphs: [
      "Beragam kegiatan di pesantren memberi kesempatan kepada santri untuk bekerja sama dan mengenali minat mereka. Setiap kegiatan menjadi pengalaman belajar yang melengkapi pembelajaran di kelas.",
      "Melalui kebersamaan, santri belajar menghargai peran teman, berani menyampaikan gagasan, dan menyelesaikan tanggung jawab bersama.",
    ],
  },
  {
    id: "marawis-mbs-purworejo",
    image: "/images/prestasi3.jpg",
    category: "Prestasi",
    date: "Jumat, 14 Agustus 2026",
    title: "Grup Marawis MBS Purworejo tampil penuh semangat",
    excerpt: "Kreativitas santri tumbuh melalui latihan rutin, kekompakan, dan keberanian tampil di hadapan masyarakat...",
    paragraphs: [
      "Grup marawis MBS Purworejo terus mengasah kekompakan melalui latihan rutin. Para santri belajar menjaga irama, saling mendengarkan, dan tampil percaya diri.",
      "Penampilan mereka menjadi salah satu cara untuk menyalurkan kreativitas sekaligus mengenalkan semangat seni islami kepada masyarakat.",
    ],
  },
  {
    id: "santri-berbagi-literasi",
    image: "/images/santri1.jpg",
    category: "Kegiatan",
    date: "Rabu, 12 Agustus 2026",
    title: "Santri berbagi semangat literasi bersama masyarakat",
    excerpt: "Kegiatan bersama masyarakat menjadi pengalaman belajar untuk menumbuhkan kepedulian dan kebiasaan membaca...",
    paragraphs: [
      "Santri dan masyarakat berbagi waktu dalam kegiatan literasi yang menghadirkan buku, permainan edukatif, dan obrolan ringan. Suasana terbuka membuat anak-anak lebih mudah menikmati kegiatan membaca.",
      "Kegiatan ini juga menjadi kesempatan bagi santri untuk belajar peduli dan terlibat langsung dalam aktivitas positif bersama warga.",
    ],
  },
  {
    id: "kegiatan-belajar-harian",
    image: "/images/card.jpeg",
    category: "Pendidikan",
    date: "Senin, 10 Agustus 2026",
    title: "Mengenal kegiatan belajar harian di MBS Purworejo",
    excerpt: "Hari-hari santri diisi dengan kegiatan belajar, ibadah, dan kebersamaan yang mendukung tumbuh kembang mereka...",
    paragraphs: [
      "Hari-hari santri di MBS Purworejo diisi dengan kegiatan belajar, ibadah, dan kebersamaan. Rutinitas yang terarah membantu santri menjaga keseimbangan antara belajar dan kehidupan sehari-hari.",
      "Di dalam maupun di luar kelas, mereka mendapat kesempatan untuk membangun rasa ingin tahu, tanggung jawab, dan kemandirian.",
    ],
  },
  {
    id: "apresiasi-prestasi-santri",
    image: "/images/prestasi1.jpg",
    category: "Prestasi",
    date: "Kamis, 6 Agustus 2026",
    title: "Apresiasi untuk kerja keras dan ketekunan para santri",
    excerpt: "Setiap pencapaian berawal dari langkah kecil, latihan yang tekun, dan dukungan dari lingkungan pesantren...",
    paragraphs: [
      "Setiap pencapaian berawal dari langkah kecil dan latihan yang tekun. MBS Purworejo mengapresiasi usaha para santri yang terus belajar dan berani mencoba hal baru.",
      "Apresiasi ini diharapkan menjaga semangat mereka untuk tumbuh, memperbaiki diri, dan berbagi inspirasi dengan teman-teman.",
    ],
  },
  {
    id: "hari-kebersamaan-santri",
    image: "/images/prestasi2.jpg",
    category: "Kegiatan",
    date: "Selasa, 4 Agustus 2026",
    title: "Hari kebersamaan yang mempererat persaudaraan santri",
    excerpt: "Momen bersama di pesantren menghadirkan cerita hangat dan kenangan yang tumbuh bersama...",
    paragraphs: [
      "Kegiatan kebersamaan menghadirkan momen hangat yang mempererat hubungan ant santri. Mereka mengikuti aktivitas bersama, berbagi cerita, dan saling mendukung.",
      "Pengalaman sederhana seperti ini menjadi bagian penting dari kehidupan pesantren dan kenangan yang tumbuh bersama.",
    ],
  },
];
