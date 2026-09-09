"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { useSession } from "@/lib/hooks/useSession";

import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, ReceiptText, Wallet, GraduationCap, Banknote, History, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { KpiCardSkeleton, ChartSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useSession();
  const { stats, isLoading } = useDashboardStats();

  const flowStats = stats?.studentFlow ?? { entries: 0, exits: 0, netBalance: 0, byFormation: [] };
  const toCollectDistribution = (stats?.toCollectByFormation ?? []).filter(f => f.value > 0);
  const chartData = (stats?.revenueSeries ?? []).map(p => ({ name: p.label, revenue: p.revenue }));
  const flowChartData = (stats?.flowSeries ?? []).map(p => ({ name: p.label, entrees: p.entrees, sorties: p.sorties }));
  const latePayments = stats?.latePayments ?? [];
  const recentPayments = stats?.recentPayments ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <Skeleton className="h-8 w-56" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">
            <Card className="shadow-none border border-border rounded-xl p-6">
              <Skeleton className="h-4 w-56 mb-6" />
              <ChartSkeleton />
            </Card>
            <Card className="shadow-none border border-border rounded-xl p-6">
              <Skeleton className="h-4 w-56 mb-6" />
              <ChartSkeleton />
            </Card>
          </div>
          <div className="col-span-1 flex flex-col gap-4">
            <Card className="shadow-none border border-border rounded-xl p-6 space-y-3">
              <Skeleton className="h-4 w-40 mb-2" />
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
            </Card>
            <Card className="shadow-none border border-border rounded-xl p-6 flex-1 space-y-3">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-32" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="col-span-1 lg:col-span-2 shadow-none border border-border rounded-xl p-6 space-y-3">
            <Skeleton className="h-4 w-40 mb-2" />
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </Card>
          <Card className="col-span-1 shadow-none border border-border rounded-xl p-6 space-y-3">
            <Skeleton className="h-4 w-32 mb-2" />
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bonjour{user ? `, ${user.firstName}` : ''}
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* New KPI: Entrées / Sorties (Solde Net) */}
        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Flux étudiants</h3>
              </div>
              <div className={`flex items-center text-xs font-medium ${flowStats.netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {flowStats.netBalance >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {flowStats.netBalance >= 0 ? '+' : ''}{flowStats.netBalance}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {flowStats.entries} <span className="text-sm text-muted-foreground font-normal">entrées</span> / {flowStats.exits} <span className="text-sm text-muted-foreground font-normal">sorties</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Solde net du mois</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                  <Banknote className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Chiffre d'affaires</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats?.revenueThisMonth ?? 0)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <p className="text-xs text-muted-foreground mt-1">CA encaissé ce mois</p>
          </CardContent>
        </Card>

        {/* New KPI: Dépenses */}
        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                  <ReceiptText className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Dépenses</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">-{new Intl.NumberFormat('fr-FR').format(stats?.expensesThisMonth ?? 0)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <p className="text-xs font-medium text-rose-500 mt-1">Dépenses du mois</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Résultat net</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats?.netIncome ?? 0)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
            <p className="text-xs text-muted-foreground mt-1">Résultat net du mois (CA - Dépenses)</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border rounded-xl transition-all duration-300 hover:shadow-md hover:-translate-y-1 bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center text-muted-foreground">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Effectif</h3>
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.activeStudents ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Étudiants actifs (sur {stats?.totalStudents ?? 0})</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Charts Container - spans 2 cols, but divided into 2 rows inside */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-4">

          {/* Revenue Chart */}
          <Card className="shadow-none border border-border rounded-xl flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Évolution du chiffre d'affaires</CardTitle>
              </div>
              <div className="flex items-center bg-secondary rounded-lg p-0.5">
                <button className="px-3 py-1 text-xs font-medium bg-background text-foreground rounded-md shadow-sm">Mensuel</button>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[200px] w-full mt-4 flex items-center justify-center">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        dy={10}
                        padding={{ left: 20, right: 20 }}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${new Intl.NumberFormat('fr-FR').format(value)} FCFA`, "Chiffre d'affaires"]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#334155" strokeWidth={2} dot={{r: 3, fill: '#334155'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <TrendingUp className="w-8 h-8 opacity-20" />
                    <p>Aucune donnée financière disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entries / Exits Chart */}
          <Card className="shadow-none border border-border rounded-xl flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-semibold">Évolution des effectifs (Entrées / Sorties)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[200px] w-full mt-4 flex items-center justify-center">
                {flowChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={flowChartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        dy={10}
                        padding={{ left: 20, right: 20 }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{fontSize: '11px', color: '#64748B'}} />
                      <Line type="monotone" dataKey="entrees" name="Entrées" stroke="#334155" strokeWidth={2} dot={{r: 3, fill: '#334155'}} activeDot={{r: 5}} />
                      <Line type="monotone" dataKey="sorties" name="Sorties" stroke="#f43f5e" strokeWidth={2} dot={{r: 3, fill: '#f43f5e'}} activeDot={{r: 5}} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <TrendingUp className="w-8 h-8 opacity-20" />
                    <p>Aucun mouvement d'effectif enregistré</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar on Dashboard */}
        <div className="col-span-1 flex flex-col gap-4">

          {/* Flux (Entrées / Sorties) par formation */}
          <Card className="shadow-none border border-border rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Entrées / Sorties par formation</CardTitle>
              <CardDescription className="text-xs">Mois en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {flowStats.byFormation.map((item) => {
                  const net = item.entries - item.exits;
                  const isPositive = net >= 0;
                  return (
                    <div key={item.formationId} className="flex items-center justify-between text-xs pb-2 border-b border-border last:border-0 last:pb-0">
                      <span className="w-32 truncate text-muted-foreground">{item.name}</span>
                      <div className="flex gap-4 items-center">
                        <span className="text-muted-foreground"><span className="text-foreground font-medium">+{item.entries}</span> / <span className="text-foreground font-medium">-{item.exits}</span></span>
                        <span className={`font-semibold w-6 text-right ${isPositive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {isPositive ? '+' : ''}{net}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reste à encaisser */}
          <Card className="shadow-none border border-border rounded-xl flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Reste à encaisser</CardTitle>
              <CardDescription className="text-xs">Sur les inscriptions en cours</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col gap-4">
              <div>
                <p className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(stats?.totalToCollect ?? 0)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
              </div>
              <Badge variant="destructive" className="w-full justify-center py-2 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border-none">
                Impayés (échéances) : {new Intl.NumberFormat('fr-FR').format(stats?.totalLateAmount ?? 0)} FCFA
              </Badge>

              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Répartition par formation</p>

                <div className="space-y-3">
                  {toCollectDistribution.map((item) => {
                    const total = stats?.totalToCollect ?? 0;
                    const widthPercent = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={item.formationId} className="flex items-center justify-between text-xs">
                        <span className="w-28 truncate text-muted-foreground" title={item.name}>{item.name}</span>
                        <div className="flex-1 mx-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(5, widthPercent)}%` }}></div>
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">{new Intl.NumberFormat('fr-FR').format(item.value)} FCFA</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Late Payments Table */}
        <Card className="col-span-1 lg:col-span-2 shadow-none border border-border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Paiements en retard</CardTitle>
            <CardDescription className="text-xs">{stats?.totalLateInstallments ?? 0} échéance(s) dépassée(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Étudiant</th>
                    <th className="pb-2 text-left font-medium">Échéance</th>
                    <th className="pb-2 text-right font-medium">Montant dû</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {latePayments.map((payment, idx) => (
                    <tr key={`${payment.studentId}-${idx}`} className="hover:bg-secondary/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-xs">
                            {payment.firstName.charAt(0)}{payment.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{payment.firstName} {payment.lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{payment.matricule || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 text-right">
                        <p className="font-bold text-destructive">{formatCurrency(payment.amount)}</p>
                      </td>
                    </tr>
                  ))}
                  {latePayments.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-muted-foreground italic">Aucun retard.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-1 shadow-none border border-border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Activité récente</CardTitle>
            <CardDescription className="text-xs">Derniers paiements enregistrés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {recentPayments.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Aucun paiement récent.</p>
              )}
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-xs">
                      {payment.firstName.charAt(0)}{payment.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{payment.firstName} {payment.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(payment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] px-2 py-0.5 border-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                    +{formatCurrency(payment.amount).replace("000 FCFA", "k FCFA")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
