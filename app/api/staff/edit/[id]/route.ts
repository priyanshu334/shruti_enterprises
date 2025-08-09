import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config — make sure your env vars are set!
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// Helper to upload file to Cloudinary
async function uploadFileToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();

    const id = params.id;
    const formData = await req.formData();

    // Prepare update fields — align keys with your DB columns
    const updates: Record<string, any> = {
      firm_id: formData.get("firmId")?.toString() || null,
      company_id: formData.get("companyId")?.toString() || null,
      name: formData.get("name")?.toString() || "",
      father_name: formData.get("fatherName")?.toString() || "",
      address: formData.get("address")?.toString() || "",
      aadhar_number: formData.get("aadharNumber")?.toString() || "",
      phone: formData.get("phoneNumber")?.toString() || "",
      gender: formData.get("gender")?.toString() || "",
      blood_group: formData.get("bloodGroup")?.toString() || "",
      dob: formData.get("dob")?.toString() || null,
      esic_number: formData.get("esicNumber")?.toString() || "",
      uan_number: formData.get("uanNumber")?.toString() || "",
      doj: formData.get("doj")?.toString() || null,
      exit_date: formData.get("exitDate")?.toString() || null,
      account_number: formData.get("accountNumber")?.toString() || "",
      ifsc_code: formData.get("ifscCode")?.toString() || "",
      is_active: formData.get("isActive")?.toString() === "true",
    };

    // Files from formData
    const staffImage = formData.get("staffImage") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;
    const bankPassbook = formData.get("bankPassbook") as File | null;

    if (staffImage && staffImage.size > 0) {
      updates.staff_image_url = await uploadFileToCloudinary(staffImage);
    }
    if (aadharCard && aadharCard.size > 0) {
      updates.aadhar_card_url = await uploadFileToCloudinary(aadharCard);
    }
    if (bankPassbook && bankPassbook.size > 0) {
      updates.bank_passbook_url = await uploadFileToCloudinary(bankPassbook);
    }

    // Update staff record and return updated data
    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Staff updated successfully",
      data,
    });
  } catch (err: any) {
    console.error("Edit staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error updating staff" },
      { status: 500 }
    );
  }
}
