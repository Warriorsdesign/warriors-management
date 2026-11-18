"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reference: string;
  organization: {
    id: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
  } | null;
}

interface PaymentsResponse {
  data: PaymentItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: "10",
    search,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/admin/payments?${queryParams.toString()}`
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'PENDING':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Transactions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historique des paiements des abonnements
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-card border-border rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher par référence (Bientôt disponible)..."
            disabled
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50 opacity-50 cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Statut :</span>
          <div className="flex items-center p-1 bg-secondary/60 rounded-lg border border-border text-xs">
            {["all", "COMPLETED", "FAILED", "PENDING"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-md capitalize transition-all ${
                  statusFilter === st
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st === "all" ? "Tous" : st.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="bg-card border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[10px] font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-4">Référence</th>
                <th className="py-3 px-4">Organisation</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-6 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-4 px-6 h-14 bg-muted/20" />
                  </tr>
                ))
              ) : !data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucun paiement trouvé correspondant à vos critères.
                  </td>
                </tr>
              ) : (
                data.data.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-6 font-medium">
                      {format(new Date(payment.date), "dd MMM yyyy HH:mm", { locale: fr })}
                    </td>

                    {/* Référence */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">
                      {payment.reference || '-'}
                    </td>

                    {/* Organisation */}
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {payment.organization.name}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      {payment.plan ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">
                          {payment.plan.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Inconnu</span>
                      )}
                    </td>

                    {/* Montant */}
                    <td className="py-3.5 px-4 text-right font-bold">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          payment.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : payment.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {data.meta.page} sur {data.meta.totalPages} ({data.meta.total} paiements au total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md bg-card border border-border hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
