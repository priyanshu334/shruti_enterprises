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
  const [addCompanyOpenIndex, setAddCompanyOpenIndex] = useState<number | null>(
    null
  );
  const [newCompanyName, setNewCompanyName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFirmIndex, setDeleteFirmIndex] = useState<number | null>(null);
  const [newFirmName, setNewFirmName] = useState("");

  const [editingFirmIndex, setEditingFirmIndex] = useState<number | null>(null);
  const [editingFirmName, setEditingFirmName] = useState("");

  const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
  const [editingCompanyName, setEditingCompanyName] = useState("");

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    try {
      const { data: firmsData, error: fErr } = await supabase
        .from("firms")
        .select("id, name")
        .order("id", { ascending: true });

      if (fErr) {
        toast.error(`Error fetching firms: ${fErr.message}`);
        return;
      }

      const { data: companiesData, error: cErr } = await supabase
        .from("companies")
        .select("id, name, firm_id")
        .order("id", { ascending: true });

      if (cErr) {
        toast.error(`Error fetching companies: ${cErr.message}`);
        return;
      }

      const companiesByFirm = new Map<number, Company[]>();
      (companiesData || []).forEach((c: any) => {
        const fid = c.firm_id as number | undefined;
        if (typeof fid === "number") {
          const arr = companiesByFirm.get(fid) || [];
          arr.push({ id: c.id, name: c.name, firm_id: fid });
          companiesByFirm.set(fid, arr);
        }
      });

      const normalized: FirmData[] =
        (firmsData || []).map((f: any) => ({
          id: f.id,
          name: f.name,
          companies: companiesByFirm.get(f.id) || [],
        })) || [];

      setFirms(normalized);
    } catch (err: any) {
      toast.error(`Unexpected error fetching data: ${err?.message || err}`);
    }
  };

  const filteredFirms = firms.filter((firm) => {
    const search = searchTerm.toLowerCase();
    const firmMatches = firm.name.toLowerCase().includes(search);
    const companyMatches = firm.companies.some((c) =>
      c.name.toLowerCase().includes(search)
    );
    return firmMatches || companyMatches;
  });

  const handleFirmToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
    setAddCompanyOpenIndex(null);
    setEditingFirmIndex(null);
    setEditingCompanyId(null);
  };

  const handleDeleteClick = (index: number) => {
    setDeleteFirmIndex(index);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteFirmIndex === null) return;
    const firm = filteredFirms[deleteFirmIndex]; // from filtered list

    try {
      await supabase.from("companies").delete().eq("firm_id", firm.id);
      await supabase.from("firms").delete().eq("id", firm.id);

      toast.success("Firm deleted successfully");
      setFirms((prev) => prev.filter((f) => f.id !== firm.id));
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || err}`);
    } finally {
      setDeleteDialogOpen(false);
      setDeleteFirmIndex(null);
    }
  };

  const handleAddCompanyClick = (firmIndex: number) => {
    setAddCompanyOpenIndex(firmIndex);
    setNewCompanyName("");
    setEditingCompanyId(null);
    setEditingCompanyName("");
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

    const created = data && data[0];
    if (created) {
      setFirms((prev) => [
        ...prev,
        { id: created.id, name: created.name, companies: [] },
      ]);
      toast.success("Firm created successfully");
      setNewFirmName("");
    }
  };

  const handleAddCompany = async () => {
    if (addCompanyOpenIndex === null) return;
    if (!newCompanyName.trim()) return;

    const firmId = filteredFirms[addCompanyOpenIndex].id;
    const trimmed = newCompanyName.trim();

    const { data, error } = await supabase
      .from("companies")
      .insert([{ name: trimmed, firm_id: firmId }])
      .select("id, name, firm_id");

    if (error) {
      toast.error(`Error adding company: ${error.message}`);
      return;
    }

    const created = data && data[0];
    if (created) {
      setFirms((prev) =>
        prev.map((f) =>
          f.id === firmId ? { ...f, companies: [...f.companies, created] } : f
        )
      );
      toast.success("Company added successfully");
      setNewCompanyName("");
      setAddCompanyOpenIndex(null);
    }
  };

  const startEditFirm = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setEditingFirmIndex(index);
    setEditingFirmName(filteredFirms[index].name);
    setExpandedIndex(index);
  };

  const cancelEditFirm = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingFirmIndex(null);
    setEditingFirmName("");
  };

  const saveEditFirm = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingFirmIndex === null) return;
    const firm = filteredFirms[editingFirmIndex];
    const trimmed = editingFirmName.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("firms")
      .update({ name: trimmed })
      .eq("id", firm.id)
      .select("id, name");

    if (error) {
      toast.error(`Error updating firm: ${error.message}`);
      return;
    }

    if (data && data[0]) {
      setFirms((prev) =>
        prev.map((f) => (f.id === firm.id ? { ...f, name: data[0].name } : f))
      );
      toast.success("Firm updated");
      setEditingFirmIndex(null);
      setEditingFirmName("");
    }
  };

  const startEditCompany = (
    e: React.MouseEvent,
    company: Company,
    firmIndex: number
  ) => {
    e.stopPropagation();
    setEditingCompanyId(company.id);
    setEditingCompanyName(company.name);
    setExpandedIndex(firmIndex);
  };

  const cancelEditCompany = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCompanyId(null);
    setEditingCompanyName("");
  };

  const saveEditCompany = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editingCompanyId === null) return;
    const trimmed = editingCompanyName.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("companies")
      .update({ name: trimmed })
      .eq("id", editingCompanyId)
      .select("id, name, firm_id");

    if (error) {
      toast.error(`Error updating company: ${error.message}`);
      return;
    }

    const updated = data && data[0];
    if (updated) {
      setFirms((prev) =>
        prev.map((f) =>
          f.id === updated.firm_id
            ? {
                ...f,
                companies: f.companies.map((c) =>
                  c.id === updated.id ? { ...c, name: updated.name } : c
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

  const handleDeleteCompany = async (e: React.MouseEvent, compId: number) => {
    e.stopPropagation();
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
                          {editingFirmIndex === index ? (
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
                                onClick={cancelEditFirm}
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
                            onClick={(e) => startEditFirm(e, index)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(index);
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
                                      onClick={cancelEditCompany}
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
                                  onClick={(e) =>
                                    startEditCompany(e, comp, index)
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md"
                                  onClick={(e) =>
                                    handleDeleteCompany(e, comp.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}

                          <tr>
                            <td></td>
                            <td colSpan={2} className="p-0">
                              {addCompanyOpenIndex === index ? (
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
                                    handleAddCompanyClick(index);
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
