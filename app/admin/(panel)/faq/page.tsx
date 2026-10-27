import CollectionManager from "../../components/collection-manager";

export default function AdminFaqPage() {
  return <CollectionManager table="faqs" title="FAQ" description="Kelola pertanyaan yang sering disampaikan calon santri dan orang tua." summaryField="question" fields={[
    { name: "question", label: "Pertanyaan", required: true },
    { name: "answer", label: "Jawaban", type: "textarea", required: true },
    { name: "sort_order", label: "Urutan tampil", type: "number" },
    { name: "status", label: "Status", type: "select", options: ["draft", "published"] },
  ]} />;
}
