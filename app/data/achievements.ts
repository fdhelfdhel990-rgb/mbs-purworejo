export type Achievement = { id: string; image: string; title: string; detail: string; imageAlt?: string };

export const defaultAchievements: Achievement[] = [
  { id: "kejuaraan-tapaksuci", image: "/images/prestasi1.jpg", title: "Kejuaraan Tapaksuci tingkat kecamatan", detail: "Harapan 1", imageAlt: "Siswa meraih Kejuaraan Tapaksuci" },
  { id: "syukuri-hari-ini", image: "/images/prestasi2.jpg", title: "Syukuri hari ini, esok berprestasi lagi", detail: "Pencapaian santri", imageAlt: "Santri MBS berprestasi" },
  { id: "juara-cyber-security", image: "/images/prestasi3.jpg", title: "Juara 3 Cyber Security tingkat Kota Depok", detail: "Lomba Kompetensi Siswa", imageAlt: "Juara Cyber Security" },
  { id: "prestasi-kompetisi", image: "/images/prestasi1.jpg", title: "Prestasi santri MBS Purworejo", detail: "Terus berkarya dan menginspirasi", imageAlt: "Prestasi santri" },
  { id: "kebersamaan-prestasi", image: "/images/prestasi2.jpg", title: "Kebersamaan meraih prestasi", detail: "Tumbuh bersama MBS Purworejo", imageAlt: "Kebersamaan santri" },
];
