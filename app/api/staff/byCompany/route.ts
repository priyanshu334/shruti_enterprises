import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Extract companyId from query parameters
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "companyId query param is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("company_id", companyId);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Get staff by company error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error fetching staff by company" },
      { status: 500 }
    );
  }
}
