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
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";

interface Company {
  id: number;
  name: string;
  firm_id?: number;
}

interface FirmData {
  id: number;
  name: string;
  companies: Company[];
}

export default function DownloadFirmsPage() {
  const supabase = createSupabaseBrowserClient();
  const [firms, setFirms] = useState<FirmData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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

  const filteredFirms = firms.filter((firm) => {
    const search = searchTerm.toLowerCase();
    return (
      firm.name.toLowerCase().includes(search) ||
      firm.companies.some((c) => c.name.toLowerCase().includes(search))
    );
  });

  const handleFirmToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const downloadFirmCSV = (firm: FirmData) => {
    const rows = [
      { Type: "Firm", Name: firm.name },
      ...firm.companies.map((comp) => ({
        Type: "Company",
        Name: comp.name,
      })),
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${firm.name.replace(/\s+/g, "_")}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllFirmsCSV = () => {
    const rows: any[] = [];
    firms.forEach((firm) => {
      rows.push({ Type: "Firm", Name: firm.name });
      firm.companies.forEach((comp) =>
        rows.push({ Type: "Company", Name: comp.name })
      );
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `All_Firms_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between my-4 mx-8 gap-3">
        <div className="flex flex-1 gap-2 min-w-[250px]">
          <Input
            placeholder="Search by Firm or Company Name"
            className="flex-1 border-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button className="bg-[#6587DE] text-white hover:bg-blue-700">
            <Search className="h-4 w-4 mr-1" /> Search
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={downloadAllFirmsCSV}
          >
            <Download className="h-4 w-4 mr-1" /> Download All CSV
          </Button>
        </div>
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
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full table-auto text-sm text-gray-700">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-3 text-left">S.No</th>
                    <th className="p-3 text-left">Firm / Company</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFirms.map((firm, index) => (
                    <React.Fragment key={firm.id}>
                      <tr
                        className="hover:bg-gray-50 transition-all border-b border-gray-300"
                        onClick={() => handleFirmToggle(index)}
                      >
                        <td className="p-3">{index + 1}.</td>
                        <td className="p-3 font-medium cursor-pointer">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs mr-2">
                            Firm
                          </span>
                          {firm.name}
                          <span className="text-xs ml-2">
                            {expandedIndex === index ? (
                              <ChevronUp className="inline h-4 w-4" />
                            ) : (
                              <ChevronDown className="inline h-4 w-4" />
                            )}
                          </span>
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
                            <Download className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                        </td>
                      </tr>

                      {expandedIndex === index &&
                        firm.companies.map((comp, i) => (
                          <tr
                            key={comp.id}
                            className={`${
                              i % 2 === 0 ? "bg-gray-50" : "bg-white"
                            } hover:bg-gray-100`}
                          >
                            <td></td>
                            <td className="p-3 pl-10 text-gray-600">
                              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs mr-2">
                                Company
                              </span>
                              {comp.name}
                            </td>
                            <td></td>
                          </tr>
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
