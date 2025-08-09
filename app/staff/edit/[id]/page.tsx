"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useTransition,
  ChangeEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UploadCloud, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";

type Firm = { id: string; name: string };
type Company = { id: string; name: string; firm_id?: string };

type MediaPreview = {
  url: string;
  name: string;
  type: string;
  size: number;
} | null;

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const supabase = createClientComponentClient();

  // Form states
  const [form, setForm] = useState({
    name: "",
    fatherName: "",
    address: "",
    aadhar: "",
    phone: "",
    gender: "",
    bloodGroup: "",
    esic: "",
    uan: "",
    account: "",
    ifsc: "",
    firmId: "",
    companyId: "",
  });
  const [dob, setDob] = useState<Date | undefined>();
  const [doj, setDoj] = useState<Date | undefined>();
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [isActive, setIsActive] = useState(true);

  const [media, setMedia] = useState<{
    staffImage: File | null;
    aadharCard: File | null;
    bankPassbook: File | null;
  }>({
    staffImage: null,
    aadharCard: null,
    bankPassbook: null,
  });

  const [previews, setPreviews] = useState<{
    staffImage: MediaPreview;
    aadharCard: MediaPreview;
    bankPassbook: MediaPreview;
  }>({
    staffImage: null,
    aadharCard: null,
    bankPassbook: null,
  });

  const staffInputRef = useRef<HTMLInputElement | null>(null);
  const aadharInputRef = useRef<HTMLInputElement | null>(null);
  const passbookInputRef = useRef<HTMLInputElement | null>(null);

  const [firms, setFirms] = useState<Firm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rawCompanies, setRawCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function loadFirmsCompanies() {
      try {
        const { data: firmsData, error: firmsError } = await supabase
          .from("firms")
          .select("*");

        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*");

        if (!mounted) return;

        if (firmsError) throw firmsError;
        if (companiesError) throw companiesError;

        setFirms(firmsData ?? []);
        setRawCompanies(companiesData ?? []);
        setCompanies(companiesData ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setError("Failed to load firms or companies: " + err.message);
      }
    }

    loadFirmsCompanies();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadStaff() {
      if (!staffId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/staff/${staffId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load staff data");

        const json = await res.json();
        if (!mounted) return;

        if (json.success) {
          const staff = json.data;

          setForm({
            name: staff.name || "",
            fatherName: staff.father_name || "",
            address: staff.address || "",
            aadhar: staff.aadhar_number || "",
            phone: staff.phone || "",
            gender: staff.gender || "",
            bloodGroup: staff.blood_group || "",
            esic: staff.esic_number || "",
            uan: staff.uan_number || "",
            account: staff.account_number || "",
            ifsc: staff.ifsc_code || "",
            firmId: staff.firm_id || "",
            companyId: staff.company_id || "",
          });

          setDob(staff.dob ? new Date(staff.dob) : undefined);
          setDoj(staff.doj ? new Date(staff.doj) : undefined);
          setExitDate(staff.exit_date ? new Date(staff.exit_date) : undefined);
          setIsActive(staff.is_active ?? true);

          // Set previews for existing files
          setPreviews({
            staffImage: staff.staff_image_url
              ? {
                  url: staff.staff_image_url,
                  name: "staff-image.jpg",
                  type: "image/jpeg",
                  size: 0,
                }
              : null,
            aadharCard: staff.aadhar_card_url
              ? {
                  url: staff.aadhar_card_url,
                  name: "aadhar-card.jpg",
                  type: "image/jpeg",
                  size: 0,
                }
              : null,
            bankPassbook: staff.bank_passbook_url
              ? {
                  url: staff.bank_passbook_url,
                  name: "bank-passbook.jpg",
                  type: "image/jpeg",
                  size: 0,
                }
              : null,
          });
        } else {
          setError(json.message || "Failed to load staff data");
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Error loading staff data");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStaff();

    return () => {
      mounted = false;
      Object.values(previews).forEach((p) => {
        if (p?.url && p.url.startsWith("blob:")) {
          URL.revokeObjectURL(p.url);
        }
      });
    };
  }, [staffId]);

  // Filter companies based on selected firm
  useEffect(() => {
    if (!form.firmId) {
      setCompanies(rawCompanies);
      return;
    }
    const filtered = rawCompanies.filter(
      (c) => String(c.firm_id) === form.firmId
    );
    setCompanies(filtered.length ? filtered : rawCompanies);
  }, [form.firmId, rawCompanies]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: "staffImage" | "aadharCard" | "bankPassbook"
  ) => {
    const file = e.target.files?.[0] ?? null;
    const prev = previews[field];
    if (prev?.url && prev.url.startsWith("blob:")) {
      URL.revokeObjectURL(prev.url);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setMedia((m) => ({ ...m, [field]: file }));
      setPreviews((p) => ({
        ...p,
        [field]: { url, name: file.name, type: file.type, size: file.size },
      }));
    } else {
      setMedia((m) => ({ ...m, [field]: null }));
      setPreviews((p) => ({ ...p, [field]: null }));
    }
  };

  const removeFile = (field: "staffImage" | "aadharCard" | "bankPassbook") => {
    const prev = previews[field];
    if (prev?.url && prev.url.startsWith("blob:")) {
      URL.revokeObjectURL(prev.url);
    }

    setPreviews((p) => ({ ...p, [field]: null }));
    setMedia((m) => ({ ...m, [field]: null }));

    if (field === "staffImage" && staffInputRef.current)
      staffInputRef.current.value = "";
    if (field === "aadharCard" && aadharInputRef.current)
      aadharInputRef.current.value = "";
    if (field === "bankPassbook" && passbookInputRef.current)
      passbookInputRef.current.value = "";
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Please enter the staff name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = new FormData();

      // Append all form fields
      formData.append("firmId", form.firmId || "");
      formData.append("companyId", form.companyId || "");
      formData.append("name", form.name);
      formData.append("fatherName", form.fatherName);
      formData.append("address", form.address);
      formData.append("aadharNumber", form.aadhar);
      formData.append("phoneNumber", form.phone);
      formData.append("gender", form.gender);
      formData.append("bloodGroup", form.bloodGroup);
      formData.append("dob", dob ? dob.toISOString() : "");
      formData.append("esicNumber", form.esic);
      formData.append("uanNumber", form.uan);
      formData.append("doj", doj ? doj.toISOString() : "");
      formData.append("exitDate", exitDate ? exitDate.toISOString() : "");
      formData.append("accountNumber", form.account);
      formData.append("ifscCode", form.ifsc);
      formData.append("isActive", isActive ? "true" : "false");

      // Only append files if they're new (not existing URLs)
      if (media.staffImage) formData.append("staffImage", media.staffImage);
      if (media.aadharCard) formData.append("aadharCard", media.aadharCard);
      if (media.bankPassbook)
        formData.append("bankPassbook", media.bankPassbook);

      // Send to API route
      const res = await fetch(`/api/staff/edit/${staffId}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || "Failed to update staff");
      }

      const json = await res.json();

      if (json.success) {
        alert("Staff updated successfully!");
        router.push("/staff");
      } else {
        throw new Error(json.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update staff");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading staff data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex items-center justify-between px-6 pt-4">
        <h2 className="text-lg font-semibold">Edit Staff</h2>
        <div className="flex items-center space-x-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} />
          <span
            className={`font-medium ${
              isActive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 text-red-600 font-semibold">{error}</div>
      )}

      {/* Form grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
        {/* Personal Information */}
        <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-[#F4F4F4]">
          <h3 className="font-semibold border-b border-gray-300 pb-1">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label htmlFor="name" className="mb-2">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name"
              />
            </div>

            <div>
              <Label htmlFor="fatherName" className="mb-2">
                Father's Name
              </Label>
              <Input
                id="fatherName"
                name="fatherName"
                value={form.fatherName}
                onChange={(e) => update("fatherName", e.target.value)}
                placeholder="Father's Name"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="mb-2">
                Address
              </Label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Address"
                className="w-full border border-gray-300 rounded-md p-2 h-20 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="aadhar" className="mb-2">
                Aadhar Number
              </Label>
              <Input
                id="aadhar"
                name="aadhar"
                value={form.aadhar}
                onChange={(e) => update("aadhar", e.target.value)}
                placeholder="Aadhar Number"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="mb-2">
                Phone Number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="Phone Number"
              />
            </div>

            <div>
              <Label className="mb-2">Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => update("gender", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2">Blood Group</Label>
              <Select
                value={form.bloodGroup}
                onValueChange={(v) => update("bloodGroup", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Blood Group" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label className="text-sm mb-2">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-sm"
                  >
                    {dob ? format(dob, "PPP") : <span>Select date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dob}
                    onSelect={setDob}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="space-y-4 p-4 border border-gray-300 rounded-lg bg-[#F4F4F4]">
          <h3 className="font-semibold border-b border-gray-300 pb-1">
            Employee Details
          </h3>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <Label className="mb-2">Firm Name</Label>
              <Select
                value={form.firmId}
                onValueChange={(v) => update("firmId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Firm" />
                </SelectTrigger>
                <SelectContent>
                  {firms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2">Company Name</Label>
              <Select
                value={form.companyId}
                onValueChange={(v) => update("companyId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="esic" className="mb-2">
                ESIC Number
              </Label>
              <Input
                id="esic"
                name="esic"
                value={form.esic}
                onChange={(e) => update("esic", e.target.value)}
                placeholder="ESIC Number"
              />
            </div>
            <div>
              <Label htmlFor="uan" className="mb-2">
                UAN Number
              </Label>
              <Input
                id="uan"
                name="uan"
                value={form.uan}
                onChange={(e) => update("uan", e.target.value)}
                placeholder="UAN Number"
              />
            </div>

            <div>
              <Label className="text-sm mb-2">Date of Joining</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-sm"
                  >
                    {doj ? format(doj, "PPP") : <span>Select date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={doj}
                    onSelect={setDoj}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-sm mb-2">Exit Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-sm"
                  >
                    {exitDate ? (
                      format(exitDate, "PPP")
                    ) : (
                      <span>Select date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={exitDate}
                    onSelect={setExitDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-300">
            <h3 className="font-semibold mb-2">Bank Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account" className="m-2">
                  Account Number
                </Label>
                <Input
                  id="account"
                  name="account"
                  value={form.account}
                  onChange={(e) => update("account", e.target.value)}
                  placeholder="Account Number"
                />
              </div>
              <div>
                <Label htmlFor="ifsc" className="m-2">
                  IFSC Code
                </Label>
                <Input
                  id="ifsc"
                  name="ifsc"
                  value={form.ifsc}
                  onChange={(e) => update("ifsc", e.target.value)}
                  placeholder="IFSC Code"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Uploads */}
      <div className="mt-6 mx-4 p-4 border border-gray-300 rounded-lg bg-[#F4F4F4]">
        <h3 className="font-semibold border-b border-gray-300 pb-1 mb-4">
          Media
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Staff Image", field: "staffImage", ref: staffInputRef },
            { label: "Aadhar Card", field: "aadharCard", ref: aadharInputRef },
            {
              label: "Bank Passbook",
              field: "bankPassbook",
              ref: passbookInputRef,
            },
          ].map(({ label, field, ref }) => {
            const pv = previews[field as keyof typeof previews];
            return (
              <div
                key={field}
                className="p-3 border border-gray-200 rounded-md bg-white relative"
              >
                <Label className="mb-2 block">{label}</Label>

                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-3 h-40 cursor-pointer hover:bg-gray-50">
                  <div className="flex flex-col items-center">
                    <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                    <span className="text-sm">Click to upload</span>
                  </div>
                  <input
                    ref={ref as React.RefObject<HTMLInputElement>}
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) =>
                      handleFileChange(
                        e,
                        field as "staffImage" | "aadharCard" | "bankPassbook"
                      )
                    }
                  />
                </label>

                {/* preview area */}
                {pv ? (
                  <div className="mt-3 flex items-center space-x-3">
                    {pv.type?.startsWith("image/") ? (
                      <div className="w-40 h-40 rounded overflow-hidden border">
                        <img
                          src={pv.url}
                          alt={pv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded border flex items-center justify-center text-xs px-2">
                        <div>
                          <div className="font-medium">{pv.name}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="text-sm font-medium">{pv.name}</div>
                      <div className="text-xs text-gray-500">
                        {pv.size > 0 ? fmtSize(pv.size) : "Existing file"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(
                          field as "staffImage" | "aadharCard" | "bankPassbook"
                        )
                      }
                      className="ml-2 inline-flex items-center justify-center p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500">
                    No file selected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6 px-4 pb-8">
        <Button
          variant="outline"
          className="rounded-md"
          onClick={() => {
            router.push("/staff");
          }}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
