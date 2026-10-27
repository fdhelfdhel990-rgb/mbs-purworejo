import CollectionManager from "../../components/collection-manager";

export default function AdminAchievementsPage() {
  return (
    <CollectionManager
      table="achievements"
      title="Prestasi"
      description="Atur foto poster dan keterangan santri yang tampil pada Galeri Prestasi."
      summaryField="title"
      fields={[
        { name: "title", label: "Judul prestasi", required: true },
        { name: "detail", label: "Keterangan singkat", type: "textarea" },
        {
          name: "image_url",
          label: "Foto / Poster Prestasi",
          type: "image",
          required: true,
          hint: "Pilih foto dari komputer Anda atau masukkan URL gambar.",
        },
        { name: "image_alt", label: "Deskripsi poster (alt)" },
        { name: "year", label: "Tahun", type: "number" },
        { name: "sort_order", label: "Urutan tampil (0 = paling awal)", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["published", "draft"] },
      ]}
    />
  );
}
