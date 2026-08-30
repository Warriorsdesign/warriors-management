export type Role = "ADMIN" | "GESTIONNAIRE" | "COMPTABLE";
export type UserStatus = "actif" | "inactif";
export type StudentStatus = "en_cours" | "niveau_terminee" | "formation_terminee" | "suspendu" | "nouvel_inscrit" | "reinscrit" | "abandonne";
export type PaymentStatus = "a_jour" | "en_retard" | "solde";
export type IntervalType = "1_semaine" | "2_semaines" | "3_semaines" | "1_mois" | "2_mois" | "3_mois" | "4_mois";

export interface Organization {
  id: string;
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Center {
  id: string;
  name: string;
  address?: string;
  status: "actif" | "inactif";
}

export interface User {
  id: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  centerIds: string[];
  status: UserStatus;
}

export interface Formation {
  id: string;
  name: string;
  duration: number;
  hasLevels: boolean;
  levelCount?: number;
  levels?: { id: string; name: string }[];
  totalCost: number;
  status?: "actif" | "inactif";
}

export interface ClassGroup {
  id: string;
  name: string;
  formationId: string;
  centerId: string;
  status: "ouverte" | "complete" | "cloturee";
  capacity: number;
  startDate?: string;
  endDate?: string;
}

export interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  contact: string;
  email?: string;
  gender: "Male" | "Female";
  currentStatus: StudentStatus;
  currentLevel?: string;
  classId: string;
  enrollmentDate: string;
  progressionLogs?: {
    id: string;
    date: string;
    status: StudentStatus | "nouvel_inscrit";
    level?: string;
    recordedBy: string;
    reason?: string;
  }[];
}

export interface PaymentSchedule {
  id: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  installments?: {
    amount: number;
    dueDate: string;
    status: PaymentStatus;
  }[];
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: "Espèces" | "Bank Transfer" | "Mobile Money" | "Virement" | "Chèque";
  recordedBy: string;
  motif?: string;
  reference?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: "Loyer" | "Salaires" | "Équipement" | "Électricité" | "Internet" | "Autre";
  amount: number;
  date: string;
  description?: string;
  recordedBy: string;
}


export const mockCenters: Center[] = [];

export const mockUsers: User[] = [];

export const mockFormations: Formation[] = [];

export const mockClasses: ClassGroup[] = [];

export const mockStudents: Student[] = [];

export const mockPaymentSchedules: PaymentSchedule[] = [];

export const mockPayments: Payment[] = [];

export const mockExpenses: Expense[] = [];

export const getDashboardStats = () => {
  // Use a fixed date (2026-08) for stats since mock data is based around Aug 2026
  const currentMonthStr = "2026-08";
  
  const revenueThisMonth = mockPayments
    .filter(p => p.date.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const expensesThisMonth = mockExpenses
    .filter(e => e.date.startsWith(currentMonthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const activeStudents = mockStudents.filter(s => !['formation_terminee', 'abandonne'].includes(s.currentStatus)).length;
  const totalStudents = mockStudents.length;

  const totalToCollect = mockPaymentSchedules.reduce((sum, ps) => sum + ps.remainingAmount, 0);
  
  const lateSchedules = mockPaymentSchedules.filter(ps => ps.status === 'en_retard');
  const totalLateAmount = lateSchedules.reduce((sum, ps) => sum + ps.remainingAmount, 0);
  const totalLateInstallments = lateSchedules.reduce((count, ps) => {
     if (!ps.installments) return count + 1;
     return count + ps.installments.filter(i => i.status === 'en_retard').length;
  }, 0);

  return {
    revenueThisMonth,
    expensesThisMonth,
    netIncome: revenueThisMonth - expensesThisMonth,
    activeStudents,
    totalStudents,
    totalToCollect,
    totalLateAmount,
    totalLateInstallments
  };
};

export const getChartData = () => {
  // Group payments by month dynamically
  const monthlyRevenue: Record<string, number> = {};
  mockPayments.forEach(p => {
    const month = p.date.substring(0, 7); // YYYY-MM
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + p.amount;
  });

  return [
    { name: "janv", revenue: 450000 },
    { name: "févr", revenue: 520000 },
    { name: "mars", revenue: 480000 },
    { name: "avr", revenue: 610000 },
    { name: "mai", revenue: 590000 },
    { name: "juin", revenue: 750000 },
    { name: "juil", revenue: (monthlyRevenue["2026-07"] || 0) + 753000 }, // Base + computed
    { name: "août", revenue: monthlyRevenue["2026-08"] || 0 },
  ];
};

export const getFlowChartData = () => {
  return [
    { name: "janv", entrees: 15, sorties: 2 },
    { name: "févr", entrees: 18, sorties: 3 },
    { name: "mars", entrees: 12, sorties: 5 },
    { name: "avr", entrees: 25, sorties: 1 },
    { name: "mai", entrees: 20, sorties: 4 },
    { name: "juin", entrees: 30, sorties: 2 },
    { name: "juil", entrees: 35, sorties: 8 },
    { name: "août", entrees: 9, sorties: 1 },
  ];
};

export const getStudentFlowStats = () => {
  const activeStatuses = ['nouvel_inscrit', 'reinscrit', 'en_cours'];
  const inactiveStatuses = ['formation_terminee', 'abandonne'];
  
  const entries = mockStudents.filter(s => s.currentStatus === 'nouvel_inscrit' || s.currentStatus === 'reinscrit' || s.enrollmentDate.startsWith("2026-08")).length;
  
  const exits = mockStudents.filter(s => inactiveStatuses.includes(s.currentStatus)).length;

  const byFormation = mockFormations.map(f => {
    const classIds = mockClasses.filter(c => c.formationId === f.id).map(c => c.id);
    const studentsInFormation = mockStudents.filter(s => classIds.includes(s.classId));
    
    return {
      name: f.name,
      entries: studentsInFormation.filter(s => activeStatuses.includes(s.currentStatus)).length,
      exits: studentsInFormation.filter(s => inactiveStatuses.includes(s.currentStatus)).length,
    };
  });

  return {
    entries,
    exits,
    netBalance: entries - exits,
    byFormation
  };
};

// Utilities for computed statuses
export const getActiveStudentsForClass = (classId: string): number => {
  return mockStudents.filter(s => s.classId === classId && !['formation_terminee', 'abandonne'].includes(s.currentStatus)).length;
};

export const getComputedClassStatus = (classGroup: ClassGroup, enrolledCount?: number): "ouverte" | "complete" | "cloturee" => {
  if (classGroup.status === "cloturee") return "cloturee"; // Manually closed
  const enrolled = enrolledCount !== undefined ? enrolledCount : getActiveStudentsForClass(classGroup.id);
  if (enrolled >= classGroup.capacity) return "complete";
  return "ouverte";
};

export const mockOrganization: Organization = {
  id: "org_1",
  name: "Warriors Management",
  email: "contact@warriors-management.com",
  phone: "+225 00 00 00 00",
  address: "Abidjan, Côte d'Ivoire",
};
