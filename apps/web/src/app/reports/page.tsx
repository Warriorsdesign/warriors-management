"use client";

import React, { useState } from "react";
import { Users, Trophy, AlertCircle, BookOpen, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, DollarSign, PieChart as PieChartIcon, Target, Scale, Minus, ListOrdered } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useReportsSummary, useFormationReports, useFinanceSeries } from "@/lib/hooks/useReports";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { DatePicker } from "@/components/ui/date-picker";
import { KpiCardSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Vue générale");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const range = { from: startDate?.toISOString(), to: endDate?.toISOString() };
  const { summary, isLoading: isLoadingSummary } = useReportsSummary(range);
  const { formationReports, isLoading: isLoadingFormations } = useFormationReports(range);
  const { financeSeries, isLoading: isLoadingFinance } = useFinanceSeries(range);
  const { stats: dashboardStats } = useDashboardStats();
  const isLoading = isLoadingSummary || isLoadingFormations || isLoadingFinance;

  const totalActiveStudents = summary?.totalActiveStudents ?? 0;
  const newStudentsThisMonth = summary?.newStudentsInRange ?? 0;
  const totalRevenue = summary?.totalRevenueInRange ?? 0;
  const totalExpenses = summary?.totalExpensesInRange ?? 0;
  const resultatNet = summary?.netIncomeInRange ?? 0;
  const resteARecouvrer = dashboardStats?.totalToCollect ?? 0;

  let maxStudentsFormation = { name: "N/A", count: -1 };
  let minStudentsFormation = { name: "N/A", count: Infinity };
  let maxRevenueFormation = { name: "N/A", amount: -1 };
  let maxDropoutFormation = { name: "N/A", rate: -1 };

  formationReports.forEach(f => {
    if (f.studentCount > maxStudentsFormation.count) maxStudentsFormation = { name: f.name, count: f.studentCount };
    if (f.studentCount < minStudentsFormation.count) minStudentsFormation = { name: f.name, count: f.studentCount };
    if (f.revenueInRange > maxRevenueFormation.amount) maxRevenueFormation = { name: f.name, amount: f.revenueInRange };
    if (f.dropoutRate > maxDropoutFormation.rate) maxDropoutFormation = { name: f.name, rate: f.dropoutRate };
  });
  if (minStudentsFormation.count === Infinity) minStudentsFormation.count = 0;

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR').format(value) + " F CFA";

  const barChartData = [...formationReports]
    .map(f => ({ name: f.name, count: f.studentCount }))
    .sort((a, b) => b.count - a.count);

  const rankedFormations = [...formationReports].sort((a, b) => b.studentCount - a.studentCount);

  const financialChartData = financeSeries.map(p => ({ month: p.label, Revenus: p.revenue, Dépenses: p.expenses }));

  const financialPieData = [
    { name: "Encaissé", value: totalRevenue },
    { name: "Dépenses", value: totalExpenses },
  ];

  const colors = {
    primary: "#6366f1",
    pink: "#ec4899",
    blue: "#0ea5e9",
    emerald: "#10b981",
    rose: "#f43f5e",
    amber: "#f59e0b"
  };

  const pieColors = [colors.primary, colors.blue, colors.emerald, colors.amber, colors.pink];
  const financePieColors = [colors.emerald, colors.rose];

  return (
    <div className="space-y-6 pb-24 min-h-[250px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rapports & Analyses</h1>
          <p className="text-sm text-muted-foreground mt-1">Analyse des performances académiques et financières</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Date de début"
            className="w-full sm:w-44"
          />
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="Date de fin"
            className="w-full sm:w-44"
            minDate={startDate}
            align="right"
          />
        </div>
      </div>

      <div className="flex gap-6 border-b border-border overflow-x-auto">
        {["Vue générale", "Performances (Formations)", "Finance & Trésorerie"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 shadow-sm">
              <Skeleton className="h-4 w-48 mb-6" />
              <ChartSkeleton />
            </Card>
            <Card className="p-6 shadow-sm">
              <Skeleton className="h-4 w-48 mb-6" />
              <ChartSkeleton />
            </Card>
          </div>
        </div>
      ) : (
        <>
      {activeTab === "Vue générale" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Étudiants actifs</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{totalActiveStudents}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nouveaux inscrits</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{newStudentsThisMonth}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Formations proposées</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formationReports.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenu total</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalRevenue)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépenses totales</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalExpenses)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Vue d'ensemble financière</h3>
                  <p className="text-xs text-muted-foreground">Revenus et dépenses sur la période</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {financialChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.emerald} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors.emerald} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.rose} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors.rose} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => formatCurrency(value)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="Revenus" stroke={colors.emerald} fillOpacity={1} fill="url(#colorRevenus)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Dépenses" stroke={colors.rose} fillOpacity={1} fill="url(#colorDepenses)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée financière disponible</div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Répartition des étudiants</h3>
                  <p className="text-xs text-muted-foreground">Par formation principale</p>
                </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                {barChartData.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={barChartData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {barChartData.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${value} étudiants`, '']}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucun étudiant inscrit</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Performances (Formations)" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plus d'étudiants</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{maxStudentsFormation.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {Math.max(0, maxStudentsFormation.count)} étudiants
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Moins d'inscrits</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{minStudentsFormation.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {minStudentsFormation.count} étudiants
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plus gros encaissement</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{maxRevenueFormation.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {formatCurrency(Math.max(0, maxRevenueFormation.amount))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Turnover le plus élevé</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{maxDropoutFormation.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {Math.round(Math.max(0, maxDropoutFormation.rate) * 100)}% d'abandons
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Étudiants par formation</h3>
                  <p className="text-xs text-muted-foreground">Nombre total d'inscrits par programme</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune formation enregistrée</div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <ListOrdered className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Classement des formations</h3>
                  <p className="text-xs text-muted-foreground">Par effectif, sur la période</p>
                </div>
              </div>
              <div className="h-[300px] w-full overflow-y-auto">
                {rankedFormations.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase">
                      <tr>
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Formation</th>
                        <th className="pb-2 font-medium text-right">Étudiants</th>
                        <th className="pb-2 font-medium text-right">Abandons</th>
                        <th className="pb-2 font-medium text-right">Revenu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rankedFormations.map((f, idx) => (
                        <tr key={f.formationId}>
                          <td className="py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 font-medium text-foreground">{f.name}</td>
                          <td className="py-2 text-right">{f.studentCount}</td>
                          <td className="py-2 text-right text-muted-foreground">{f.dropoutCount}</td>
                          <td className="py-2 text-right text-muted-foreground">{formatCurrency(f.revenueInRange)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune formation enregistrée</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Finance & Trésorerie" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total encaissé</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalRevenue)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(totalExpenses)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bénéfice net</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(resultatNet)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Sur la période</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reste à recouvrer</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">{formatCurrency(resteARecouvrer)}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Toutes inscriptions</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <BarChart className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Bilan financier mensuel</h3>
                  <p className="text-xs text-muted-foreground">Comparatif des encaissements et décaissements</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {financialChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickFormatter={(val) => `${val / 1000000}M`}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                      />
                      <Bar dataKey="Revenus" fill={colors.emerald} radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Dépenses" fill={colors.rose} radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Aucune donnée financière disponible</div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <PieChartIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Répartition du Bilan</h3>
                  <p className="text-xs text-muted-foreground">Proportion des revenus et dépenses</p>
                </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                {(totalRevenue > 0 || totalExpenses > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {financialPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={financePieColors[index % financePieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [formatCurrency(value), '']}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground">Aucune donnée financière disponible</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
