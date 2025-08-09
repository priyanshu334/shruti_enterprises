"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import StaffTable from "@/components/StaffTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  aadhaar?: string;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

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

  async function fetchAllStaff() {
    try {
      const res = await fetch("/api/staff");
      const json = await res.json();
      if (json.success && json.data) {
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
    fetchAllStaff();
  }, []);

  const staffWithNames = staffs.map((staff) => {
    const firm = firms.find((f) => f.id === staff.firm_id);
    const company = companies.find((c) => c.id === staff.company_id);
    return {
      ...staff,
      firm: firm?.name ?? "Unknown Firm",
      company: company?.name ?? "Unknown Company",
    };
  });

  const filteredStaffs = staffWithNames.filter((staff) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      staff.name?.toLowerCase().includes(term) ||
      staff.aadhaar?.toLowerCase().includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage);
  const paginatedStaffs = filteredStaffs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="px-4 sm:px-6 py-6">
        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex w-full sm:max-w-sm gap-2">
            <div className="relative flex-grow">
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

          <Link href="/staff/add" className="w-full sm:w-auto">
            <Button className="bg-[#6587DE] hover:bg-blue-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </Link>
        </div>

        {/* Staff Table */}
        <StaffTable staffList={paginatedStaffs} />

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
