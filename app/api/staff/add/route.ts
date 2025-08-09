import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// Upload file to Cloudinary from a File object
async function uploadFileToCloudinary(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" }, // supports images/videos/etc.
      (error, result) => {
        if (error) return reject(error);
        if (!result || !result.secure_url) return reject(new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Parse incoming multipart form-data
    const formData = await req.formData();

    const firmId = formData.get("firmId")?.toString() || null;
    const companyId = formData.get("companyId")?.toString() || null;
    const name = formData.get("name")?.toString() || "";
    const fatherName = formData.get("fatherName")?.toString() || "";
    const address = formData.get("address")?.toString() || "";
    const aadharNumber = formData.get("aadharNumber")?.toString() || "";
    const phoneNumber = formData.get("phoneNumber")?.toString() || "";
    const gender = formData.get("gender")?.toString() || "";
    const bloodGroup = formData.get("bloodGroup")?.toString() || "";
    const dob = formData.get("dob")?.toString() || null;
    const esicNumber = formData.get("esicNumber")?.toString() || "";
    const uanNumber = formData.get("uanNumber")?.toString() || "";
    const doj = formData.get("doj")?.toString() || null;
    const exitDate = formData.get("exitDate")?.toString() || null;
    const accountNumber = formData.get("accountNumber")?.toString() || "";
    const ifscCode = formData.get("ifscCode")?.toString() || "";
    const isActive = formData.get("isActive")?.toString() === "true";

    // Extract files from formData
    const staffImage = formData.get("staffImage") as File | null;
    const aadharCard = formData.get("aadharCard") as File | null;
    const bankPassbook = formData.get("bankPassbook") as File | null;

    // Upload files to Cloudinary
    const uploadedMedia: Record<string, string | null> = {
      staffImage: null,
      aadharCard: null,
      bankPassbook: null,
    };

    if (staffImage && staffImage.size > 0) {
      uploadedMedia.staffImage = await uploadFileToCloudinary(staffImage);
    }
    if (aadharCard && aadharCard.size > 0) {
      uploadedMedia.aadharCard = await uploadFileToCloudinary(aadharCard);
    }
    if (bankPassbook && bankPassbook.size > 0) {
      uploadedMedia.bankPassbook = await uploadFileToCloudinary(bankPassbook);
    }

    // Insert staff record in Supabase
    const { data, error } = await supabase.from("staff").insert([
      {
        firm_id: firmId,
        company_id: companyId,
        name,
        father_name: fatherName,
        address,
        aadhar_number: aadharNumber,
        phone: phoneNumber,
        gender,
        blood_group: bloodGroup,
        dob,
        esic_number: esicNumber,
        uan_number: uanNumber,
        doj,
        exit_date: exitDate,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        is_active: isActive,
        staff_image_url: uploadedMedia.staffImage,
        aadhar_card_url: uploadedMedia.aadharCard,
        bank_passbook_url: uploadedMedia.bankPassbook,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Add staff error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error adding staff" },
      { status: 500 }
    );
  }
}
