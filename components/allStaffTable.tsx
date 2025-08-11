"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type Staff = {
  id: string;
  name: string;
  firm: string;
  company: string;
  phone: string;
  aadhar_number?: string;
  staff_image_url: string;
  is_active?: boolean; // ✅ added to match backend
};

interface Props {
  staffList: Staff[];
}

export default function AllStaffTable({ staffList }: Props) {
  console.log("Rendering StaffTable with staffList:", staffList);
  return (
    <div className="bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm text-left text-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 uppercase text-xs border border-gray-400">
            <tr>
              <th className="px-6 py-4 font-bold border-r border-gray-200">
                Staff Details
              </th>
              <th className="px-6 py-4 font-bold border-r border-gray-200">
                Firm Name
              </th>
              <th className="px-6 py-4 font-bold border-r border-gray-200">
                Company Name
              </th>
              <th className="px-6 py-4 font-bold border-r border-gray-200">
                Phone Number
              </th>
              <th className="px-6 py-4 font-bold border-r border-gray-200">
                Status
              </th>
              <th className="px-6 py-4 font-bold text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan={6} className="h-7"></td>
            </tr>
          </tbody>

          <tbody className="divide-y divide-gray-400 border border-gray-400">
            {staffList.map((staff, idx) => (
              <tr
                key={staff.id}
                className="hover:bg-blue-50 transition-colors duration-200 group"
              >
                <td className="px-6 py-5 border-r border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600 text-sm">
                        {idx + 1}
                      </span>
                    </div>
                    <img
                      src={staff.staff_image_url || "/default-avatar.png"}
                      alt={staff.name}
                      className="w-32 h-32"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {staff.name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {staff.aadhar_number || "N/A"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-5 border-r border-gray-200">
                  <span className="font-medium text-gray-800">
                    {staff.firm}
                  </span>
                </td>

                <td className="px-6 py-5 border-r border-gray-200">
                  <span className="font-medium text-gray-800">
                    {staff.company}
                  </span>
                </td>

                <td className="px-6 py-5 border-r border-gray-200">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-800">
                      {staff.phone}
                    </div>
                    <div className="text-gray-500 text-xs">Primary</div>
                  </div>
                </td>

                {/* ✅ New Status Column */}
                <td className="px-6 py-5 border-r border-gray-200">
                  {staff.is_active ? (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      🟢 Active
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      🔴 Inactive
                    </span>
                  )}
                </td>

                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2">
                    <Link href={`/staff/edit/${staff.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs px-3 py-2 h-8 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/staff/${staff.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs px-3 py-2 h-8 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-gray-400 p-2 text-gray-700 font-light text-sm bg-gray-200">
        Showing {staffList.length} out of 10
      </div>
    </div>
  );
}
