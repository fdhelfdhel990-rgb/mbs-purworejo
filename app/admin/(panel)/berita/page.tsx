import CollectionManager from "../../components/collection-manager";

export default function AdminNewsPage() {
  return (
    <CollectionManager
      table="news_articles"
      title="Berita"
      description="Tulis dan kelola cerita kegiatan, pendidikan, dan prestasi yang akan dibaca pengunjung."
      summaryField="title"
      fields={[
        { name: "title", label: "Judul berita", required: true },
        { name: "category", label: "Kategori", type: "category" },
        {
          name: "excerpt",
          label: "Ringkasan berita (Excerpt)",
          type: "textarea",
          required: true,
          hint: "Ringkasan singkat yang akan muncul di kartu berita beranda.",
        },
        {
          name: "image_url",
          label: "Foto Utama Berita",
          type: "image",
          required: true,
          hint: "Klik tombol 'Pilih & Unggah Foto' untuk mengunggah dari komputer atau masukkan URL gambar.",
        },
        { name: "image_alt", label: "Deskripsi gambar (alt)" },
        { name: "published_at", label: "Tanggal publikasi", type: "date" },
        {
          name: "paragraphs",
          label: "Isi Berita Lengkap",
          type: "richtext",
          required: true,
          hint: "Gunakan toolbar formatting di atas untuk menebalkan teks, memiringkan, garis bawah, subjudul, atau daftar poin.",
        },
        { name: "status", label: "Status Publikasi", type: "select", options: ["published", "draft"] },
      ]}
    />
  );
}
