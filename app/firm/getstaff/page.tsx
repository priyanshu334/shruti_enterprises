"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Building2,
  Factory,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

interface Staff {
  id: number;
  name: string;
  phone?: string;
  father_name?: string;
  address?: string;
  aadhar_number?: string;
  gender?: string;
  blood_group?: string;
  dob?: string;
  esic_number?: string;
  uan_number?: string;
  doj?: string;
  exit_date?: string;
  account_number?: string;
  ifsc_code?: string;
  is_active?: boolean;
  staffImage?: string;
  aadharCard?: string;
  aadharBackside?: string;
  bankPassbook?: string;
}

interface Company {
  id: number;
  name: string;
  firm_id?: number;
  staff?: Staff[];
}

interface FirmData {
  id: number;
  name: string;
  companies: Company[];
}

export default function FirmsCompaniesStaffPage() {
  const supabase = createSupabaseBrowserClient();
  const [firms, setFirms] = useState<FirmData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFirm, setExpandedFirm] = useState<number | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const { data, error } = await supabase
        .from("firms")
        .select("id, name, companies ( id, name, firm_id )")
        .order("id", { ascending: true });

      if (error) {
        toast.error(`Error fetching firms: ${error.message}`);
        return;
      }

      setFirms(
        (data || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          companies: f.companies || [],
        }))
      );
    } catch (err: any) {
      toast.error(`Unexpected error: ${err?.message || err}`);
    }
  };

  const fetchStaffForCompany = async (
    companyId: number,
    firmIndex: number,
    companyIndex: number
  ) => {
    try {
      const res = await fetch(`/api/staff/byCompany?companyId=${companyId}`);
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Error fetching staff");
        return;
      }

      setFirms((prev) =>
        prev.map((firm, fIdx) =>
          fIdx === firmIndex
            ? {
                ...firm,
                companies: firm.companies.map((comp, cIdx) =>
                  cIdx === companyIndex ? { ...comp, staff: json.data } : comp
                ),
              }
            : firm
        )
      );
    } catch (err: any) {
      toast.error(`Error fetching staff: ${err?.message}`);
    }
  };

  const filteredFirms = firms.filter((firm) => {
    const search = searchTerm.toLowerCase();
    return (
      firm.name.toLowerCase().includes(search) ||
      firm.companies.some((c) => c.name.toLowerCase().includes(search)) ||
      firm.companies.some((c) =>
        c.staff?.some((s) => s.name.toLowerCase().includes(search))
      )
    );
  });

  const handleFirmToggle = (firmIndex: number) => {
    setExpandedFirm((prev) => (prev === firmIndex ? null : firmIndex));
    setExpandedCompany(null);
  };

  const handleCompanyToggle = (
    firmIndex: number,
    companyIndex: number,
    companyId: number
  ) => {
    if (expandedCompany === companyIndex) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyIndex);
      const company = firms[firmIndex].companies[companyIndex];
      if (!company.staff) {
        fetchStaffForCompany(companyId, firmIndex, companyIndex);
      }
    }
  };

  /** ===== Helper for CSV Rows ===== */
  const mapStaffToRow = (firm: FirmData, comp: Company, staff: any) => ({
    Firm: firm.name,
    Company: comp.name,
    "Staff ID": staff.id,
    Name: staff.name,
    "Father Name": staff.father_name || "",
    Address: staff.address || "",
    "Aadhar Number": staff.aadhar_number || "",
    Phone: staff.phone || "",
    Gender: staff.gender || "",
    "Blood Group": staff.blood_group || "",
    DOB: staff.dob || "",
    "ESIC Number": staff.esic_number || "",
    "UAN Number": staff.uan_number || "",
    DOJ: staff.doj || "",
    "Exit Date": staff.exit_date || "",
    "Account Number": staff.account_number || "",
    "IFSC Code": staff.ifsc_code || "",
    "Is Active": staff.is_active ? "Yes" : "No",
    "Staff Image": staff.staffImage || "",
    "Aadhar Card": staff.aadharCard || "",
    "Aadhar Backside": staff.aadharBackside || "",
    "Bank Passbook": staff.bankPassbook || "",
  });

  /** ===== CSV EXPORTS ===== */
  const downloadFirmCSV = (firm: FirmData) => {
    const rows: any[] = [];

    firm.companies.forEach((comp) => {
      if (comp.staff && comp.staff.length > 0) {
        comp.staff.forEach((staff) =>
          rows.push(mapStaffToRow(firm, comp, staff))
        );
      } else {
        rows.push({
          Firm: firm.name,
          Company: comp.name,
          "Staff ID": "-",
          Name: "-",
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${firm.name.replace(/\s+/g, "_")}_data.csv`;
    link.click();
  };

  const downloadCompanyCSV = (company: Company, firm: FirmData) => {
    if (!company.staff || company.staff.length === 0) {
      toast.error("No staff data to export");
      return;
    }

    const rows = company.staff.map((s) => mapStaffToRow(firm, company, s));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${company.name.replace(/\s+/g, "_")}_staff.csv`;
    link.click();
  };

  const downloadAllCSV = () => {
    const rows: any[] = [];

    firms.forEach((firm) => {
      firm.companies.forEach((comp) => {
        if (comp.staff && comp.staff.length > 0) {
          comp.staff.forEach((staff) =>
            rows.push(mapStaffToRow(firm, comp, staff))
          );
        } else {
          rows.push({
            Firm: firm.name,
            Company: comp.name,
            "Staff ID": "-",
            Name: "-",
          });
        }
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `All_Firms_Companies_Staff.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between my-4 mx-8 gap-3">
        <div className="flex flex-1 gap-2 min-w-[250px]">
          <Input
            placeholder="Search by Firm, Company or Staff"
            className="flex-1 border-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button className="bg-[#6587DE] text-white hover:bg-blue-700">
            <Search className="h-4 w-4 mr-1" /> Search
          </Button>
        </div>

        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={downloadAllCSV}
        >
          <Download className="h-4 w-4 mr-1" /> Download All CSV
        </Button>
      </div>

      <main className="px-8 py-6">
        <Card>
          <CardContent className="p-6">
            {/* Summary */}
            <div className="mb-4 flex gap-6">
              <div className="flex items-center gap-2">
                <Building2 className="text-blue-600" />
                <span className="font-semibold text-gray-700">
                  Total Firms: {firms.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Factory className="text-green-600" />
                <span className="font-semibold text-gray-700">
                  Total Companies:{" "}
                  {firms.reduce((acc, f) => acc + f.companies.length, 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-purple-600" />
                <span className="font-semibold text-gray-700">
                  Total Staff:{" "}
                  {firms.reduce(
                    (acc, f) =>
                      acc +
                      f.companies.reduce(
                        (cAcc, comp) => cAcc + (comp.staff?.length || 0),
                        0
                      ),
                    0
                  )}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full table-auto text-sm text-gray-700">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-3 text-left">S.No</th>
                    <th className="p-3 text-left">Firm / Company / Staff</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFirms.map((firm, firmIndex) => (
                    <React.Fragment key={firm.id}>
                      {/* Firm Row */}
                      <tr
                        className="hover:bg-gray-50 border-b"
                        onClick={() => handleFirmToggle(firmIndex)}
                      >
                        <td className="p-3">{firmIndex + 1}.</td>
                        <td className="p-3 font-medium cursor-pointer">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-2">
                            Firm
                          </span>
                          {firm.name}
                          {expandedFirm === firmIndex ? (
                            <ChevronUp className="inline h-4 w-4 ml-2" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4 ml-2" />
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFirmCSV(firm);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" /> CSV
                          </Button>
                        </td>
                      </tr>

                      {/* Company Rows */}
                      {expandedFirm === firmIndex &&
                        firm.companies.map((comp, compIndex) => (
                          <React.Fragment key={comp.id}>
                            <tr
                              className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
                              onClick={() =>
                                handleCompanyToggle(
                                  firmIndex,
                                  compIndex,
                                  comp.id
                                )
                              }
                            >
                              <td></td>
                              <td className="p-3 pl-6 text-gray-700 font-medium">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs mr-2">
                                  Company
                                </span>
                                {comp.name}
                                {expandedCompany === compIndex ? (
                                  <ChevronUp className="inline h-4 w-4 ml-2" />
                                ) : (
                                  <ChevronDown className="inline h-4 w-4 ml-2" />
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadCompanyCSV(comp, firm);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" /> Staff
                                  CSV
                                </Button>
                              </td>
                            </tr>

                            {/* Staff Rows */}
                            {expandedCompany === compIndex &&
                              comp.staff?.map((s) => (
                                <tr
                                  key={s.id}
                                  className="bg-white hover:bg-gray-50"
                                >
                                  <td></td>
                                  <td className="p-3 pl-12 text-gray-600 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    {s.name} ({s.phone || "No Phone"})
                                  </td>
                                  <td></td>
                                </tr>
                              ))}
                          </React.Fragment>
                        ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
