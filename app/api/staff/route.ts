import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("staff").select("*");

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Get all staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error fetching staff list" },
      { status: 500 }
    );
  }
}
