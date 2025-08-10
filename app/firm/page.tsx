"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";
import DeleteFirmDialog from "@/components/FirmDetailsDialog";
import DeleteCompanyDialog from "@/components/DeleteCompanyDialog";

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

export default function FirmsPage() {
  const supabase = createSupabaseBrowserClient();

  const [firms, setFirms] = useState<FirmData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Firm states
  const [firmName, setFirmName] = useState("");
  const [editingFirmId, setEditingFirmId] = useState<number | null>(null);

  // Company states
  const [addCompanyFirmId, setAddCompanyFirmId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);

  // Delete dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFirmId, setDeleteFirmId] = useState<number | null>(null);
  const [deleteCompanyDialogOpen, setDeleteCompanyDialogOpen] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);

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
    setAddCompanyFirmId(null);
    setEditingCompanyId(null);
    setCompanyName("");
  };

  // Add / Update Firm
  const handleFirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim()) return;
    const trimmed = firmName.trim();

    if (editingFirmId) {
      // Update firm
      const { data, error } = await supabase
        .from("firms")
        .update({ name: trimmed })
        .eq("id", editingFirmId)
        .select("id, name");

      if (error) return toast.error(`Error: ${error.message}`);

      setFirms((prev) =>
        prev.map((f) =>
          f.id === editingFirmId ? { ...f, name: data[0].name } : f
        )
      );
      toast.success("Firm updated");
      setEditingFirmId(null);
    } else {
      // Add firm
      const { data, error } = await supabase
        .from("firms")
        .insert([{ name: trimmed }])
        .select("id, name");

      if (error) {
        toast.error(
          error.code === "23505"
            ? "Firm already exists"
            : `Error: ${error.message}`
        );
        return;
      }

      setFirms((prev) => [
        ...prev,
        { id: data[0].id, name: data[0].name, companies: [] },
      ]);
      toast.success("Firm added");
    }
    setFirmName("");
  };

  // Add / Update Company
  const handleCompanySubmit = async () => {
    if (!companyName.trim() || !addCompanyFirmId) return;
    const trimmed = companyName.trim();

    if (editingCompanyId) {
      // Update company
      const { data, error } = await supabase
        .from("companies")
        .update({ name: trimmed })
        .eq("id", editingCompanyId)
        .select("id, name, firm_id");

      if (error) return toast.error(`Error: ${error.message}`);

      setFirms((prev) =>
        prev.map((f) =>
          f.id === data[0].firm_id
            ? {
                ...f,
                companies: f.companies.map((c) =>
                  c.id === data[0].id ? { ...c, name: data[0].name } : c
                ),
              }
            : f
        )
      );
      toast.success("Company updated");
      setEditingCompanyId(null);
    } else {
      // Add company
      const { data, error } = await supabase
        .from("companies")
        .insert([{ name: trimmed, firm_id: addCompanyFirmId }])
        .select("id, name, firm_id");

      if (error) return toast.error(`Error: ${error.message}`);

      setFirms((prev) =>
        prev.map((f) =>
          f.id === addCompanyFirmId
            ? { ...f, companies: [...f.companies, data[0]] }
            : f
        )
      );
      toast.success("Company added");
    }
    setCompanyName("");
    setAddCompanyFirmId(null);
  };

  const handleDeleteClick = (firmId: number) => {
    setDeleteFirmId(firmId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteFirmId === null) return;

    await supabase.from("companies").delete().eq("firm_id", deleteFirmId);
    await supabase.from("firms").delete().eq("id", deleteFirmId);

    setFirms((prev) => prev.filter((f) => f.id !== deleteFirmId));
    toast.success("Firm deleted");
    setDeleteDialogOpen(false);
    setDeleteFirmId(null);
  };

  const handleDeleteCompanyClick = (compId: number) => {
    setDeleteCompanyId(compId);
    setDeleteCompanyDialogOpen(true);
  };

  const confirmDeleteCompany = async () => {
    if (deleteCompanyId === null) return;

    await supabase.from("companies").delete().eq("id", deleteCompanyId);

    setFirms((prev) =>
      prev.map((f) => ({
        ...f,
        companies: f.companies.filter((c) => c.id !== deleteCompanyId),
      }))
    );

    toast.success("Company deleted");
    setDeleteCompanyDialogOpen(false);
    setDeleteCompanyId(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Search */}
      <div className="flex gap-2 my-4 mx-8">
        <Input
          placeholder="Search by Firm or Company Name"
          className="flex-1 border-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className="bg-[#6587DE] text-white hover:bg-blue-700">
          Search
        </Button>
      </div>

      <main className="px-8 py-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Firm Management
            </h2>

            {/* Firm add/update form */}
            <form className="flex gap-2 mb-4" onSubmit={handleFirmSubmit}>
              <Input
                placeholder="Enter Firm Name"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
              />
              <Button
                type="submit"
                className="bg-[#6587DE] text-white hover:bg-blue-700"
              >
                {editingFirmId ? "Update" : "Add"}
              </Button>
              {editingFirmId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingFirmId(null);
                    setFirmName("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </form>

            <Separator className="mb-4" />

            {/* Firm Table */}
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full table-auto text-sm text-gray-700">
                <thead className="bg-gray-100 font-semibold">
                  <tr>
                    <th className="p-3 text-left">S.No</th>
                    <th className="p-3 text-left">Firms</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFirms.map((firm, index) => (
                    <React.Fragment key={firm.id}>
                      <tr
                        className="hover:bg-gray-50 transition-all border-b border-gray-400"
                        onClick={() => handleFirmToggle(index)}
                      >
                        <td className="p-3">{index + 1}.</td>
                        <td className="p-3 font-medium cursor-pointer">
                          {firm.name}{" "}
                          <span className="text-xs ml-2">
                            {expandedIndex === index ? "▲" : "▼"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFirmId(firm.id);
                              setFirmName(firm.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(firm.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>

                      {expandedIndex === index && (
                        <>
                          {(firm.companies || []).map((comp) => (
                            <tr
                              key={comp.id}
                              className="bg-white hover:bg-gray-50 border-b border-gray-400"
                            >
                              <td></td>
                              <td className="p-3 pl-8 text-gray-600">
                                {comp.name}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCompanyId(comp.id);
                                    setAddCompanyFirmId(firm.id);
                                    setCompanyName(comp.name);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCompanyClick(comp.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}

                          {/* Add/Edit Company */}
                          <tr>
                            <td></td>
                            <td colSpan={2} className="p-0">
                              {addCompanyFirmId === firm.id ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-4 mx-4 mt-2">
                                  <Input
                                    placeholder="Enter Company Name"
                                    value={companyName}
                                    onChange={(e) =>
                                      setCompanyName(e.target.value)
                                    }
                                  />
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      className="bg-[#6587DE] text-white hover:bg-blue-700"
                                      onClick={handleCompanySubmit}
                                    >
                                      {editingCompanyId
                                        ? "Update Company"
                                        : "Add Company"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setAddCompanyFirmId(null);
                                        setEditingCompanyId(null);
                                        setCompanyName("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  className="w-full py-2 bg-[#6587DE] text-white flex items-center justify-center gap-2 hover:bg-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddCompanyFirmId(firm.id);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                  Add New Company
                                </button>
                              )}
                            </td>
                          </tr>
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

      <DeleteCompanyDialog
        open={deleteCompanyDialogOpen}
        setOpen={setDeleteCompanyDialogOpen}
        onConfirmDelete={confirmDeleteCompany}
      />
      <DeleteFirmDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
