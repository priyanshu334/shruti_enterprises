"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Users,
  Phone as PhoneIcon,
  Building2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

interface Staff {
  id: number;
  name: string;
  phone: string;
  [key: string]: any;
}

interface Company {
  id: number;
  name: string;
  staff?: Staff[];
}

export default function CompaniesWithStaffPage() {
  const supabase = createSupabaseBrowserClient();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("id", { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err: any) {
      toast.error(`Error fetching companies: ${err?.message}`);
    }
  };

  const fetchStaffForCompany = async (companyId: number, index: number) => {
    try {
      const res = await fetch(`/api/staff/byCompany?companyId=${companyId}`);
      const json = await res.json();

      if (!json.success) {
        toast.error(json.message || "Error fetching staff");
        return;
      }

      setCompanies((prev) =>
        prev.map((comp, idx) =>
          idx === index ? { ...comp, staff: json.data } : comp
        )
      );
    } catch (err: any) {
      toast.error(`Error fetching staff: ${err?.message}`);
    }
  };

  const handleToggle = (index: number, companyId: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      if (!companies[index].staff) {
        fetchStaffForCompany(companyId, index);
      }
    }
  };

  const downloadCompanyStaffCSV = (company: Company) => {
    if (!company.staff || company.staff.length === 0) {
      toast.error("No staff data to export");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(company.staff);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${company.name.replace(/\s+/g, "_")}_staff.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Search Bar */}
      <div className="flex gap-2 my-4 mx-8">
        <Input
          placeholder="Search company name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow-sm border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
      </div>

      <main className="px-8 py-6">
        <Card className="shadow-md rounded-xl border border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Companies & Staff
            </h2>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full table-auto text-sm text-gray-700">
                <thead className="bg-gray-100 font-semibold text-gray-700">
                  <tr>
                    <th className="p-3 text-left w-16">#</th>
                    <th className="p-3 text-left">Company Name</th>
                    <th className="p-3 text-center">Staff Count</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company, index) => (
                    <React.Fragment key={company.id}>
                      <tr
                        className={`transition-all cursor-pointer ${
                          expandedIndex === index
                            ? "bg-blue-50"
                            : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        } hover:bg-blue-100`}
                        onClick={() => handleToggle(index, company.id)}
                      >
                        <td className="p-3 font-medium">{index + 1}</td>
                        <td className="p-3 font-medium flex items-center gap-2">
                          {company.name}
                          {expandedIndex === index ? (
                            <ChevronUp className="inline h-4 w-4" />
                          ) : (
                            <ChevronDown className="inline h-4 w-4" />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {company.staff ? company.staff.length : "-"}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-blue-50 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadCompanyStaffCSV(company);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download CSV
                          </Button>
                        </td>
                      </tr>

                      {/* Staff Rows */}
                      {expandedIndex === index && company.staff && (
                        <>
                          <tr className="bg-gray-100 border-t border-gray-300">
                            <th></th>
                            <th className="p-3 pl-10 text-left">Staff Name</th>
                          </tr>
                          {company.staff.map((staff, staffIndex) => (
                            <tr
                              key={staff.id}
                              className={`transition ${
                                staffIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                              } hover:bg-gray-100`}
                            >
                              <td></td>
                              <td className="p-3 pl-10 flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                {staff.name}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
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
