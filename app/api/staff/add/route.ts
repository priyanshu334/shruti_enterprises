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

async function uploadToCloudinaryFromBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (err, result) => {
        if (err) return reject(err);
        if (!result?.secure_url) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

function getField(formData: FormData, key: string, isBool = false) {
  const value = formData.get(key);
  if (value === null) return null;
  if (isBool) return value.toString() === "true";
  return value.toString();
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fields = {
      firm_id: getField(formData, "firmId"),
      company_id: getField(formData, "companyId"),
      name: getField(formData, "name") || "",
      father_name: getField(formData, "fatherName") || "",
      address: getField(formData, "address") || "",
      aadhar_number: getField(formData, "aadharNumber") || "",
      phone: getField(formData, "phoneNumber") || "",
      gender: getField(formData, "gender") || "",
      blood_group: getField(formData, "bloodGroup") || "",
      dob: getField(formData, "dob"),
      esic_number: getField(formData, "esicNumber") || "",
      uan_number: getField(formData, "uanNumber") || "",
      doj: getField(formData, "doj"),
      exit_date: getField(formData, "exitDate"),
      account_number: getField(formData, "accountNumber") || "",
      ifsc_code: getField(formData, "ifscCode") || "",
      is_active: getField(formData, "isActive", true),
    };

    const staffImage = formData.get("staffImage") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;
    const aadharBackside = formData.get("aadharBackside") as File | null;
    const bankPassbook = formData.get("bankPassbook") as File | null;

    const supabase = await createSupabaseServerClient();

    // 1️⃣ Upload to Supabase Storage first
    async function uploadToSupabase(file: File | null, bucket: string) {
      if (!file || file.size === 0) return null;
      const filePath = `${randomUUID()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    }

    const [
      staffImageUrl,
      aadharCardUrl,
      aadharBacksideUrl,
      bankPassbookUrl,
    ] = await Promise.all([
      uploadToSupabase(staffImage, "staff-images"),
      uploadToSupabase(aadharCard, "staff-documents"),
      uploadToSupabase(aadharBackside, "staff-documents"),
      uploadToSupabase(bankPassbook, "staff-documents"),
    ]);

    // 2️⃣ Insert record with Supabase Storage URLs
    const { data: insertedData, error: insertError } = await supabase
      .from("staff")
      .insert([
        {
          ...fields,
          staff_image_url: staffImageUrl,
          aadhar_card_url: aadharCardUrl,
          aadhar_backside_url: aadharBacksideUrl,
          bank_passbook_url: bankPassbookUrl,
        },
      ])
      .select("id");

    if (insertError) throw insertError;

    const staffId = insertedData[0]?.id;

    // 3️⃣ Background Cloudinary upload (non-blocking)
    (async () => {
      try {
        const [
          cloudStaffUrl,
          cloudAadharUrl,
          cloudAadharBacksideUrl,
          cloudPassbookUrl,
        ] = await Promise.all([
          staffImage?.size ? uploadToCloudinaryFromBuffer(staffImage) : null,
          aadharCard?.size ? uploadToCloudinaryFromBuffer(aadharCard) : null,
          aadharBackside?.size
            ? uploadToCloudinaryFromBuffer(aadharBackside)
            : null,
          bankPassbook?.size
            ? uploadToCloudinaryFromBuffer(bankPassbook)
            : null,
        ]);

        await supabase
          .from("staff")
          .update({
            staff_image_url: cloudStaffUrl || staffImageUrl,
            aadhar_card_url: cloudAadharUrl || aadharCardUrl,
            aadhar_backside_url: cloudAadharBacksideUrl || aadharBacksideUrl,
            bank_passbook_url: cloudPassbookUrl || bankPassbookUrl,
          })
          .eq("id", staffId);
      } catch (bgErr) {
        console.error("Background Cloudinary upload failed:", bgErr);
      }
    })();

    // Respond immediately without waiting for Cloudinary
    return NextResponse.json({
      success: true,
      message:
        "Staff added successfully. Files are being processed in background.",
      data: insertedData,
    });
  } catch (err: any) {
    console.error("Add staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error adding staff" },
      { status: 500 }
    );
  }
}
