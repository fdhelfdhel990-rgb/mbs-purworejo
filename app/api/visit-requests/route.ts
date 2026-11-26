import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseConfig } from "../../../lib/supabase/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Layanan formulir belum dikonfigurasi." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid body");
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Format data formulir tidak valid." }, { status: 400 });
  }

  // Honeypot field for basic bot filtering.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const visitDate = typeof body.date === "string" ? body.date : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const parsedDate = DATE_PATTERN.test(visitDate) ? new Date(`${visitDate}T00:00:00.000Z`) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === visitDate;

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json({ error: "Nama harus berisi 2 sampai 120 karakter." }, { status: 400 });
  }
  if (phone.length < 6 || phone.length > 32) {
    return NextResponse.json({ error: "Nomor telepon harus berisi 6 sampai 32 karakter." }, { status: 400 });
  }
  if (!validDate) {
    return NextResponse.json({ error: "Tanggal kunjungan tidak valid." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Pesan maksimal 2.000 karakter." }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("visit_requests").insert({
      name,
      phone,
      visit_date: visitDate,
      message,
    });

    if (error) {
      console.error("Failed to save visit request:", error.message);
      return NextResponse.json({ error: "Permintaan belum tersimpan. Silakan coba kembali." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Layanan formulir sedang tidak tersedia." }, { status: 503 });
  }
}
