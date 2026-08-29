"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, MoreHorizontal, Edit, Trash2, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { mockExpenses, Expense } from "@/lib/data/mockData";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "Loyer" as Expense["category"]
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('warriors_mock_expenses');
      if (stored) {
        setExpenses(JSON.parse(stored));
      } else {
        setExpenses(mockExpenses);
        localStorage.setItem('warriors_mock_expenses', JSON.stringify(mockExpenses));
      }
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
    setEditingExpense(null);
    setFormData({
      title: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category: "Loyer"
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e: Expense) => {
    setEditingExpense(e);
    setFormData({
      title: e.title,
      amount: e.amount.toString(),
      date: e.date,
      category: e.category
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updated;
    if (editingExpense) {
      updated = expenses.map(exp => exp.id === editingExpense.id ? {
        ...exp,
        title: formData.title,
        amount: parseInt(formData.amount),
        date: formData.date,
        category: formData.category
      } : exp);
    } else {
      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        title: formData.title,
        amount: parseInt(formData.amount),
        date: formData.date,
        category: formData.category,
        recordedBy: "Utilisateur Actuel"
      };
      updated = [newExpense, ...expenses];
    }
    setExpenses(updated);
    localStorage.setItem('warriors_mock_expenses', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (expenseToDelete) {
      const updated = expenses.filter(exp => exp.id !== expenseToDelete.id);
      setExpenses(updated);
      localStorage.setItem('warriors_mock_expenses', JSON.stringify(updated));
      setExpenseToDelete(null);
    }
  };

  const categories = ["Toutes", "Loyer", "Salaires", "Équipement", "Électricité", "Internet", "Autre"];

  const filteredExpenses = useMemo(() => {
    let result = expenses;
    if (selectedCategory !== "Toutes") {
      result = result.filter(e => e.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(query));
    }
    return result;
  }, [expenses, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dépenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les sorties d'argent.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Enregistrer une dépense
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une dépense..."
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
        <div className="w-full sm:w-56">
          <Select
            options={categories.map(c => ({ label: c === "Toutes" ? "Toutes les catégories" : c, value: c }))}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-none overflow-hidden mt-4">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune dépense</h3>
            <p className="text-sm text-muted-foreground">Il n'y a aucune dépense correspondant à ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-24 min-h-[250px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Motif</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Catégorie</th>
                  <th className="px-6 py-3 font-medium">Enregistré par</th>
                  <th className="px-6 py-3 font-medium text-right">Montant</th>
                  <th className="px-6 py-3 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{e.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-6 py-4 text-muted-foreground">{e.category}</td>
                    <td className="px-6 py-4 text-muted-foreground">{e.recordedBy || '-'}</td>
                    <td className="px-6 py-4 text-right font-medium text-rose-600">-{formatCurrency(e.amount)}</td>
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
                            <Edit className="w-4 h-4" /> Éditer
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
        title={editingExpense ? "Éditer la dépense" : "Enregistrer une dépense"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Motif</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full p-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
              placeholder="Ex: Achat de matériel"
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
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                options={categories.filter(c => c !== "Toutes").map(c => ({ label: c, value: c }))}
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val as Expense["category"] })}
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
              {editingExpense ? "Enregistrer" : "Valider la dépense"}
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
