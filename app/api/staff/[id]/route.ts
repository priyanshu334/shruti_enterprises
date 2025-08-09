import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Parse URL to get `id`
    const url = new URL(req.url);
    const pathname = url.pathname; // e.g. /api/staff/123
    const id = pathname.split("/").pop(); // get last segment as id

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Get staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error fetching staff" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const url = new URL(req.url);
    const pathname = url.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("staff")
      .delete()
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff deleted successfully",
      deleted: data.length,
    });
  } catch (err: any) {
    console.error("Delete staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error deleting staff" },
      { status: 500 }
    );
  }
}
