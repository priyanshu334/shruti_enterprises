import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const staffId = context.params.id;

    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", staffId)
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

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const staffId = context.params.id;

    const { data, error } = await supabase
      .from("staff")
      .delete()
      .eq("id", staffId)
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
