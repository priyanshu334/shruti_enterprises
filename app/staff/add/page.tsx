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

export default function AddStaffPage() {
  const [dob, setDob] = useState<Date | undefined>();
  const [doj, setDoj] = useState<Date | undefined>();
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

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

  // ✅ Proper Supabase browser client
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

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    if (!form.name.trim()) {
      alert("Please enter the staff name.");
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
        // optionally reset form here if needed
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
                      <div className="w-20 h-20 rounded overflow-hidden border">
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
            // reset (light)
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
            // remove files
            removeFile("staffImage");
            removeFile("aadharCard");
            removeFile("bankPassbook");
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
