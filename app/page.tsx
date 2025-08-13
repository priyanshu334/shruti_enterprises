"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import FirmSidebar from "@/components/Sidebar";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AllStaffTable from "@/components/allStaffTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Firm = {
  id: string;
  name: string;
  companies?: string[];
};

type Company = {
  id: string;
  name: string;
  firm_id: string;
};

type Staff = {
  id: string;
  name: string;
  firm_id: string;
  company_id: string;
  phone: string;
  staff_image_url: string;
  aadhar_number?: string;
  is_active?: boolean;
  firm?: string;
  company?: string;
  serialNumber?: number; // Added
};

export default function StaffPage() {
  const supabase = createClientComponentClient();

  const [showSidebar, setShowSidebar] = useState(false);
  const [expandedFirm, setExpandedFirm] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [firms, setFirms] = useState<Firm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchFirmsCompanies() {
      try {
        const { data: firmsData, error: firmsError } = await supabase
          .from("firms")
          .select("*");
        if (firmsError) throw firmsError;

        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*");
        if (companiesError) throw companiesError;

        setFirms(firmsData ?? []);
        setCompanies(companiesData ?? []);
      } catch (err) {
        console.error("Error loading firms and companies:", err);
      }
    }

    fetchFirmsCompanies();
  }, [supabase]);

  useEffect(() => {
    async function fetchStaff() {
      setLoading(true);
      try {
        const res = await fetch("/api/staff");
        if (!res.ok) throw new Error("Failed to fetch staff");

        const json = await res.json();
        if (json.success) {
          setStaffList(json.data);
        } else {
          throw new Error(json.message || "Failed to load staff");
        }
      } catch (err) {
        console.error("Error fetching staff:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, []);

  const staffListWithNames = staffList.map((staff) => {
    const firm = firms.find((f) => f.id === staff.firm_id);
    const company = companies.find((c) => c.id === staff.company_id);

    return {
      ...staff,
      firm: firm ? firm.name : "Unknown Firm",
      company: company ? company.name : "Unknown Company",
    };
  });

  const filteredStaffWithNames = staffListWithNames.filter((staff) => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      (staff.name || "").toLowerCase().includes(term) ||
      (staff.aadhar_number || "").toLowerCase().includes(term);

    const matchesCompany = selectedCompany
      ? staff.company === selectedCompany
      : true;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? staff.is_active === true
        : staff.is_active === false;

    return matchesSearch && matchesCompany && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaffWithNames.length / itemsPerPage);
  const paginatedStaff = filteredStaffWithNames
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    .map((staff, index) => ({
      ...staff,
      serialNumber: (currentPage - 1) * itemsPerPage + index + 1,
    }));

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Menu */}
        <div className="md:hidden flex justify-between items-center px-4 py-3 bg-white border-b shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="text-gray-700 hover:bg-gray-100"
          >
            {showSidebar ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        <FirmSidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          expandedFirm={expandedFirm}
          setExpandedFirm={setExpandedFirm}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          firmData={firms.map((firm) => ({
            ...firm,
            companies: companies
              .filter((c) => c.firm_id === firm.id)
              .map((c) => c.name),
          }))}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  STAFF MANAGEMENT
                </h2>
                <p className="text-gray-600 text-sm">
                  Manage your staff members and their details
                </p>
              </div>

              {/* Search + Filter + Add */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <Input
                  placeholder="Search by name or Aadhaar..."
                  value={searchInput}
                  onChange={handleSearchInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="w-full sm:w-60 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(val) =>
                    setStatusFilter(val as "all" | "active" | "inactive")
                  }
                >
                  <SelectTrigger className="w-full sm:w-40 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Search
                </Button>

                <Link href="/staff/add">
                  <Button className="bg-[#6587DE] text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </Button>
                </Link>
              </div>
            </div>

            {/* Staff Table */}
            {loading ? (
              <div>Loading staff...</div>
            ) : (
              <AllStaffTable staffList={paginatedStaff} />
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center mt-8 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ‹
              </Button>

              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  size="sm"
                  className={`h-10 w-10 p-0 rounded-lg font-semibold ${
                    currentPage === i + 1
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                      : "border-gray-300 text-gray-600 hover:bg-gray-100"
                  }`}
                  variant={currentPage === i + 1 ? undefined : "outline"}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                ›
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
