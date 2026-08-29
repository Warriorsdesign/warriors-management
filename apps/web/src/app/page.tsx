"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChartData, getFlowChartData, mockPaymentSchedules, mockStudents, mockPayments, mockExpenses, mockClasses, mockFormations } from "@/lib/data/mockData";

import { formatCurrency } from "@/lib/utils";
import { TrendingDown, TrendingUp, ReceiptText, Wallet, GraduationCap, Banknote, History, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenueThisMonth: 0,
    expensesThisMonth: 0,
    netIncome: 0,
    activeStudents: 0,
    totalStudents: 0,
    totalToCollect: 0,
    totalLateAmount: 0,
    totalLateInstallments: 0,
    toCollectDistribution: [] as {name: string, value: number}[]
  });

  const [flowStats, setFlowStats] = useState({
    entries: 0,
    exits: 0,
    netBalance: 0,
    byFormation: [] as any[]
  });

  const [latePayments, setLatePayments] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [chartData, setChartData] = useState(getChartData());
  const [flowChartData, setFlowChartData] = useState(getFlowChartData());
  const [localStudents, setLocalStudents] = useState(mockStudents);

  useEffect(() => {
    let lastDataHash = "";

    const fetchDashboardData = () => {
      try {
        const studentsRaw = localStorage.getItem('warriors_mock_students');
        const paymentsRaw = localStorage.getItem('warriors_mock_payments');
        const expensesRaw = localStorage.getItem('warriors_mock_expenses');
        const schedulesRaw = localStorage.getItem('warriors_mock_payment_schedules');
        const formationsRaw = localStorage.getItem('warriors_mock_formations');
        const classesRaw = localStorage.getItem('warriors_mock_classes');

        const currentHash = `${studentsRaw}-${paymentsRaw}-${expensesRaw}-${schedulesRaw}-${formationsRaw}-${classesRaw}`;
        if (currentHash === lastDataHash) return; // Skip update if nothing changed
        lastDataHash = currentHash;

        const students = studentsRaw ? JSON.parse(studentsRaw) : mockStudents;
        const payments = paymentsRaw ? JSON.parse(paymentsRaw) : mockPayments;
        const expenses = expensesRaw ? JSON.parse(expensesRaw) : mockExpenses;
        const schedules = schedulesRaw ? JSON.parse(schedulesRaw) : mockPaymentSchedules;
        const formations = formationsRaw ? JSON.parse(formationsRaw) : mockFormations;
        const classes = classesRaw ? JSON.parse(classesRaw) : mockClasses;

        setLocalStudents(students);

        const currentMonthPrefix = new Date().toISOString().substring(0, 7);

        const currentMonthPayments = payments.filter((p: any) => p.date?.startsWith(currentMonthPrefix));
        const revenueThisMonth = currentMonthPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

        const currentMonthExpenses = expenses.filter((e: any) => e.date?.startsWith(currentMonthPrefix));
        const expensesThisMonth = currentMonthExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

        const activeStudents = students.filter((s: any) => s.currentStatus !== 'abandonne' && s.currentStatus !== 'formation_terminee').length;
        
        let totalToCollect = 0;
        let totalLateAmount = 0;
        let totalLateInstallments = 0;
        const lateInstallmentsList: any[] = [];

        schedules.forEach((schedule: any) => {
          totalToCollect += (schedule.remainingAmount || 0);
          
          // Handle installments if they are JSON
          const installments = schedule.installments ? (typeof schedule.installments === 'string' ? JSON.parse(schedule.installments) : schedule.installments) : null;

          if (installments && Array.isArray(installments)) {
            installments.forEach((inst: any) => {
              if (inst.status === 'en_retard') {
                totalLateAmount += inst.amount;
                totalLateInstallments += 1;
                lateInstallmentsList.push({
                  id: `${schedule.id}_${inst.dueDate}`,
                  studentId: schedule.studentId,
                  dueDate: inst.dueDate,
                  remainingAmount: inst.amount
                });
              }
            });
          } else if (schedule.status === 'en_retard') {
            totalLateAmount += schedule.remainingAmount;
            totalLateInstallments += 1;
            lateInstallmentsList.push({
              id: schedule.id,
              studentId: schedule.studentId,
              dueDate: null,
              remainingAmount: schedule.remainingAmount
            });
          }
        });

        // To Collect by Formation
        const toCollectByFormation: Record<string, number> = {};
        formations.forEach((f: any) => {
          toCollectByFormation[f.id] = 0;
        });

        schedules.forEach((schedule: any) => {
          const remaining = schedule.remainingAmount || 0;
          if (remaining > 0) {
            const student = students.find((s: any) => s.id === schedule.studentId);
            if (student) {
              const cls = classes.find((c: any) => c.id === student.classId);
              if (cls && toCollectByFormation[cls.formationId] !== undefined) {
                toCollectByFormation[cls.formationId] += remaining;
              }
            }
          }
        });

        const toCollectDistribution = formations.map((f: any) => ({
          name: f.name,
          value: toCollectByFormation[f.id] || 0
        })).filter((f: any) => f.value > 0).sort((a: any, b: any) => b.value - a.value);

        setStats({
          revenueThisMonth,
          expensesThisMonth,
          netIncome: revenueThisMonth - expensesThisMonth,
          activeStudents,
          totalStudents: students.length,
          totalToCollect,
          totalLateAmount,
          totalLateInstallments,
          toCollectDistribution
        });

        // Flow Stats
        let entries = 0;
        let exits = 0;
        
        const formationFlow: Record<string, { entries: number, exits: number }> = {};
        formations.forEach((f: any) => {
          formationFlow[f.id] = { entries: 0, exits: 0 };
        });
        
        students.forEach((s: any) => {
          let isEntryThisMonth = false;
          let isExitThisMonth = false;

          if (s.enrollmentDate && s.enrollmentDate.startsWith(currentMonthPrefix)) {
             isEntryThisMonth = true;
          }

          if (s.progressionLogs && Array.isArray(s.progressionLogs)) {
            s.progressionLogs.forEach((log: any) => {
              if (log.date && log.date.startsWith(currentMonthPrefix)) {
                if (log.status === 'nouvel_inscrit' || log.status === 'reinscrit') {
                  isEntryThisMonth = true;
                }
                if (log.status === 'abandonne' || log.status === 'formation_terminee') {
                  isExitThisMonth = true;
                }
              }
            });
          }

          if (isEntryThisMonth) entries += 1;
          if (isExitThisMonth) exits += 1;

          const cls = classes.find((c: any) => c.id === s.classId);
          if (cls && formationFlow[cls.formationId]) {
            if (isEntryThisMonth) formationFlow[cls.formationId].entries += 1;
            if (isExitThisMonth) formationFlow[cls.formationId].exits += 1;
          }
        });

        const byFormation = formations.map((f: any) => ({
          name: f.name,
          ...formationFlow[f.id]
        })).filter((f: any) => f.entries > 0 || f.exits > 0);

        setFlowStats({
          entries,
          exits,
          netBalance: entries - exits,
          byFormation
        });

        setLatePayments(lateInstallmentsList.slice(0, 5));
        setRecentPayments(payments.slice(0, 5));

        const monthlyRevenue: Record<string, number> = {};
        payments.forEach((p: any) => {
          if (p.date) {
            const month = p.date.substring(0, 7);
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount;
          }
        });

        const currentDate = new Date();
        const newChartData = [];
        const newFlowChartData = [];
        
        const monthlyFlows: Record<string, { entrees: number, sorties: number }> = {};
        students.forEach((s: any) => {
          if (s.enrollmentDate) {
            const m = s.enrollmentDate.substring(0, 7);
            if (!monthlyFlows[m]) monthlyFlows[m] = { entrees: 0, sorties: 0 };
            monthlyFlows[m].entrees += 1;
          }
          if (s.progressionLogs && Array.isArray(s.progressionLogs)) {
            s.progressionLogs.forEach((log: any) => {
              if (log.date && (log.status === 'abandonne' || log.status === 'formation_terminee')) {
                const m = log.date.substring(0, 7);
                if (!monthlyFlows[m]) monthlyFlows[m] = { entrees: 0, sorties: 0 };
                monthlyFlows[m].sorties += 1;
              }
            });
          }
        });

        for (let i = 5; i >= 0; i--) {
          const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthStr = d.toISOString().substring(0, 7);
          const monthName = d.toLocaleDateString('fr-FR', { month: 'short' });
          
          newChartData.push({
            name: monthName,
            revenue: monthlyRevenue[monthStr] || 0
          });
          
          newFlowChartData.push({
            name: monthName,
            entrees: monthlyFlows[monthStr]?.entrees || 0,
            sorties: monthlyFlows[monthStr]?.sorties || 0,
          });
        }

        setChartData(newChartData);
        setFlowChartData(newFlowChartData);

      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bonjour, Christian Donald</h1>
        <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : 26 Août 2026 à 09:00</p>
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
              <div className="flex items-center text-xs font-medium text-emerald-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8%
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats.revenueThisMonth)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
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
            <p className="text-2xl font-bold text-foreground">-{new Intl.NumberFormat('fr-FR').format(stats.expensesThisMonth)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
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
            <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat('fr-FR').format(stats.netIncome)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
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
            <p className="text-2xl font-bold text-foreground">{stats.activeStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">Étudiants actifs (sur {stats.totalStudents})</p>
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
                        formatter={(value: any) => [`${new Intl.NumberFormat('fr-FR').format(value as number)} FCFA`, "Chiffre d'affaires"]}
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
                {flowStats.byFormation.map((item, i) => {
                  const net = item.entries - item.exits;
                  const isPositive = net >= 0;
                  return (
                    <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-border last:border-0 last:pb-0">
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
                <p className="text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(stats.totalToCollect)} <span className="text-sm font-medium text-muted-foreground">FCFA</span></p>
              </div>
              <Badge variant="destructive" className="w-full justify-center py-2 text-xs bg-rose-50 text-rose-600 hover:bg-rose-100 border-none">
                Impayés (échéances) : {new Intl.NumberFormat('fr-FR').format(stats.totalLateAmount)} FCFA
              </Badge>
              
              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Répartition par formation</p>
                
                <div className="space-y-3">
                  {stats.toCollectDistribution.map((item, i) => {
                    const widthPercent = stats.totalToCollect > 0 ? (item.value / stats.totalToCollect) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
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
            <CardDescription className="text-xs">{stats.totalLateInstallments} échéance(s) dépassée(s)</CardDescription>
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
                  {latePayments.map((payment, idx) => {
                    const student = localStudents.find(s => s.id === payment.studentId);
                    const fName = student?.firstName || 'Étudiant';
                    const lName = student?.lastName || 'Inconnu';
                    return (
                      <tr key={payment.id || idx} className="hover:bg-secondary/50">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-xs">
                              {fName.charAt(0)}{lName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{fName} {lName}</p>
                              <p className="text-[10px] text-muted-foreground">{student?.matricule || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </td>
                        <td className="py-3 text-right">
                          <p className="font-bold text-destructive">{formatCurrency(payment.remainingAmount)}</p>
                        </td>
                      </tr>
                    );
                  })}
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
              {recentPayments.map((payment, idx) => {
                const student = localStudents.find(s => s.id === payment.studentId);
                const fName = student?.firstName || 'Étudiant';
                const lName = student?.lastName || 'Inconnu';
                return (
                  <div key={payment.id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold text-xs">
                        {fName.charAt(0)}{lName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{fName} {lName}</p>
                        <p className="text-[10px] text-muted-foreground">{payment.date ? new Date(payment.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px] px-2 py-0.5 border-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      +{formatCurrency(payment.amount).replace("000 FCFA", "k FCFA")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
