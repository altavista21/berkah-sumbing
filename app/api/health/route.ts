import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: "local",
    message: "Berkah Sumbing POS berjalan dengan penyimpanan lokal perangkat."
  });
}
