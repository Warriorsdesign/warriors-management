"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useExpenses, createExpense, updateExpense, deleteExpense } from "@/lib/hooks/useExpenses";
import { useCan, useSession } from "@/lib/hooks/useSession";
import { useCenters } from "@/lib/hooks/useCenters";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { ExpenseDTO } from "@/lib/api/types";
import type { ExpenseCategory } from "@/lib/types/enums";

const CATEGORIES: ExpenseCategory[] = ["Loyer", "Salaires", "Équipement", "Électricité", "Internet", "Autre"];

export default function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseDTO | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseDTO | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");
  const [page, setPage] = useState(1);
  const canWrite = useCan("expenses", "write");

  const { user } = useSession();
  const { centers: allCenters } = useCenters();
  // Un utilisateur rattaché à des centres spécifiques ne peut enregistrer une dépense
  // que pour l'un d'eux ; un ADMIN sans centre assigné voit tous les centres de l'org.
  const userCenters = user?.centers?.length ? user.centers : allCenters.map(c => ({ id: c.id, name: c.name }));

  const selectedCenterIds = useUIStore((state) => state.selectedCenterIds);
  const debouncedSearch = useDebouncedValue(searchQuery);
  const { data: expenses, meta, isLoading } = useExpenses({
    search: debouncedSearch,
    category: selectedCategory !== "Toutes" ? (selectedCategory as ExpenseCategory) : undefined,
    centerId: selectedCenterIds,
    page,
    pageSize: 10,
  });

  React.useEffect(() => {
    setPage(1);
  }, [selectedCenterIds]);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "Loyer" as ExpenseCategory,
    centerId: "",
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as Element).closest('.action-dropdown-container')) return;
      setOpenDropdownId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setEditingExpense(null);
    setErrors({});
    setFormData({
      title: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category: "Loyer",
      centerId: userCenters.length > 0 ? userCenters[0].id : "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e: ExpenseDTO) => {
    setEditingExpense(e);
    setErrors({});
    setFormData({
      title: e.title,
      amount: e.amount.toString(),
      date: e.date.split('T')[0],
      category: e.category,
      centerId: e.centerId,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Veuillez renseigner ce champ.";
    if (!formData.amount || parseInt(formData.amount) <= 0) newErrors.amount = "Veuillez renseigner un montant valide.";
    if (!formData.centerId) newErrors.centerId = "Veuillez sélectionner un centre.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTimeout(() => setErrors({}), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        amount: parseInt(formData.amount, 10),
        date: formData.date,
        category: formData.category,
        centerId: formData.centerId,
      };
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
        useUIStore.getState().showToast("Dépense modifiée avec succès.", "success");
      } else {
        await createExpense(payload);
        useUIStore.getState().showToast("Dépense enregistrée avec succès.", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteExpense(expenseToDelete.id);
      useUIStore.getState().showToast("Dépense supprimée avec succès.", "success");
      setExpenseToDelete(null);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      setExpenseToDelete(null);
    }
  };

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les sorties d'argent.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Enregistrer une dépense
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une dépense..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-10 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 hover:shadow-md hover:border-primary/50 focus:shadow-md"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="w-full sm:w-56">
          <Select
            options={["Toutes", ...CATEGORIES].map(c => ({ label: c === "Toutes" ? "Toutes les catégories" : c, value: c }))}
            value={selectedCategory}
            onChange={(val) => { setSelectedCategory(val); setPage(1); }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden mt-4">
        {!isLoading && expenses.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune dépense</h3>
            <p className="text-sm text-muted-foreground">Il n'y a aucune dépense correspondant à ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Motif</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Catégorie</th>
                  <th className="px-6 py-3 font-medium">Centre</th>
                  <th className="px-6 py-3 font-medium">Enregistré par</th>
                  <th className="px-6 py-3 font-medium text-right">Montant</th>
                  {canWrite && <th className="px-6 py-3 font-medium w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? <TableSkeleton rows={6} columns={canWrite ? 7 : 6} /> : expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{e.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{e.category}</td>
                    <td className="px-6 py-4 text-muted-foreground">{e.center?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {e.recordedBy ? `${e.recordedBy.firstName} ${e.recordedBy.lastName}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-rose-600">-{formatCurrency(e.amount)}</td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right relative action-dropdown-container">
                        <button
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setOpenDropdownId(openDropdownId === e.id ? null : e.id);
                          }}
                          className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openDropdownId === e.id && (
                          <div className="absolute right-6 top-10 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                openEditModal(e);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                            >
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                            <button
                              onClick={() => {
                                setExpenseToDelete(e);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 w-full text-left"
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {meta.total} dépense{meta.total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingExpense ? "Modifier la dépense" : "Enregistrer une dépense"}
        contentClassName="overflow-visible"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Motif</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors({ ...errors, title: "" });
              }}
              className={cn(
                "w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                errors.title
                  ? "border-red-500 focus:ring-red-500/50 animate-shake"
                  : "border-border focus:ring-primary/50"
              )}
              placeholder="Ex: Achat de matériel"
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Montant (FCFA)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={e => {
                setFormData({ ...formData, amount: e.target.value });
                if (errors.amount) setErrors({ ...errors, amount: "" });
              }}
              min="0"
              className={cn(
                "w-full p-2 border rounded-md bg-background focus:outline-none focus:ring-2 transition-all text-sm",
                errors.amount
                  ? "border-red-500 focus:ring-red-500/50 animate-shake"
                  : "border-border focus:ring-primary/50"
              )}
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1 animate-fade-in">{errors.amount}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-40">
            <div className="space-y-2 relative z-50">
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                options={CATEGORIES.map(c => ({ label: c, value: c }))}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val as ExpenseCategory })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <DatePicker
                value={formData.date ? new Date(formData.date) : undefined}
                onChange={(d) => setFormData({ ...formData, date: d ? d.toISOString().split('T')[0] : "" })}
              />
            </div>
          </div>

          <div className="space-y-2 relative z-30">
            <label className="text-sm font-medium">Centre</label>
            <Select
              options={userCenters.map(c => ({ label: c.name, value: c.id }))}
              value={formData.centerId}
              onChange={(val) => {
                setFormData({ ...formData, centerId: val });
                if (errors.centerId) setErrors({ ...errors, centerId: '' });
              }}
              placeholder="Sélectionner un centre"
              disabled={userCenters.length <= 1}
              className={errors.centerId ? "border-red-500 animate-shake" : ""}
            />
            {errors.centerId && <p className="text-xs text-red-500 mt-1">{errors.centerId}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Enregistrement..." : (editingExpense ? "Enregistrer" : "Valider la dépense")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        title="Supprimer cette dépense ?"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer la dépense "<span className="font-semibold text-foreground">{expenseToDelete?.title}</span>".
              <br />Cette action est <span className="text-destructive font-medium">définitive</span>.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setExpenseToDelete(null)}
              className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm transition-colors"
            >
              Oui, supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
