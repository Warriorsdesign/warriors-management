"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { useSession } from "@/lib/hooks/useSession";
import { useCenters } from "@/lib/hooks/useCenters";
import { useFormations } from "@/lib/hooks/useFormations";
import { useUIStore } from "@/lib/store/useUIStore";

import { formatCurrency } from "@/lib/utils";
import {
  TrendingDown, TrendingUp, ReceiptText, Wallet, GraduationCap, Banknote, Users, Scale,
  Download, Printer, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { KpiCardSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/skeleton";
import type { DashboardStatsDTO } from "@/lib/api/types";

type PeriodType = "this_month" | "last_month" | "quarter" | "year" | "custom";

const PERIOD_TABS: { value: PeriodType; label: string }[] = [
  { value: "this_month", label: "Ce mois" },
  { value: "last_month", label: "Mois précédent" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "custom", label: "Personnalisé" },
];

const AGE_BUCKET_STYLE: Record<string, { bar: string; dot: string; label: string }> = {
  "0-30": { bar: "bg-amber-400", dot: "bg-amber-400", label: "0-30j" },
  "30-60": { bar: "bg-orange-500", dot: "bg-orange-500", label: "30-60j" },
  "60+": { bar: "bg-rose-600", dot: "bg-rose-600", label: "+60j" },
};

function openPrintWindow(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap">
<style>
  body { font-family: 'Outfit', Arial, Helvetica, sans-serif; color: #1e293b; padding: 24px; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  p.subtitle { color: #64748b; font-size: 12px; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
  th { color: #64748b; font-weight: 600; }
  td.amount, th.amount { text-align: right; }
</style>
</head><body>
<h1>${title}</h1>
<p class="subtitle">Warriors Management · ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
${bodyHtml}
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

export default function DashboardPage() {
  const { user } = useSession();
  const selectedCenterIds = useUIStore((state) => state.selectedCenterIds);
  const { centers } = useCenters();
  const { formations } = useFormations();

  const [periodType, setPeriodType] = useState<PeriodType>("this_month");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(undefined);
  const [customTo, setCustomTo] = useState<Date | undefined>(undefined);
  const [selectedFormationIds, setSelectedFormationIds] = useState<string[]>([]);
  const [isTraiterModalOpen, setIsTraiterModalOpen] = useState(false);
  const [showAllFormations, setShowAllFormations] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "entries" | "exits" | "net" | "effectif" | "resteAEncaisser">("effectif");

  const { stats, isLoading } = useDashboardStats({
    centerId: selectedCenterIds,
    formationId: selectedFormationIds,
    period: periodType,
    from: periodType === "custom" ? customFrom?.toISOString() : undefined,
    to: periodType === "custom" ? customTo?.toISOString() : undefined,
  });

  const centerSummary = useMemo(() => {
    if (selectedCenterIds.length === 0) return "Tous les centres";
    if (selectedCenterIds.length === 1) return centers.find((c) => c.id === selectedCenterIds[0])?.name ?? "1 centre";
    return `${selectedCenterIds.length} centres sélectionnés`;
  }, [selectedCenterIds, centers]);

  const formationOptions = formations.map((f) => ({ label: f.name, value: f.id }));

  const handleReset = () => {
    setPeriodType("this_month");
    setCustomFrom(undefined);
    setCustomTo(undefined);
    setSelectedFormationIds([]);
  };

  const formatDateShort = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const handlePrintTraiter = (data: DashboardStatsDTO) => {
    const overdueRows = data.latePayments
      .map((p) => `<tr><td>${p.firstName} ${p.lastName}</td><td>${p.formationName}</td><td>${formatDateShort(p.dueDate)}</td><td class="amount">${formatCurrency(p.amount)}</td></tr>`)
      .join("");
    const upcomingRows = data.upcomingDue
      .map((p) => `<tr><td>${p.firstName} ${p.lastName}</td><td>${p.formationName}</td><td>${formatDateShort(p.dueDate)}</td><td class="amount">${formatCurrency(p.amount)}</td></tr>`)
      .join("");
    openPrintWindow(
      "Relances - Impayés et échéances à venir",
      `<h2>Impayés (${data.latePayments.length})</h2>
       <table><thead><tr><th>Étudiant</th><th>Formation</th><th>Échéance</th><th class="amount">Montant</th></tr></thead>
       <tbody>${overdueRows || '<tr><td colspan="4">Aucun impayé.</td></tr>'}</tbody></table>
       <h2>Échéances des 7 prochains jours (${data.upcomingDue.length})</h2>
       <table><thead><tr><th>Étudiant</th><th>Formation</th><th>Échéance</th><th class="amount">Montant</th></tr></thead>
       <tbody>${upcomingRows || '<tr><td colspan="4">Aucune échéance à venir.</td></tr>'}</tbody></table>`
    );
  };

  const handleExportPdf = (data: DashboardStatsDTO) => {
    const kpiRows = `
      <tr><td>CA encaissé</td><td class="amount">${formatCurrency(data.revenue)}</td></tr>
      <tr><td>Dépenses</td><td class="amount">${formatCurrency(data.expenses)}</td></tr>
      <tr><td>Résultat net</td><td class="amount">${formatCurrency(data.netIncome)}</td></tr>
      <tr><td>Taux de recouvrement</td><td class="amount">${Math.round(data.recoveryRate)}%</td></tr>
      <tr><td>Reste à encaisser</td><td class="amount">${formatCurrency(data.totalToCollect)}</td></tr>
    `;
    const categoryRows = data.expensesByCategory
      .map((c) => `<tr><td>${c.category}</td><td class="amount">${formatCurrency(c.amount)}</td></tr>`)
      .join("");
    const formationRows = data.formationBreakdown
      .map((f) => `<tr><td>${f.name}</td><td class="amount">${f.entries}</td><td class="amount">${f.exits}</td><td class="amount">${f.effectif}</td><td class="amount">${formatCurrency(f.resteAEncaisser)}</td></tr>`)
      .join("");
    openPrintWindow(
      `Bilan - ${data.period.label}`,
      `<h2>Indicateurs clés</h2>
       <table><tbody>${kpiRows}</tbody></table>
       <h2>Dépenses par catégorie</h2>
       <table><thead><tr><th>Catégorie</th><th class="amount">Montant</th></tr></thead><tbody>${categoryRows || '<tr><td colspan="2">Aucune dépense.</td></tr>'}</tbody></table>
       <h2>Par formation</h2>
       <table><thead><tr><th>Formation</th><th class="amount">Entrées</th><th class="amount">Sorties</th><th class="amount">Effectif</th><th class="amount">Reste à encaisser</th></tr></thead><tbody>${formationRows}</tbody></table>`
    );
  };

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 pb-10">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-1 lg:col-span-2 shadow-none border border-border rounded-xl p-6">
            <Skeleton className="h-4 w-56 mb-6" />
            <ChartSkeleton />
          </Card>
          <Card className="col-span-1 shadow-none border border-border rounded-xl p-6 space-y-3">
            <Skeleton className="h-4 w-32 mb-2" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-none border border-border rounded-xl p-6 space-y-3">
              <Skeleton className="h-4 w-40 mb-2" />
              {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-8 w-full" />)}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const maxCategoryAmount = Math.max(1, ...stats.expensesByCategory.map((c) => c.amount));
  const totalOverdue = stats.overdueByAge.reduce((sum, b) => sum + b.amount, 0);

  const sortedFormations = [...stats.formationBreakdown].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    return (b[sortKey] as number) - (a[sortKey] as number);
  });
  const visibleFormations = showAllFormations ? sortedFormations : sortedFormations.filter((f) => f.entries !== 0 || f.exits !== 0);
  const hiddenCount = sortedFormations.length - visibleFormations.length;
  const totals = sortedFormations.reduce(
    (acc, f) => ({
      entries: acc.entries + f.entries,
      exits: acc.exits + f.exits,
      net: acc.net + f.net,
      effectif: acc.effectif + f.effectif,
      resteAEncaisser: acc.resteAEncaisser + f.resteAEncaisser,
    }),
    { entries: 0, exits: 0, net: 0, effectif: 0, resteAEncaisser: 0 }
  );

  const revenuePercentOfExpenses = stats.revenue > 0 ? Math.round((stats.expenses / stats.revenue) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* En-tête + barre de filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {centerSummary}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bonjour{user ? `, ${user.firstName}` : ''}
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPeriodType(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                periodType === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {periodType === "custom" && (
          <div className="flex items-center gap-2">
            <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="Date de début" className="w-40" />
            <DatePicker value={customTo} onChange={setCustomTo} placeholder="Date de fin" className="w-40" minDate={customFrom} />
          </div>
        )}
        <MultiSelect
          label="Toutes les formations"
          options={formationOptions}
          selectedValues={selectedFormationIds}
          onChange={setSelectedFormationIds}
          className="w-56"
        />
        <button
          onClick={handleReset}
          className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md hover:bg-secondary transition-colors whitespace-nowrap"
        >
          Réinitialiser
        </button>
        <button
          onClick={() => handleExportPdf(stats)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Exporter le bilan (PDF)
        </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Étudiants actifs</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {stats.activeStudents} <span className="text-sm text-muted-foreground font-normal">sur {stats.totalStudents} inscrits</span>
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs font-medium">
              <span className="text-emerald-600">+{stats.studentFlow.entries} entrées</span>
              <span className="text-rose-600">-{stats.studentFlow.exits} sortie{stats.studentFlow.exits > 1 ? 's' : ''}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                <Banknote className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">CA encaissé</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats.revenue)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <div className={`flex items-center text-xs font-medium mt-1 ${stats.revenueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {stats.revenueDelta >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {stats.revenueDelta >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(stats.revenueDelta)} vs {stats.period.prevLabel}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Dépenses</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats.expenses)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <div className="text-xs text-muted-foreground mt-1">
              {revenuePercentOfExpenses}% du CA · {stats.expensesDelta >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-FR').format(stats.expensesDelta)} vs {stats.period.prevLabel}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Résultat net</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats.netIncome)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <p className="text-xs text-muted-foreground mt-1">Marge {Math.round(stats.netMarginPercent)}% · CA − dépenses</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Taux de recouvrement</h3>
            </div>
            <p className="text-2xl font-bold text-foreground">{Math.round(stats.recoveryRate)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Reste à encaisser : {formatCurrency(stats.totalToCollect)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Finance chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-none border border-border rounded-xl flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Finances</CardTitle>
            <CardDescription className="text-xs">CA encaissé, dépenses et résultat net</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="h-[280px] w-full">
              {stats.financeSeries.some((p) => p.revenue > 0 || p.expenses > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.financeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(value: any) => `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="revenue" name="CA encaissé" fill="#334155" radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar dataKey="expenses" name="Dépenses" fill="#fda4af" radius={[4, 4, 0, 0]} barSize={18} />
                    <Line type="monotone" dataKey="net" name="Résultat net" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune activité financière sur les 6 derniers mois</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* À traiter */}
        <Card className="col-span-1 shadow-none border border-border rounded-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">À traiter</CardTitle>
            <button onClick={() => setIsTraiterModalOpen(true)} className="text-xs font-medium text-primary hover:underline">Tout voir</button>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-muted-foreground">Impayés par ancienneté</span>
                <span className="font-semibold text-foreground">{formatCurrency(totalOverdue)}</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                {stats.overdueByAge.map((b) => (
                  totalOverdue > 0 && b.amount > 0 ? (
                    <div key={b.bucket} className={AGE_BUCKET_STYLE[b.bucket].bar} style={{ width: `${(b.amount / totalOverdue) * 100}%` }} />
                  ) : null
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {stats.overdueByAge.map((b) => (
                  <div key={b.bucket} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <span className={`w-1.5 h-1.5 rounded-full ${AGE_BUCKET_STYLE[b.bucket].dot}`} />
                    {AGE_BUCKET_STYLE[b.bucket].label} {formatCurrency(b.amount)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Échéances des 7 prochains jours</p>
              <div className="space-y-2">
                {stats.upcomingDue.slice(0, 3).map((d, idx) => (
                  <div key={`${d.studentId}-${idx}`} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center justify-center w-9 h-9 rounded-md bg-secondary text-foreground leading-none flex-shrink-0">
                        <span className="text-[9px] font-medium text-muted-foreground uppercase">{new Date(d.dueDate).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        <span className="text-xs font-bold">{new Date(d.dueDate).getDate()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{d.firstName} {d.lastName}</p>
                        <p className="text-muted-foreground">{d.formationName} · {formatCurrency(d.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.upcomingDue.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Aucune échéance à venir.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Par formation */}
        <Card className="col-span-1 lg:col-span-2 shadow-none border border-border rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Par formation</CardTitle>
              <CardDescription className="text-xs">Mouvements de la période et encaissements</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Trier :</span>
              <Select
                options={[
                  { label: 'Effectif', value: 'effectif' },
                  { label: 'Nom', value: 'name' },
                  { label: 'Net', value: 'net' },
                  { label: 'Reste à encaisser', value: 'resteAEncaisser' },
                ]}
                value={sortKey}
                onChange={(val) => setSortKey(val as typeof sortKey)}
                className="w-40"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs">
                    <th className="pb-2 font-medium">Formation</th>
                    <th className="pb-2 text-right font-medium">Entrées</th>
                    <th className="pb-2 text-right font-medium">Sorties</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                    <th className="pb-2 text-right font-medium">Effectif</th>
                    <th className="pb-2 text-right font-medium">Reste à encaisser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleFormations.map((f) => (
                    <tr key={f.formationId}>
                      <td className="py-2.5 font-medium text-foreground">{f.name}</td>
                      <td className="py-2.5 text-right text-emerald-600">+{f.entries}</td>
                      <td className="py-2.5 text-right text-rose-600">-{f.exits}</td>
                      <td className="py-2.5 text-right font-medium">{f.net > 0 ? '+' : ''}{f.net}</td>
                      <td className="py-2.5 text-right">{f.effectif}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{formatCurrency(f.resteAEncaisser)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold border-t-2 border-border">
                    <td className="py-2.5">Total</td>
                    <td className="py-2.5 text-right text-emerald-600">+{totals.entries}</td>
                    <td className="py-2.5 text-right text-rose-600">-{totals.exits}</td>
                    <td className="py-2.5 text-right">{totals.net > 0 ? '+' : ''}{totals.net}</td>
                    <td className="py-2.5 text-right">{totals.effectif}</td>
                    <td className="py-2.5 text-right">{formatCurrency(totals.resteAEncaisser)}</td>
                  </tr>
                </tbody>
              </table>
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllFormations((v) => !v)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-3"
                >
                  {showAllFormations ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showAllFormations ? "Masquer les formations sans mouvement" : `Afficher les ${hiddenCount} formations sans mouvement`}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dépenses par catégorie */}
        <Card className="col-span-1 shadow-none border border-border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Dépenses par catégorie</CardTitle>
            <CardDescription className="text-xs">{formatCurrency(stats.expenses)} sur la période</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.expensesByCategory.map((c) => (
              <div key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.category}</span>
                  <span className="font-medium text-foreground">{formatCurrency(c.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(c.amount / maxCategoryAmount) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.expensesByCategory.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucune dépense sur la période.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières transactions */}
      <Card className="shadow-none border border-border rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'payment' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'payment' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground">{t.subtitle}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${t.type === 'payment' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'payment' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
            {stats.recentTransactions.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Aucune transaction récente.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal "À traiter" - liste complète */}
      <Modal
        isOpen={isTraiterModalOpen}
        onClose={() => setIsTraiterModalOpen(false)}
        title="Toutes les relances"
        className="sm:max-w-2xl"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Impayés ({stats.latePayments.length})</h3>
            <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {stats.latePayments.map((p, idx) => (
                <div key={`${p.studentId}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.formationName} · échéance {formatDateShort(p.dueDate)}</p>
                  </div>
                  <span className="font-semibold text-destructive">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {stats.latePayments.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground italic">Aucun impayé.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Échéances des 7 prochains jours ({stats.upcomingDue.length})</h3>
            <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {stats.upcomingDue.map((p, idx) => (
                <div key={`${p.studentId}-${idx}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.formationName} · échéance {formatDateShort(p.dueDate)}</p>
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {stats.upcomingDue.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground italic">Aucune échéance à venir.</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              onClick={() => setIsTraiterModalOpen(false)}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => handlePrintTraiter(stats)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
