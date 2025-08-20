"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import DeleteStaffDialog from "@/components/DeleteStaffDialog";
import {
  User,
  Phone,
  Calendar,
  Heart,
  MapPin,
  CreditCard,
  Building,
  FileText,
  Briefcase,
  Shield,
  Clock,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Staff {
  id: string;
  name: string;
  father_name: string;
  address: string;
  aadhar_number: string;
  phone: string;
  gender: string;
  blood_group: string;
  dob: string;
  esic_number: string;
  uan_number: string;
  doj: string;
  exit_date: string | null;
  account_number: string;
  ifsc_code: string;
  staff_image_url: string | null;
  aadhar_card_url: string | null;
  aadhar_backside_url: string | null;
  bank_passbook_url: string | null;
  firm_id: string;
  company_id: string;
  is_active: boolean;
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const params = useParams();

  const staffId = typeof params?.id === "string" ? params.id : null;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch staff data once params are available
  useEffect(() => {
    if (!staffId) return;

    const fetchStaff = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/staff/${staffId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch staff");
        const data = await res.json();
        if (data.success) {
          setStaff(data.data);
        } else {
          setStaff(null);
        }
      } catch (err) {
        console.error(err);
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [staffId]);

  // Delete staff
  const handleDelete = async () => {
    if (!staff) return;
    const confirmed = confirm("Are you sure you want to delete this staff?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDeleteDialogOpen(false);
        router.push("/staff");
      } else {
        alert("Failed to delete staff: " + data.message);
      }
    } catch (err) {
      alert("Failed to delete staff: " + (err as Error).message);
    }
  };

  // Download PDF
  const handleDownloadPDF = () => {
    if (!staff) return;
    const doc = new jsPDF();

    // Page 1 : Employee Details
    doc.setFontSize(18);
    doc.text("Employee Profile", 14, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${staff.name}`, 14, 30);
    doc.text(`Status: ${staff.is_active ? "Active" : "Inactive"}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [["Field", "Value"]],
      body: [
        ["Full Name", staff.name],
        ["Father's Name", staff.father_name],
        ["Aadhar Number", staff.aadhar_number],
        ["Phone Number", staff.phone],
        ["Date of Birth", staff.dob],
        ["Gender", staff.gender],
        ["Blood Group", staff.blood_group],
        ["Account Number", staff.account_number],
        ["IFSC Code", staff.ifsc_code],
        ["Firm ID", staff.firm_id],
        ["Company ID", staff.company_id],
        ["UAN Number", staff.uan_number],
        ["ESIC Number", staff.esic_number],
        ["Date of Joining", staff.doj],
        ["Exit Date", staff.exit_date || "N/A"],
        ["Address", staff.address],
      ],
      theme: "grid",
    });

    // Function to load & add image
    const loadImageAndAdd = (
      url: string,
      x: number,
      y: number,
      w: number,
      h: number,
      label: string
    ) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => {
          doc.addImage(img, "JPEG", x, y, w, h);
          doc.setFontSize(10);
          doc.text(label, x, y + h + 5);
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    (async () => {
      const images = [
        { url: staff.staff_image_url, label: "Profile Image" },
        { url: staff.aadhar_card_url, label: "Aadhar Card" },
        { url: staff.aadhar_backside_url, label: "Aadhar Backside" },
        { url: staff.bank_passbook_url, label: "Bank Passbook" },
      ].filter((img) => img.url);

      if (images.length > 0) {
        // Start new page for images
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Employee Documents", 14, 20);

        const imgW = 80;
        const imgH = 70;
        const gapX = 10;
        const gapY = 30;
        let x = 14;
        let y = 30;

        for (let i = 0; i < images.length; i++) {
          const col = i % 2; // 0 = left, 1 = right
          const row = Math.floor(i / 2);

          x = 14 + col * (imgW + gapX);
          y = 30 + row * (imgH + gapY);

          await loadImageAndAdd(
            images[i].url!,
            x,
            y,
            imgW,
            imgH,
            images[i].label
          );
        }
      }

      // Save PDF
      doc.save(`${staff.name.replace(/\s+/g, "_")}_Profile.pdf`);
    })();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading staff data...
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-semibold">
        Staff not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Employee Profile
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </div>

        {/* Basic Info */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
            <User className="w-6 h-6 text-blue-600" />
            Basic Information
          </h2>
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative group">
              <div className="absolute -inset-1 blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              {staff.staff_image_url ? (
                <img
                  src={staff.staff_image_url}
                  alt={staff.name}
                  width={240}
                  height={240}
                  className="relative rounded-md border-4 border-white shadow-xl"
                />
              ) : (
                <div className="w-[240px] h-[240px] bg-gray-200 rounded-md border-4 border-white shadow-xl flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
              <div
                className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-3 border-white shadow-lg ${
                  staff.is_active ? "bg-green-500" : "bg-gray-400"
                }`}
              ></div>
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold text-gray-900">{staff.name}</h3>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <p>{staff.address}</p>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  staff.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    staff.is_active ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                {staff.is_active ? "Active Employee" : "Inactive Employee"}
              </div>
            </div>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Full Name", value: staff.name, icon: User },
              { label: "Father's Name", value: staff.father_name, icon: User },
              {
                label: "Aadhar Number",
                value: staff.aadhar_number,
                icon: Shield,
              },
              { label: "Phone Number", value: staff.phone, icon: Phone },
              { label: "Date of Birth", value: staff.dob, icon: Calendar },
              { label: "Gender", value: staff.gender, icon: User },
              { label: "Blood Group", value: staff.blood_group, icon: Heart },
            ].map(({ label, value, icon: Icon }, i) => (
              <div
                key={i}
                className="group p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <p className="text-gray-500 text-sm font-medium">{label}</p>
                </div>
                <p className="text-gray-800 font-semibold text-lg ml-7">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bank Info */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Bank Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-300 border border-emerald-100">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <p className="text-gray-600 text-sm font-medium">
                  Account Number
                </p>
              </div>
              <p className="text-gray-800 font-bold text-xl font-mono">
                {staff.account_number}
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-5 h-5 text-blue-600" />
                <p className="text-gray-600 text-sm font-medium">IFSC Code</p>
              </div>
              <p className="text-gray-800 font-bold text-xl font-mono">
                {staff.ifsc_code}
              </p>
            </div>
          </div>
        </section>

        {/* Work Info */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-purple-600" />
            Work Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Firm ID", value: staff.firm_id, icon: Building },
              { label: "Company ID", value: staff.company_id, icon: Building },
              { label: "UAN Number", value: staff.uan_number, icon: Shield },
              { label: "ESIC Number", value: staff.esic_number, icon: Shield },
              { label: "Date of Joining", value: staff.doj, icon: Calendar },
              {
                label: "Exit Date",
                value: staff.exit_date || "N/A",
                icon: Clock,
              },
            ].map(({ label, value, icon: Icon }, i) => (
              <div
                key={i}
                className="group p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-100 hover:border-purple-200"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-4 h-4 text-purple-500 group-hover:text-purple-600 transition-colors" />
                  <p className="text-gray-500 text-sm font-medium">{label}</p>
                </div>
                <p className="text-gray-800 font-semibold text-lg ml-7">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Documents */}
        <section className="rounded-2xl shadow-lg shadow-gray-400 border border-white/20 p-8 mb-12 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-3">
            <FileText className="w-6 h-6 text-amber-600" />
            Document Images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {staff.aadhar_card_url ? (
              <div className="group relative overflow-hidden rounded-2xl border border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img
                  src={staff.aadhar_card_url}
                  alt="Aadhar Card"
                  width={500}
                  height={300}
                  className="rounded-2xl border-2 border-white shadow-lg object-cover w-full h-72 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-lg">
                    Aadhar Card
                  </p>
                </div>
              </div>
            ) : null}
            {staff.aadhar_backside_url ? (
              <div className="group relative overflow-hidden rounded-2xl border border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img
                  src={staff.aadhar_backside_url}
                  alt="Aadhar Backside"
                  width={500}
                  height={300}
                  className="rounded-2xl border-2 border-white shadow-lg object-cover w-full h-72 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-lg">
                    Aadhar Backside
                  </p>
                </div>
              </div>
            ) : null}
            {staff.bank_passbook_url ? (
              <div className="group relative overflow-hidden rounded-2xl border border-gray-800">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                <img
                  src={staff.bank_passbook_url}
                  alt="Bank Passbook"
                  width={500}
                  height={300}
                  className="rounded-2xl border-2 border-white shadow-lg object-cover w-full h-72 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-lg">
                    Bank Passbook
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
          {/* Cancel Button */}
          <div className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 rounded-md font-semibold"
              onClick={() => router.push("/staff")}
            >
              Cancel
            </Button>
          </div>

          {/* Edit + Delete Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link href={`/staff/edit/${staff.id}`}>
              <Button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <Edit className="w-4 h-4 mr-2" />
                Edit Data
              </Button>
            </Link>

            <Button
              variant="destructive"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Data
            </Button>
            <Button
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 rounded-md font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={handleDownloadPDF}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteStaffDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirmDelete={handleDelete}
      />
    </div>
  );
}
