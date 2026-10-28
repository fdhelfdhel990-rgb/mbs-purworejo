import CollectionManager from "../../components/collection-manager";

export default function AdminFaqPage() {
  return (
    <CollectionManager
      table="faqs"
      title="FAQ"
      description="Kelola pertanyaan dan jawaban yang sering disampaikan calon santri dan orang tua. Jumlah FAQ ditetapkan tetap sesuai daftar saat ini."
      summaryField="question"
      allowAdd={false}
      allowDelete={false}
      fields={[
        { name: "question", label: "Pertanyaan", required: true },
        { name: "answer", label: "Jawaban", type: "textarea", required: true },
        { name: "sort_order", label: "Urutan tampil", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
      ]}
    />
  );
}
