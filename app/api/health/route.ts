import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ ok: true, backend: "not-configured" });
  }
  const { error } = await supabase.from("branches").select("id").limit(1);
  return NextResponse.json({ ok: !error, backend: error ? "error" : "supabase" }, { status: error ? 503 : 200 });
}
