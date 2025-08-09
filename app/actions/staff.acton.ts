"use server";

import { google } from "googleapis";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// -----------------------------
// Google Drive Auth
// -----------------------------
function getDriveClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}
// -----------------------------
// Upload file to Drive
// -----------------------------
async function uploadFileToDrive(file: File, folderId: string) {
  const drive = getDriveClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data } = await drive.files.create({
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    media: {
      mimeType: file.type,
      body: Buffer.from(buffer),
    },
    fields: "id, webViewLink, webContentLink",
  });

  return data.webViewLink || null;
}

// -----------------------------
// Add Staff
// -----------------------------
export async function addStaffAction(formData: any) {
  try {
    const supabase = await createSupabaseServerClient();

    // Upload media files to Google Drive
    const uploadedMedia: Record<string, string | null> = {};
    for (const key of ["staffImage", "aadharCard", "bankPassbook"]) {
      if (formData[key]) {
        uploadedMedia[key] = await uploadFileToDrive(
          formData[key],
          process.env.GOOGLE_DRIVE_FOLDER_ID!
        );
      } else {
        uploadedMedia[key] = null;
      }
    }

    const { data, error } = await supabase.from("staff").insert([
      {
        firm_id: formData.firmId,
        company_id: formData.companyId,
        name: formData.name,
        father_name: formData.fatherName,
        address: formData.address,
        aadhar_number: formData.aadharNumber,
        phone: formData.phoneNumber,
        gender: formData.gender,
        blood_group: formData.bloodGroup,
        dob: formData.dob,
        esic_number: formData.esicNumber,
        uan_number: formData.uanNumber,
        doj: formData.doj,
        exit_date: formData.exitDate,
        account_number: formData.accountNumber,
        ifsc_code: formData.ifscCode,
        is_active: formData.isActive,
        staff_image_url: uploadedMedia.staffImage,
        aadhar_card_url: uploadedMedia.aadharCard,
        bank_passbook_url: uploadedMedia.bankPassbook,
      },
    ]);

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Add staff error:", err);
    return { success: false, message: err.message || "Error adding staff" };
  }
}

// -----------------------------
// Edit Staff
// -----------------------------
export async function editStaffAction(id: string, formData: any) {
  try {
    const supabase = await createSupabaseServerClient();

    // Access formData like an object or FormData, but be careful if it’s actually FormData
    const updates: Record<string, any> = {
      firm_id: formData.get?.("firmId") || formData.firmId || null,
      company_id: formData.get?.("companyId") || formData.companyId || null,
      name: formData.get?.("name") || formData.name || "",
      father_name: formData.get?.("fatherName") || formData.fatherName || "",
      address: formData.get?.("address") || formData.address || "",
      aadhar_number: formData.get?.("aadhar") || formData.aadhar || "",
      phone: formData.get?.("phone") || formData.phone || "",
      gender: formData.get?.("gender") || formData.gender || "",
      blood_group: formData.get?.("bloodGroup") || formData.bloodGroup || "",
      dob: formData.get?.("dob") || formData.dob || null,
      esic_number: formData.get?.("esic") || formData.esic || "",
      uan_number: formData.get?.("uan") || formData.uan || "",
      doj: formData.get?.("doj") || formData.doj || null,
      exit_date: formData.get?.("exitDate") || formData.exitDate || null,
      account_number: formData.get?.("account") || formData.account || "",
      ifsc_code: formData.get?.("ifsc") || formData.ifsc || "",
      is_active:
        formData.get?.("isActive") === "true" ||
        formData.isActive === true ||
        formData.isActive === "true",
    };

    // For files, check similarly
    const staffImage = formData.get?.("staffImage") || formData.staffImage || null;
    const aadharCard = formData.get?.("aadharCard") || formData.aadharCard || null;
    const bankPassbook = formData.get?.("bankPassbook") || formData.bankPassbook || null;

    if (staffImage && staffImage.size > 0) {
      updates.staff_image_url = await uploadFileToDrive(
        staffImage,
        process.env.GOOGLE_DRIVE_FOLDER_ID!
      );
    }
    if (aadharCard && aadharCard.size > 0) {
      updates.aadhar_card_url = await uploadFileToDrive(
        aadharCard,
        process.env.GOOGLE_DRIVE_FOLDER_ID!
      );
    }
    if (bankPassbook && bankPassbook.size > 0) {
      updates.bank_passbook_url = await uploadFileToDrive(
        bankPassbook,
        process.env.GOOGLE_DRIVE_FOLDER_ID!
      );
    }

    const { error } = await supabase.from("staff").update(updates).eq("id", id);
    if (error) throw error;

    revalidatePath("/staff");
    return { success: true, message: "Staff updated successfully" };
  } catch (err: any) {
    console.error("Edit staff error:", err);
    return { success: false, message: err.message || "Error updating staff" };
  }
}


// -----------------------------
// View Staff
// -----------------------------
export async function getStaffByIdAction(id: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    console.error("Get staff error:", err);
    return { success: false, message: err.message || "Error fetching staff" };
  }
}

// -----------------------------
// Delete Staff
// -----------------------------
export async function deleteStaffAction(id: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("staff").delete().eq("id", id);

    if (error) throw error;

    revalidatePath("/staff");
    return { success: true, message: "Staff deleted successfully" };
  } catch (err: any) {
    console.error("Delete staff error:", err);
    return { success: false, message: err.message || "Error deleting staff" };
  }
}

// -----------------------------
// Get All Staff
// -----------------------------
export async function getAllStaffAction() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("staff").select("*");

    if (error) throw error;

    return { success: true, data };
  } catch (err: any) {
    console.error("Get all staff error:", err);
    return { success: false, message: err.message || "Error fetching staff list" };
  }
}
