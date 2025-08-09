"use client";

import React from "react";
import { Building2, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Firm = {
  id: string; // Changed to string to match Supabase IDs
  name: string;
  companies: string[];
};

interface Props {
  showSidebar: boolean;
  setShowSidebar: (val: boolean) => void;
  expandedFirm: string | null; // Changed to string | null
  setExpandedFirm: (val: string | null) => void; // Changed to string | null
  selectedCompany: string | null;
  setSelectedCompany: (val: string | null) => void; // Changed to accept null
  firmData: Firm[];
}

export default function FirmSidebar({
  showSidebar,
  setShowSidebar,
  expandedFirm,
  setExpandedFirm,
  selectedCompany,
  setSelectedCompany,
  firmData,
}: Props) {
  return (
    <aside
      className={`w-69 md:h-screen fixed md:static top-0 left-0 z-40 h-full bg-white border-r border-gray-400 shadow-lg md:shadow-none transition-transform duration-300 ease-in-out ${
        showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">FIRMS</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="text-gray-500 hover:bg-white/50 md:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Firms List */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ maxHeight: "calc(100vh - 240px)" }}
        >
          <ul className="space-y-3">
            {firmData.map((firm) => (
              <li key={firm.id}>
                <div
                  className={`flex items-center justify-between cursor-pointer px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 hover:shadow-sm ${
                    expandedFirm === firm.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setExpandedFirm(expandedFirm === firm.id ? null : firm.id)
                  }
                >
                  <span className="font-semibold">{firm.name}</span>
                  {expandedFirm === firm.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>

                {/* Companies */}
                {expandedFirm === firm.id && (
                  <div className="mt-3 ml-2">
                    <ul className="space-y-2 border-l-2 border-blue-100 pl-4">
                      {firm.companies.map((company, idx) => (
                        <li
                          key={idx}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-sm transition-all duration-200 ${
                            selectedCompany === company
                              ? "bg-blue-500 text-white shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                          }`}
                          onClick={() => {
                            setSelectedCompany(
                              selectedCompany === company ? null : company
                            );
                            setShowSidebar(false);
                          }}
                        >
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              selectedCompany === company
                                ? "bg-white"
                                : "bg-blue-400"
                            }`}
                          ></span>
                          <span className="font-medium">{company}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Link href="/firm">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
              <Building2 className="w-4 h-4 mr-2" />
              Manage Firms
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
