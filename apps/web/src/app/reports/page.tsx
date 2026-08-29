"use client";

import React, { useState, useEffect } from "react";
import { Users, Trophy, AlertCircle, BookOpen, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Activity, DollarSign, PieChart as PieChartIcon, Target, Scale, Minus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { mockFormations, mockClasses, mockStudents, mockPayments, mockExpenses, Formation, Student, Payment, Expense } from "@/lib/data/mockData";
import { DatePicker } from "@/components/ui/date-picker";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("Vue générale");
  const [formationsData, setFormationsData] = useState<Formation[]>([]);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [paymentsData, setPaymentsData] = useState<Payment[]>([]);
  const [expensesData, setExpensesData] = useState<Expense[]>([]);
  const [classesData, setClassesData] = useState(mockClasses);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const savedFormations = localStorage.getItem("warriors_mock_formations");
    const savedClasses = localStorage.getItem("warriors_mock_classes");
    const savedStudents = localStorage.getItem("warriors_mock_students");
    const savedPayments = localStorage.getItem("warriors_mock_payments");
    const savedExpenses = localStorage.getItem("warriors_mock_expenses");

    setFormationsData(savedFormations ? JSON.parse(savedFormations) : mockFormations);
    setClassesData(savedClasses ? JSON.parse(savedClasses) : mockClasses);
    setStudentsData(savedStudents ? JSON.parse(savedStudents) : mockStudents);
    setPaymentsData(savedPayments ? JSON.parse(savedPayments) : mockPayments);
    setExpensesData(savedExpenses ? JSON.parse(savedExpenses) : mockExpenses);
  }, []);

  // Compute metrics
  const classToFormation = classesData.reduce((acc, cls) => {
    acc[cls.id] = cls.formationId;
    return acc;
  }, {} as Record<string, string>);

  const studentCountByFormation: Record<string, number> = {};
  const dropoutsByFormation: Record<string, { total: number, dropouts: number }> = {};
  const revenueByFormation: Record<string, number> = {};

  formationsData.forEach(f => {
    studentCountByFormation[f.id] = 0;
    dropoutsByFormation[f.id] = { total: 0, dropouts: 0 };
    revenueByFormation[f.id] = 0;
  });

  let totalActiveStudents = 0;
  let newStudentsThisMonth = 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  studentsData.forEach(student => {
    if (student.currentStatus !== 'abandonne' && student.currentStatus !== 'formation_terminee') {
      totalActiveStudents++;
    }
    
    if (student.enrollmentDate) {
      const enrollmentDate = new Date(student.enrollmentDate);
      if (enrollmentDate.getMonth() === currentMonth && enrollmentDate.getFullYear() === currentYear) {
        newStudentsThisMonth++;
      }
    }
    
    const formationId = classToFormation[student.classId];
    if (formationId) {
      studentCountByFormation[formationId] = (studentCountByFormation[formationId] || 0) + 1;
      
      if (!dropoutsByFormation[formationId]) dropoutsByFormation[formationId] = { total: 0, dropouts: 0 };
      dropoutsByFormation[formationId].total += 1;
      if (student.currentStatus === 'abandonne') {
        dropoutsByFormation[formationId].dropouts += 1;
      }
    }
  });

  let totalRevenue = 0;
  paymentsData.forEach(payment => {
    totalRevenue += payment.amount;
    const student = studentsData.find(s => s.id === payment.studentId);
    if (student) {
      const formationId = classToFormation[student.classId];
      if (formationId) {
        revenueByFormation[formationId] = (revenueByFormation[formationId] || 0) + payment.amount;
      }
    }
  });

  let totalExpenses = 0;
  expensesData.forEach(expense => {
    totalExpenses += expense.amount;
  });

  const resteARecouvrer = 1250000; // Constante pour le moment, ou à calculer
  const resultatNet = totalRevenue - totalExpenses;

  // Calculate top KPI values for Formations
  let maxStudentsFormation = { name: "N/A", count: -1 };
  let minStudentsFormation = { name: "N/A", count: Infinity };
  let maxRevenueFormation = { name: "N/A", amount: -1 };
  let maxDropoutFormation = { name: "N/A", rate: -1 };

  formationsData.forEach(f => {
    const count = studentCountByFormation[f.id] || 0;
    if (count > maxStudentsFormation.count) {
      maxStudentsFormation = { name: f.name, count };
    }
    if (count < minStudentsFormation.count) {
      minStudentsFormation = { name: f.name, count };
    }

    const rev = revenueByFormation[f.id] || 0;
    if (rev > maxRevenueFormation.amount) {
      maxRevenueFormation = { name: f.name, amount: rev };
    }

    const drpInfo = dropoutsByFormation[f.id] || { total: 0, dropouts: 0 };
    const rate = drpInfo.total > 0 ? (drpInfo.dropouts / drpInfo.total) : 0;
    if (rate > maxDropoutFormation.rate) {
      maxDropoutFormation = { name: f.name, rate };
    }
  });

  if (minStudentsFormation.count === Infinity) {
    minStudentsFormation.count = 0;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value) + " F CFA";
  };

  // Bar Chart Data
  const barChartData = formationsData.map(f => ({
    name: f.name,
    count: studentCountByFormation[f.id] || 0
  })).sort((a, b) => b.count - a.count);

  const finalBarChartData = barChartData.length > 0 && barChartData.some(d => d.count > 0) ? barChartData : [
    { name: "Anglais Général", count: 120 },
    { name: "Français", count: 85 },
    { name: "Bureautique", count: 45 },
    { name: "Comptabilité", count: 30 },
    { name: "Développement", count: 25 },
  ];

  // Line Chart Data (Last 6 months)
  const lineChartData = [
    { month: "Mars", "Anglais Général": 40, "Bureautique": 10, "Français": 20 },
    { month: "Avril", "Anglais Général": 50, "Bureautique": 15, "Français": 25 },
    { month: "Mai", "Anglais Général": 55, "Bureautique": 12, "Français": 30 },
    { month: "Juin", "Anglais Général": 70, "Bureautique": 20, "Français": 45 },
    { month: "Juillet", "Anglais Général": 90, "Bureautique": 30, "Français": 60 },
    { month: "Août", "Anglais Général": 120, "Bureautique": 45, "Français": 85 },
  ];

  // Financial Chart Data (Revenue vs Expenses)
  const financialChartData = [
    { month: "Mars", Revenus: 2000000, Dépenses: 800000 },
    { month: "Avril", Revenus: 2500000, Dépenses: 900000 },
    { month: "Mai", Revenus: 2200000, Dépenses: 1100000 },
    { month: "Juin", Revenus: 3000000, Dépenses: 1200000 },
    { month: "Juillet", Revenus: 3800000, Dépenses: 1500000 },
    { month: "Août", Revenus: 4500000, Dépenses: 1300000 },
  ];

  const financialPieData = [
    { name: "Encaissé", value: totalRevenue > 0 ? totalRevenue : 18000000 },
    { name: "Dépenses", value: totalExpenses > 0 ? totalExpenses : 4200000 },
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

      {activeTab === "Vue générale" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Étudiants actifs</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {totalActiveStudents > 0 ? totalActiveStudents : 325}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +12% ce mois
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
                  <p className="text-sm font-medium text-muted-foreground">Nouveaux inscrits</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {newStudentsThisMonth}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> Ce mois-ci
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
                  <p className="text-sm font-medium text-muted-foreground">Formations proposées</p>
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {formationsData.length > 0 ? formationsData.length : 5}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center">
                    <Minus className="w-4 h-4 mr-1" /> Stable
                  </p>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {totalRevenue > 0 ? formatCurrency(totalRevenue) : "18 000 000 F CFA"}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +18% ce mois
                  </p>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {totalExpenses > 0 ? formatCurrency(totalExpenses) : "4 200 000 F CFA"}
                  </h3>
                  <p className="text-sm font-medium text-rose-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +5% ce mois
                  </p>
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
                  <p className="text-xs text-muted-foreground">Revenus et dépenses sur les 6 derniers mois</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
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
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="Revenus" stroke={colors.emerald} fillOpacity={1} fill="url(#colorRevenus)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Dépenses" stroke={colors.rose} fillOpacity={1} fill="url(#colorDepenses)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={finalBarChartData.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {finalBarChartData.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value} étudiants`, '']}
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {maxStudentsFormation.count >= 0 ? maxStudentsFormation.name : "Anglais Général"}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {maxStudentsFormation.count >= 0 ? maxStudentsFormation.count : 120} étudiants
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {minStudentsFormation.count >= 0 ? minStudentsFormation.name : "Développement Web"}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {minStudentsFormation.count >= 0 ? minStudentsFormation.count : 25} étudiants
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {maxRevenueFormation.amount >= 0 ? maxRevenueFormation.name : "Anglais Général"}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {maxRevenueFormation.amount > 0 ? formatCurrency(maxRevenueFormation.amount) : "12 500 000 F CFA"}
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {maxDropoutFormation.rate >= 0 ? maxDropoutFormation.name : "Bureautique"}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-1">
                    {maxDropoutFormation.rate > 0 ? Math.round(maxDropoutFormation.rate * 100) : 15}% d'abandons
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
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalBarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
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
                      ticks={[0, 30, 60, 90, 120]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill={colors.primary} radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Évolution des inscriptions</h3>
                  <p className="text-xs text-muted-foreground">Top 3 formations (6 derniers mois)</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      ticks={[0, 30, 60, 90, 120]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Line type="monotone" dataKey="Anglais Général" stroke={colors.primary} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Bureautique" stroke={colors.pink} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Français" stroke={colors.blue} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {totalRevenue > 0 ? formatCurrency(totalRevenue) : "18 000 000 F CFA"}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +15% ce mois
                  </p>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {totalExpenses > 0 ? formatCurrency(totalExpenses) : "4 200 000 F CFA"}
                  </h3>
                  <p className="text-sm font-medium text-rose-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +5% ce mois
                  </p>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {resultatNet !== 0 ? formatCurrency(resultatNet) : "13 800 000 F CFA"}
                  </h3>
                  <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                    <ArrowUpRight className="w-4 h-4 mr-1" /> +8% ce mois
                  </p>
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
                  <h3 className="text-2xl font-bold text-foreground mt-2">
                    {formatCurrency(resteARecouvrer)}
                  </h3>
                  <p className="text-sm font-medium text-amber-600 mt-1 flex items-center">
                    <ArrowDownRight className="w-4 h-4 mr-1" /> -2% ce mois
                  </p>
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
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                    <Bar dataKey="Revenus" fill={colors.emerald} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Dépenses" fill={colors.rose} radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
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
                      formatter={(value: number) => [formatCurrency(value), '']}
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
