"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Search, View } from "lucide-react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import AllStaffTable from "@/components/allStaffTable";

type Firm = {
  id: string;
  name: string;
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
};

export default function StaffPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch firms & companies
  useEffect(() => {
    async function fetchFirmsAndCompanies() {
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
        console.error("Error fetching firms/companies:", err);
      }
    }
    fetchFirmsAndCompanies();
  }, [supabase]);

  // Fetch staff
  async function fetchStaff() {
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setStaffs(json.data);
      } else {
        setStaffs([]);
        console.error(json.message || "Failed to fetch staff");
      }
    } catch (error) {
      setStaffs([]);
      console.error(error);
    }
  }

  useEffect(() => {
    fetchStaff();
  }, []);

  // Merge firm/company names into staff data
  const staffWithNames = staffs.map((staff) => {
    const firm = firms.find((f) => f.id === staff.firm_id);
    const company = companies.find((c) => c.id === staff.company_id);
    return {
      ...staff,
      firm: firm?.name ?? "Unknown Firm",
      company: company?.name ?? "Unknown Company",
    };
  });

  // Search + Status filter
  const filteredStaffs = staffWithNames.filter((staff) => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !term ||
      (staff.name || "").toLowerCase().includes(term) ||
      (staff.aadhar_number || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? staff.is_active === true
        : staff.is_active === false;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage);
  const paginatedStaffs = filteredStaffs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Search handlers
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  useEffect(() => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="px-4 sm:px-6 py-6">
        {/* Search + Filter + Add */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name or Aadhaar"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
            </div>

            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            >
              Search
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-full sm:w-40 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white">
                <SelectValue placeholder="Status" />{" "}
                {/* Changed from "Filter Status" */}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Link href="/staff/add" className="w-full sm:w-auto">
              <Button className="bg-[#6587DE] hover:bg-blue-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Add Staff
              </Button>
            </Link>
            <Link href="/staff/allStaff" className="w-full sm:w-auto">
              <Button className="bg-[#6587DE] hover:bg-blue-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto">
                <View className="h-4 w-4" />
                All Staff Members
              </Button>
            </Link>
          </div>
        </div>

        {/* Staff Table */}
        <AllStaffTable staffList={paginatedStaffs} />

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
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
