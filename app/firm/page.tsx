"use client";

import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import DeleteStaffDialog from "@/components/DeleteStaffDialog";
import { toast } from "react-hot-toast";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

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

  const [addCompanyFirmId, setAddCompanyFirmId] = useState<number | null>(null);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFirmId, setDeleteFirmId] = useState<number | null>(null);

  const [newFirmName, setNewFirmName] = useState("");
  const [editingFirmId, setEditingFirmId] = useState<number | null>(null);
  const [editingFirmName, setEditingFirmName] = useState("");

  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");

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
    setEditingFirmId(null);
    setEditingCompanyId(null);
  };

  const handleDeleteClick = (firmId: number) => {
    setDeleteFirmId(firmId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteFirmId === null) return;

    try {
      await supabase.from("companies").delete().eq("firm_id", deleteFirmId);
      await supabase.from("firms").delete().eq("id", deleteFirmId);

      toast.success("Firm deleted successfully");
      setFirms((prev) => prev.filter((f) => f.id !== deleteFirmId));
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || err}`);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteFirmId(null);
    }
  };

  const handleAddFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;

    const trimmed = newFirmName.trim();
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

    if (data && data[0]) {
      setFirms((prev) => [
        ...prev,
        { id: data[0].id, name: data[0].name, companies: [] },
      ]);
      toast.success("Firm created successfully");
      setNewFirmName("");
    }
  };

  const handleAddCompanyClick = (firmId: number) => {
    setAddCompanyFirmId(firmId);
    setNewCompanyName("");
    setEditingCompanyId(null);
    setEditingCompanyName("");
  };

  const handleAddCompany = async () => {
    if (addCompanyFirmId === null || !newCompanyName.trim()) return;

    const trimmed = newCompanyName.trim();
    const { data, error } = await supabase
      .from("companies")
      .insert([{ name: trimmed, firm_id: addCompanyFirmId }])
      .select("id, name, firm_id");

    if (error) {
      toast.error(`Error adding company: ${error.message}`);
      return;
    }

    if (data && data[0]) {
      setFirms((prev) =>
        prev.map((f) =>
          f.id === addCompanyFirmId
            ? { ...f, companies: [...f.companies, data[0]] }
            : f
        )
      );
      toast.success("Company added successfully");
      setNewCompanyName("");
      setAddCompanyFirmId(null);
    }
  };

  const startEditFirm = (firmId: number, name: string) => {
    setEditingFirmId(firmId);
    setEditingFirmName(name);
  };

  const saveEditFirm = async () => {
    if (editingFirmId === null || !editingFirmName.trim()) return;

    const trimmed = editingFirmName.trim();
    const { data, error } = await supabase
      .from("firms")
      .update({ name: trimmed })
      .eq("id", editingFirmId)
      .select("id, name");

    if (error) {
      toast.error(`Error updating firm: ${error.message}`);
      return;
    }

    if (data && data[0]) {
      setFirms((prev) =>
        prev.map((f) =>
          f.id === editingFirmId ? { ...f, name: data[0].name } : f
        )
      );
      toast.success("Firm updated");
      setEditingFirmId(null);
      setEditingFirmName("");
    }
  };

  const startEditCompany = (company: Company) => {
    setEditingCompanyId(company.id);
    setEditingCompanyName(company.name);
  };

  const saveEditCompany = async () => {
    if (editingCompanyId === null || !editingCompanyName.trim()) return;

    const trimmed = editingCompanyName.trim();
    const { data, error } = await supabase
      .from("companies")
      .update({ name: trimmed })
      .eq("id", editingCompanyId)
      .select("id, name, firm_id");

    if (error) {
      toast.error(`Error updating company: ${error.message}`);
      return;
    }

    if (data && data[0]) {
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
      setEditingCompanyName("");
    }
  };

  const handleDeleteCompany = async (compId: number) => {
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", compId);

    if (error) {
      toast.error(`Error deleting company: ${error.message}`);
      return;
    }

    setFirms((prev) =>
      prev.map((f) => ({
        ...f,
        companies: f.companies.filter((c) => c.id !== compId),
      }))
    );
    toast.success("Company deleted");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="flex gap-2 my-4 mx-8">
        <Input
          placeholder="Search by Firm or Company Name"
          className="flex-1 border-gray-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          className="bg-[#6587DE] text-white hover:bg-blue-700"
          onClick={() => setSearchTerm(searchTerm.trim())}
        >
          Search
        </Button>
      </div>

      <main className="px-8 py-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Firm Management
            </h2>

            <div className="mb-4">
              <form className="flex gap-2" onSubmit={handleAddFirm}>
                <Input
                  placeholder="Enter Firm Name here"
                  className="flex-1 border-gray-300"
                  value={newFirmName}
                  onChange={(e) => setNewFirmName(e.target.value)}
                />
                <Button
                  type="submit"
                  className="bg-[#6587DE] text-white hover:bg-blue-700"
                >
                  ADD
                </Button>
              </form>
            </div>

            <Separator className="mb-4" />

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
                          {editingFirmId === firm.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingFirmName}
                                onChange={(e) =>
                                  setEditingFirmName(e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-64"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={saveEditFirm}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditingFirmId(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {firm.name}{" "}
                              <span className="text-xs ml-2">
                                {expandedIndex === index ? "▲" : "▼"}
                              </span>
                            </>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditFirm(firm.id, firm.name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md"
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
                                {editingCompanyId === comp.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editingCompanyName}
                                      onChange={(e) =>
                                        setEditingCompanyName(e.target.value)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-64"
                                    />
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={saveEditCompany}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingCompanyId(null)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  comp.name
                                )}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditCompany(comp);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCompany(comp.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td></td>
                            <td colSpan={2} className="p-0">
                              {addCompanyFirmId === firm.id ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-4 mx-4 mt-2">
                                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    Add New Company
                                  </h3>
                                  <div className="flex mb-4">
                                    <Input
                                      placeholder="Enter Name of the Company"
                                      value={newCompanyName}
                                      onChange={(e) =>
                                        setNewCompanyName(e.target.value)
                                      }
                                      className="rounded-r-none"
                                    />
                                  </div>
                                  <Button
                                    className="w-full bg-[#6587DE] text-white hover:bg-blue-700"
                                    onClick={handleAddCompany}
                                  >
                                    Save Company
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  className="w-full py-2 bg-[#6587DE] text-white flex items-center justify-center gap-2 hover:bg-blue-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddCompanyClick(firm.id);
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

      <DeleteStaffDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
}
