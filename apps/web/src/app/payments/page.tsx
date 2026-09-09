"use client";

import React, { useState } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TableSkeleton } from "@/components/ui/skeleton";
import { usePayments, createPayment, updatePayment, deletePayment } from "@/lib/hooks/usePayments";
import { useStudents } from "@/lib/hooks/useStudents";
import { useCan } from "@/lib/hooks/useSession";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { ApiClientError } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/useUIStore";
import type { PaymentDTO } from "@/lib/api/types";
import type { PaymentMethod } from "@/lib/types/enums";

export default function PaymentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentDTO | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentDTO | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canWrite = useCan("payments", "write");

  const debouncedSearch = useDebouncedValue(searchQuery);
  const { data: payments, meta, isLoading } = usePayments({ search: debouncedSearch, page, pageSize: 10 });
  const { data: students } = useStudents({ pageSize: 100 });

  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    method: "Espèces" as PaymentMethod,
    date: new Date().toISOString().split('T')[0],
    reference: "",
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
    setEditingPayment(null);
    setFormData({
      studentId: students.length > 0 ? students[0].id : "",
      amount: "",
      method: "Espèces",
      date: new Date().toISOString().split('T')[0],
      reference: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: PaymentDTO) => {
    setEditingPayment(p);
    setFormData({
      studentId: p.studentId,
      amount: p.amount.toString(),
      method: p.method,
      date: p.date.split('T')[0],
      reference: p.reference || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, {
          amount: parseInt(formData.amount, 10),
          method: formData.method,
          date: formData.date,
          reference: formData.reference || undefined,
        });
        useUIStore.getState().showToast("Paiement modifié avec succès.", "success");
      } else {
        await createPayment({
          studentId: formData.studentId,
          amount: parseInt(formData.amount, 10),
          method: formData.method,
          date: formData.date,
          reference: formData.reference || undefined,
        });
        useUIStore.getState().showToast("Paiement enregistré avec succès.", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!paymentToDelete) return;
    try {
      await deletePayment(paymentToDelete.id);
      useUIStore.getState().showToast("Paiement supprimé avec succès.", "success");
      setPaymentToDelete(null);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Une erreur est survenue.", "error");
      setPaymentToDelete(null);
    }
  };

  const studentOptions = students.map(s => ({
    label: `${s.firstName} ${s.lastName} (${s.matricule})`,
    value: s.id
  }));

  const methodOptions = [
    { label: "Espèces", value: "Espèces" },
    { label: "Virement", value: "Virement" },
    { label: "Chèque", value: "Chèque" },
    { label: "Mobile Money", value: "Mobile Money" },
    { label: "Virement Bancaire", value: "Bank Transfer" },
  ];

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.pageSize)) : 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les encaissements et reçus.</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Enregistrer un paiement
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un paiement (étudiant)..."
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
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden">
        {!isLoading && payments.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun paiement</h3>
            <p className="text-sm text-muted-foreground">Il n'y a actuellement aucun paiement enregistré.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Étudiant</th>
                  <th className="px-6 py-3 font-medium">Méthode</th>
                  <th className="px-6 py-3 font-medium">Référence</th>
                  <th className="px-6 py-3 font-medium">Enregistré par</th>
                  <th className="px-6 py-3 font-medium text-right">Montant</th>
                  {canWrite && <th className="px-6 py-3 font-medium w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? <TableSkeleton rows={6} columns={canWrite ? 7 : 6} /> : payments.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Inconnu'}
                    </td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">{p.method?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.reference || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">+{formatCurrency(p.amount)}</td>
                    {canWrite && (
                      <td className="px-6 py-4 text-right relative action-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                          }}
                          className="p-2 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openDropdownId === p.id && (
                          <div className="absolute right-6 top-10 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                openEditModal(p);
                                setOpenDropdownId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary w-full text-left"
                            >
                              <Edit className="w-4 h-4" /> Modifier
                            </button>
                            <button
                              onClick={() => {
                                setPaymentToDelete(p);
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
              {meta.total} paiement{meta.total > 1 ? 's' : ''}
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
        title={editingPayment ? "Modifier le paiement" : "Enregistrer un paiement"}
        contentClassName="overflow-visible"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">

          <div className="space-y-2 relative z-50">
            <label className="text-sm font-medium">Étudiant</label>
            <Select
              options={studentOptions}
              value={formData.studentId}
              onChange={(val) => setFormData({ ...formData, studentId: val })}
              placeholder="Sélectionner un étudiant"
              isSearchable={true}
              disabled={!!editingPayment}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Montant (FCFA)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              required
              min="0"
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-40">
            <div className="space-y-2">
              <label className="text-sm font-medium">Méthode</label>
              <Select
                options={methodOptions}
                value={formData.method}
                onChange={(val) => setFormData({ ...formData, method: val as PaymentMethod })}
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Référence (optionnel)</label>
            <input
              type="text"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              placeholder="Ex: Ref chèque ou transaction mobile"
            />
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
              {isSubmitting ? "Enregistrement..." : (editingPayment ? "Enregistrer" : "Valider le paiement")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        title="Supprimer ce paiement ?"
      >
        <div className="space-y-6 py-2">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous êtes sur le point de supprimer un paiement de <span className="font-semibold text-foreground">{formatCurrency(paymentToDelete?.amount || 0)}</span>.
              <br />Cette action est <span className="text-destructive font-medium">définitive</span>.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() => setPaymentToDelete(null)}
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
