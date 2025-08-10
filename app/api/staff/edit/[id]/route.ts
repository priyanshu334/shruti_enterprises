import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadToSupabaseWithPath(
  supabase: any,
  file: File | null,
  bucket: string
): Promise<{ filePath: string | null; publicUrl: string | null }> {
  if (!file || file.size === 0) return { filePath: null, publicUrl: null };

  const filePath = `${randomUUID()}-${file.name}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return { filePath, publicUrl: publicUrlData.publicUrl };
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing staff ID" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const formData = await req.formData();

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

    const staffImage = formData.get("staffImage") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;
    const bankPassbook = formData.get("bankPassbook") as File | null;

    // Upload to Supabase and store file paths for later deletion
    const [
      { filePath: staffPath, publicUrl: staffImageUrl },
      { filePath: aadharPath, publicUrl: aadharCardUrl },
      { filePath: passbookPath, publicUrl: bankPassbookUrl },
    ] = await Promise.all([
      uploadToSupabaseWithPath(supabase, staffImage, "staff-images"),
      uploadToSupabaseWithPath(supabase, aadharCard, "staff-documents"),
      uploadToSupabaseWithPath(supabase, bankPassbook, "staff-documents"),
    ]);

    if (staffImageUrl) updates.staff_image_url = staffImageUrl;
    if (aadharCardUrl) updates.aadhar_card_url = aadharCardUrl;
    if (bankPassbookUrl) updates.bank_passbook_url = bankPassbookUrl;

    // Save initial record with Supabase URLs
    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Background Cloudinary upload + Supabase cleanup
    (async () => {
      try {
        const [cloudStaffUrl, cloudAadharUrl, cloudPassbookUrl] =
          await Promise.all([
            staffImage?.size ? uploadToCloudinary(staffImage) : null,
            aadharCard?.size ? uploadToCloudinary(aadharCard) : null,
            bankPassbook?.size ? uploadToCloudinary(bankPassbook) : null,
          ]);

        const finalUpdates: Record<string, any> = {};

        if (cloudStaffUrl) {
          finalUpdates.staff_image_url = cloudStaffUrl;
          if (staffPath) {
            await supabase.storage.from("staff-images").remove([staffPath]);
          }
        }
        if (cloudAadharUrl) {
          finalUpdates.aadhar_card_url = cloudAadharUrl;
          if (aadharPath) {
            await supabase.storage.from("staff-documents").remove([aadharPath]);
          }
        }
        if (cloudPassbookUrl) {
          finalUpdates.bank_passbook_url = cloudPassbookUrl;
          if (passbookPath) {
            await supabase.storage.from("staff-documents").remove([passbookPath]);
          }
        }

        if (Object.keys(finalUpdates).length > 0) {
          await supabase.from("staff").update(finalUpdates).eq("id", id);
        }
      } catch (bgErr) {
        console.error("Background Cloudinary upload or Supabase cleanup failed:", bgErr);
      }
    })();

    return NextResponse.json({
      success: true,
      message:
        "Staff updated successfully. Files uploaded to Supabase and Cloudinary processing in background. Supabase files will be deleted after Cloudinary upload.",
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
