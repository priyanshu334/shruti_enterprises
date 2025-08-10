"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
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
import { addStaffAction } from "@/app/actions/staff.acton";
import { createBrowserClient } from "@supabase/ssr";

type Firm = { id: string; name: string };
type Company = { id: string; name: string; firm_id?: string };

// Validation types
interface FormErrors {
  name?: string;
  fatherName?: string;
  address?: string;
  aadhar?: string;
  phone?: string;
  gender?: string;
  bloodGroup?: string;
  esic?: string;
  uan?: string;
  account?: string;
  ifsc?: string;
  firmId?: string;
  companyId?: string;
  staffImage?: string;
  aadharCard?: string;
  bankPassbook?: string;
  dob?: string;
  doj?: string;
}

export default function AddStaffPage() {
  const [dob, setDob] = useState<Date | undefined>();
  const [doj, setDoj] = useState<Date | undefined>();
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const [firms, setFirms] = useState<Firm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rawCompanies, setRawCompanies] = useState<Company[]>([]);

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
    staffImage: {
      url: string;
      name: string;
      type: string;
      size: number;
    } | null;
    aadharCard: {
      url: string;
      name: string;
      type: string;
      size: number;
    } | null;
    bankPassbook: {
      url: string;
      name: string;
      type: string;
      size: number;
    } | null;
  }>({
    staffImage: null,
    aadharCard: null,
    bankPassbook: null,
  });

  const staffInputRef = useRef<HTMLInputElement | null>(null);
  const aadharInputRef = useRef<HTMLInputElement | null>(null);
  const passbookInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: firmData, error: firmErr } = await supabase
        .from("firms")
        .select("id, name");
      if (!firmErr && mounted) setFirms((firmData as Firm[]) || []);

      const { data: compData, error: compErr } = await supabase
        .from("companies")
        .select("id, name, firm_id");
      if (!compErr && mounted) {
        setRawCompanies((compData as Company[]) || []);
        setCompanies((compData as Company[]) || []);
      }
    };
    load();

    return () => {
      mounted = false;
      Object.values(previews).forEach((p) => {
        if (p?.url) URL.revokeObjectURL(p.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.firmId) {
      setCompanies(rawCompanies);
      return;
    }
    const filtered = rawCompanies.filter(
      (c) =>
        (c as any).firm_id === form.firmId ||
        (c as any).firm_id === Number(form.firmId)
    );
    setCompanies(filtered.length ? filtered : rawCompanies);
  }, [form.firmId, rawCompanies]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.fatherName.trim())
      newErrors.fatherName = "Father's name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.gender) newErrors.gender = "Gender is required";
    if (!form.firmId) newErrors.firmId = "Firm is required";
    if (!form.companyId) newErrors.companyId = "Company is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!doj) newErrors.doj = "Date of joining is required";

    // Aadhar validation (12 digits)
    if (form.aadhar && !/^\d{12}$/.test(form.aadhar)) {
      newErrors.aadhar = "Aadhar must be 12 digits";
    }

    // Phone validation (10 digits)
    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    // ESIC validation (17 digits)
    if (form.esic && !/^\d{17}$/.test(form.esic)) {
      newErrors.esic = "ESIC must be 17 digits";
    }

    // UAN validation (12 digits)
    if (form.uan && !/^\d{12}$/.test(form.uan)) {
      newErrors.uan = "UAN must be 12 digits";
    }

    // Account number validation (min 9 digits)
    if (form.account && !/^\d{9,}$/.test(form.account)) {
      newErrors.account = "Account number must be at least 9 digits";
    }

    // IFSC validation (11 characters, format: ABCD0123456)
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc)) {
      newErrors.ifsc = "IFSC must be 11 characters (e.g. ABCD0123456)";
    }

    // File validations
    if (!media.staffImage) newErrors.staffImage = "Staff image is required";
    if (!media.aadharCard) newErrors.aadharCard = "Aadhar card is required";

    // File size validations (max 5MB)
    if (media.staffImage && media.staffImage.size > 5 * 1024 * 1024) {
      newErrors.staffImage = "Image must be less than 5MB";
    }
    if (media.aadharCard && media.aadharCard.size > 5 * 1024 * 1024) {
      newErrors.aadharCard = "Aadhar card must be less than 5MB";
    }
    if (media.bankPassbook && media.bankPassbook.size > 5 * 1024 * 1024) {
      newErrors.bankPassbook = "Passbook must be less than 5MB";
    }

    // File type validations (images or PDF)
    if (media.staffImage && !media.staffImage.type.startsWith("image/")) {
      newErrors.staffImage = "Only images are allowed for staff photo";
    }
    if (
      media.aadharCard &&
      !media.aadharCard.type.match(/(image\/|application\/pdf)/)
    ) {
      newErrors.aadharCard = "Only images or PDFs are allowed";
    }
    if (
      media.bankPassbook &&
      !media.bankPassbook.type.match(/(image\/|application\/pdf)/)
    ) {
      newErrors.bankPassbook = "Only images or PDFs are allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when field is updated
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "staffImage" | "aadharCard" | "bankPassbook"
  ) => {
    const file = e.target.files?.[0] ?? null;
    const prev = previews[field];
    if (prev?.url) URL.revokeObjectURL(prev.url);

    if (file) {
      const url = URL.createObjectURL(file);
      setMedia((m) => ({ ...m, [field]: file }));
      setPreviews((p) => ({
        ...p,
        [field]: { url, name: file.name, type: file.type, size: file.size },
      }));
      // Clear error when file is selected
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } else {
      setMedia((m) => ({ ...m, [field]: null }));
      setPreviews((p) => ({ ...p, [field]: null }));
    }
  };

  const removeFile = (field: "staffImage" | "aadharCard" | "bankPassbook") => {
    const prev = previews[field];
    if (prev?.url) URL.revokeObjectURL(prev.url);

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
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.getElementById(firstError);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          if (element.focus) element.focus();
        }
      }
      return;
    }

    // Build FormData to send files and fields together
    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("fatherName", form.fatherName);
    formData.append("address", form.address);
    formData.append("aadharNumber", form.aadhar);
    formData.append("phoneNumber", form.phone);
    formData.append("gender", form.gender);
    formData.append("bloodGroup", form.bloodGroup);
    formData.append("esicNumber", form.esic);
    formData.append("uanNumber", form.uan);
    formData.append("accountNumber", form.account);
    formData.append("ifscCode", form.ifsc);
    formData.append("firmId", form.firmId);
    formData.append("companyId", form.companyId);
    formData.append("isActive", isActive ? "true" : "false");

    if (dob) formData.append("dob", dob.toISOString());
    if (doj) formData.append("doj", doj.toISOString());
    if (exitDate) formData.append("exitDate", exitDate.toISOString());

    if (media.staffImage) formData.append("staffImage", media.staffImage);
    if (media.aadharCard) formData.append("aadharCard", media.aadharCard);
    if (media.bankPassbook) formData.append("bankPassbook", media.bankPassbook);

    setSaving(true);
    try {
      const res = await fetch("/api/staff/add", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        alert("Staff added successfully!");
        setForm({
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
        setDob(undefined);
        setDoj(undefined);
        setExitDate(undefined);
        setIsActive(true);
        setMedia({
          staffImage: null,
          aadharCard: null,
          bankPassbook: null,
        });
        setPreviews({
          staffImage: null,
          aadharCard: null,
          bankPassbook: null,
        });
        if (staffInputRef.current) staffInputRef.current.value = "";
        if (aadharInputRef.current) aadharInputRef.current.value = "";
        if (passbookInputRef.current) passbookInputRef.current.value = "";
        startTransition(() => {
          window.location.href = "/staff";
        });
      } else {
        alert("Error: " + (json.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to save staff: " + (err?.message ?? "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex items-center justify-between px-6 pt-4">
        <h2 className="text-lg font-semibold">Add New Staff</h2>
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
                Name*
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="fatherName" className="mb-2">
                Father's Name*
              </Label>
              <Input
                id="fatherName"
                name="fatherName"
                value={form.fatherName}
                onChange={(e) => update("fatherName", e.target.value)}
                placeholder="Father's Name"
                className={errors.fatherName ? "border-red-500" : ""}
              />
              {errors.fatherName && (
                <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="address" className="mb-2">
                Address*
              </Label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Address"
                className={`w-full border ${
                  errors.address ? "border-red-500" : "border-gray-300"
                } rounded-md p-2 h-20 text-sm`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
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
                placeholder="Aadhar Number (12 digits)"
                maxLength={12}
                className={errors.aadhar ? "border-red-500" : ""}
              />
              {errors.aadhar && (
                <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>
              )}
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
                placeholder="Phone Number (10 digits)"
                maxLength={10}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Label className="mb-2">Gender*</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => update("gender", v)}
              >
                <SelectTrigger
                  className={errors.gender ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
              )}
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
              <Label className="text-sm mb-2">Date of Birth*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left text-sm ${
                      errors.dob ? "border-red-500" : ""
                    }`}
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
                    fromYear={1980}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {errors.dob && (
                <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
              )}
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
              <Label className="mb-2">Firm Name*</Label>
              <Select
                value={form.firmId}
                onValueChange={(v) => update("firmId", v)}
              >
                <SelectTrigger
                  className={errors.firmId ? "border-red-500" : ""}
                >
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
              {errors.firmId && (
                <p className="text-red-500 text-xs mt-1">{errors.firmId}</p>
              )}
            </div>

            <div>
              <Label className="mb-2">Company Name*</Label>
              <Select
                value={form.companyId}
                onValueChange={(v) => update("companyId", v)}
              >
                <SelectTrigger
                  className={errors.companyId ? "border-red-500" : ""}
                >
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
              {errors.companyId && (
                <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>
              )}
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
                placeholder="ESIC Number (17 digits)"
                maxLength={17}
                className={errors.esic ? "border-red-500" : ""}
              />
              {errors.esic && (
                <p className="text-red-500 text-xs mt-1">{errors.esic}</p>
              )}
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
                placeholder="UAN Number (12 digits)"
                maxLength={12}
                className={errors.uan ? "border-red-500" : ""}
              />
              {errors.uan && (
                <p className="text-red-500 text-xs mt-1">{errors.uan}</p>
              )}
            </div>

            <div>
              <Label className="text-sm mb-2">Date of Joining*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left text-sm ${
                      errors.doj ? "border-red-500" : ""
                    }`}
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
                    fromYear={2000}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              {errors.doj && (
                <p className="text-red-500 text-xs mt-1">{errors.doj}</p>
              )}
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
                    fromYear={2000}
                    toYear={new Date().getFullYear()}
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
                  className={errors.account ? "border-red-500" : ""}
                />
                {errors.account && (
                  <p className="text-red-500 text-xs mt-1">{errors.account}</p>
                )}
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
                  placeholder="IFSC Code (e.g. ABCD0123456)"
                  className={errors.ifsc ? "border-red-500" : ""}
                />
                {errors.ifsc && (
                  <p className="text-red-500 text-xs mt-1">{errors.ifsc}</p>
                )}
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
            { label: "Staff Image*", field: "staffImage", ref: staffInputRef },
            { label: "Aadhar Card*", field: "aadharCard", ref: aadharInputRef },
            {
              label: "Bank Passbook",
              field: "bankPassbook",
              ref: passbookInputRef,
            },
          ].map(({ label, field, ref }) => {
            const pv = previews[field as keyof typeof previews];
            const error = errors[field as keyof typeof errors];
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
                    {error && (
                      <span className="text-xs text-red-500 mt-1">{error}</span>
                    )}
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
                      <div className="w-40 h-40 rounded border flex items-center justify-center text-xs px-2">
                        <div>
                          <div className="font-medium">{pv.name}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="text-sm font-medium">{pv.name}</div>
                      <div className="text-xs text-gray-500">
                        {fmtSize(pv.size)}
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
            // reset form
            setForm({
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
            setDob(undefined);
            setDoj(undefined);
            setExitDate(undefined);
            setIsActive(true);
            setMedia({
              staffImage: null,
              aadharCard: null,
              bankPassbook: null,
            });
            setPreviews({
              staffImage: null,
              aadharCard: null,
              bankPassbook: null,
            });
            setErrors({});
            if (staffInputRef.current) staffInputRef.current.value = "";
            if (aadharInputRef.current) aadharInputRef.current.value = "";
            if (passbookInputRef.current) passbookInputRef.current.value = "";
          }}
        >
          Cancel
        </Button>

        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          disabled={saving || isPending}
        >
          {saving ? "Saving..." : "Save Data"}
        </Button>
      </div>
    </div>
  );
}
