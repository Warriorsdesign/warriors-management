"use client";

import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { mockPayments, mockStudents, Payment, Student } from "@/lib/data/mockData";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    studentId: "",
    amount: "",
    method: "Espèces" as Payment["method"],
    date: new Date().toISOString().split('T')[0],
    reference: "",
  });

  useEffect(() => {
    try {
      // Load payments
      const storedPayments = localStorage.getItem('warriors_mock_payments');
      const loadedPayments = storedPayments ? JSON.parse(storedPayments) : mockPayments;
      setPayments(loadedPayments);

      // Load students
      const storedStudents = localStorage.getItem('warriors_mock_students');
      const loadedStudents = storedStudents ? JSON.parse(storedStudents) : mockStudents;
      setStudents(loadedStudents);

    } catch (e) {
      console.error("Failed to load local data", e);
    } finally {
      setLoading(false);
    }

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

  const openEditModal = (p: Payment) => {
    setEditingPayment(p);
    setFormData({
      studentId: p.studentId,
      amount: p.amount.toString(),
      method: p.method,
      date: p.date,
      reference: p.reference || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (editingPayment) {
      updated = payments.map(p => p.id === editingPayment.id ? {
        ...p,
        studentId: formData.studentId,
        amount: parseInt(formData.amount),
        method: formData.method,
        date: formData.date,
        reference: formData.reference || undefined
      } : p);
    } else {
      const newPayment: Payment = {
        id: `pay_${Date.now()}`,
        studentId: formData.studentId,
        amount: parseInt(formData.amount),
        method: formData.method,
        date: formData.date,
        reference: formData.reference || undefined,
        recordedBy: "Utilisateur Actuel"
      };
      updated = [newPayment, ...payments];
    }
    setPayments(updated);
    localStorage.setItem('warriors_mock_payments', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (paymentToDelete) {
      const updated = payments.filter(p => p.id !== paymentToDelete.id);
      setPayments(updated);
      localStorage.setItem('warriors_mock_payments', JSON.stringify(updated));
      setPaymentToDelete(null);
    }
  };

  const getStudentName = (id: string) => {
    const s = students.find(s => s.id === id);
    return s ? `${s.firstName} ${s.lastName}` : 'Inconnu';
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

  const filteredPayments = payments.filter(p => {
    const studentName = getStudentName(p.studentId).toLowerCase();
    const ref = (p.reference || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return studentName.includes(query) || ref.includes(query);
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Paiements</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les encaissements et reçus.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un paiement
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-1/2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un paiement (étudiant ou réf)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucun paiement</h3>
            <p className="text-sm text-muted-foreground">Il n'y a actuellement aucun paiement enregistré.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-24 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Étudiant</th>
                  <th className="px-6 py-3 font-medium">Méthode</th>
                  <th className="px-6 py-3 font-medium">Référence</th>
                  <th className="px-6 py-3 font-medium">Enregistré par</th>
                  <th className="px-6 py-3 font-medium text-right">Montant</th>
                  <th className="px-6 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{getStudentName(p.studentId)}</td>
                    <td className="px-6 py-4 capitalize text-muted-foreground">{p.method?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.reference || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{p.recordedBy || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-emerald-600">+{formatCurrency(p.amount)}</td>
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
                            <Edit className="w-4 h-4" /> Éditer
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPayment ? "Éditer le paiement" : "Enregistrer un paiement"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">

          <div className="space-y-2">
            <label className="text-sm font-medium">Étudiant</label>
            <Select
              options={studentOptions}
              value={formData.studentId}
              onChange={(val) => setFormData({ ...formData, studentId: val })}
              placeholder="Sélectionner un étudiant"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Méthode</label>
              <Select
                options={methodOptions}
                value={formData.method}
                onChange={(val) => setFormData({ ...formData, method: val as any })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
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
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {editingPayment ? "Enregistrer" : "Valider le paiement"}
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
