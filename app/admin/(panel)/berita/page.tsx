import CollectionManager from "../../components/collection-manager";

export default function AdminNewsPage() {
  return <CollectionManager table="news_articles" title="Berita" description="Tulis cerita kegiatan, pendidikan, dan prestasi yang akan dibaca pengunjung." summaryField="title" fields={[
    { name: "title", label: "Judul berita", required: true },
    { name: "category", label: "Kategori", type: "select", options: ["Kegiatan", "Pendidikan", "Prestasi"] },
    { name: "excerpt", label: "Ringkasan", type: "textarea", required: true },
    { name: "image_url", label: "URL gambar", required: true, hint: "Unggah media melalui Media Library setelah modul penyimpanan dihubungkan." },
    { name: "image_alt", label: "Deskripsi gambar (alt)" },
    { name: "published_at", label: "Tanggal publikasi", type: "date" },
    { name: "paragraphs", label: "Isi berita — satu paragraf per baris", type: "textarea", required: true },
    { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
  ]} />;
}
