import type {
  Role, UserStatus, Gender, StudentStatus, InstallmentStatus,
  IntervalType, PaymentMethod, ExpenseCategory, ClassStatus,
} from '@/lib/types/enums';

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number };
}

// --- Session (GET /api/auth/me) ---
export interface SessionUser {
  id: string;
  matricule: string | null;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  avatarUrl: string | null;
}
export interface SessionOrganization {
  id: string;
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

// --- Organization ---
export interface OrganizationDTO extends SessionOrganization {
  createdAt: string;
  updatedAt: string;
}
export interface UpdateOrganizationInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

// --- Center ---
export interface CenterDTO {
  id: string;
  name: string;
  address: string | null;
  status: 'actif' | 'inactif';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateCenterInput {
  name: string;
  address?: string;
  status?: 'actif' | 'inactif';
}
export type UpdateCenterInput = Partial<CreateCenterInput>;

// --- Formation ---
export interface FormationLevel {
  id: string;
  name: string;
}
export interface FormationDTO {
  id: string;
  name: string;
  duration: number;
  hasLevels: boolean;
  levelCount: number | null;
  levels: FormationLevel[];
  totalCost: number;
  status: 'actif' | 'inactif';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateFormationInput {
  name: string;
  duration: number;
  totalCost: number;
  hasLevels: boolean;
  levelCount?: number;
  status?: 'actif' | 'inactif';
}
export type UpdateFormationInput = Partial<CreateFormationInput>;

// --- ClassGroup ---
export interface ClassDTO {
  id: string;
  name: string;
  formationId: string;
  centerId: string;
  capacity: number;
  status: ClassStatus;
  enrolledCount: number;
  startDate: string | null;
  endDate: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}
export interface CreateClassInput {
  name: string;
  formationId: string;
  centerId: string;
  capacity: number;
  startDate?: string;
  endDate?: string;
}
export interface UpdateClassInput {
  name?: string;
  capacity?: number;
  status?: ClassStatus;
  startDate?: string;
  endDate?: string;
}

// --- Payment schedule / installments ---
export interface Installment {
  dueDate: string;
  plannedAmount: number;
  amount: number; // montant restant dû (0 = soldée)
  status: InstallmentStatus;
}
export interface PaymentScheduleSummary {
  status: InstallmentStatus;
  remainingAmount: number;
}
export interface PaymentScheduleDTO {
  id: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  registrationFee: number;
  installmentsCount: number;
  installmentInterval: IntervalType;
  installments: Installment[];
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// --- Student ---
export interface ProgressionLog {
  id: string;
  date: string;
  status: StudentStatus;
  level?: string | null;
  recordedBy: string;
  reason?: string;
}
export interface StudentListItemDTO {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  contact: string;
  email: string | null;
  gender: Gender;
  currentStatus: StudentStatus;
  currentLevel: string | null;
  enrollmentDate: string;
  progressionLogs: ProgressionLog[] | null;
  classId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  schedule: PaymentScheduleSummary | null;
}
export interface StudentDetailDTO extends Omit<StudentListItemDTO, 'schedule'> {
  classGroup: ClassDTO & { formation: FormationDTO; center: CenterDTO };
  schedule: PaymentScheduleDTO | null;
  payments: PaymentDTO[];
}
export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  contact: string;
  email?: string;
  classId: string;
  currentLevel?: string;
  currentStatus?: StudentStatus;
  enrollmentDate: string;
  registrationFee: number;
  paymentMethod: PaymentMethod;
  installmentsCount: number;
  installmentInterval: IntervalType;
}
export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  contact?: string;
  email?: string;
  classId?: string;
  enrollmentDate?: string;
}
export interface CreateStudentResult {
  student: StudentListItemDTO;
  schedule: PaymentScheduleDTO;
  payment: PaymentDTO | null;
}

// --- Payment ---
export interface PaymentDTO {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  motif: string | null;
  reference: string | null;
  recordedById: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  student?: { firstName: string; lastName: string; matricule: string };
  recordedBy?: { firstName: string; lastName: string };
}
export interface CreatePaymentInput {
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date?: string;
  motif?: string;
  reference?: string;
}
export interface RecordStudentPaymentInput {
  amount: number;
  method: PaymentMethod;
  date?: string;
  motif?: string;
  reference?: string;
}
export type UpdatePaymentInput = Partial<Omit<CreatePaymentInput, 'studentId'>>;
export interface PaymentMutationResult {
  payment: PaymentDTO;
  schedule: PaymentScheduleDTO;
}

// --- Expense ---
export interface ExpenseDTO {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description: string | null;
  recordedById: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  recordedBy?: { firstName: string; lastName: string };
}
export interface CreateExpenseInput {
  title: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description?: string;
}
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

// --- User ---
export interface UserDTO {
  id: string;
  matricule: string | null;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  avatarUrl: string | null;
  centers: { id: string; name: string }[];
}
export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  status?: UserStatus;
  centerIds: string[];
}
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: Role[];
  status?: UserStatus;
  centerIds?: string[];
}
export interface CreateUserResult {
  user: UserDTO;
  provisionalPassword: string;
}
export interface UpdateOwnProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string | null;
}
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// --- Dashboard ---
export interface DashboardStatsDTO {
  revenueThisMonth: number;
  expensesThisMonth: number;
  netIncome: number;
  activeStudents: number;
  totalStudents: number;
  totalToCollect: number;
  totalLateAmount: number;
  totalLateInstallments: number;
  toCollectByFormation: { formationId: string; name: string; value: number }[];
  studentFlow: {
    entries: number;
    exits: number;
    netBalance: number;
    byFormation: { formationId: string; name: string; entries: number; exits: number }[];
  };
  revenueSeries: { month: string; label: string; revenue: number }[];
  flowSeries: { month: string; label: string; entrees: number; sorties: number }[];
  latePayments: {
    studentId: string; firstName: string; lastName: string; matricule: string;
    dueDate: string; amount: number;
  }[];
  recentPayments: {
    id: string; studentId: string; firstName: string; lastName: string;
    amount: number; date: string;
  }[];
}

// --- Reports ---
export interface ReportsSummaryDTO {
  totalActiveStudents: number;
  newStudentsInRange: number;
  totalRevenueInRange: number;
  totalExpensesInRange: number;
  netIncomeInRange: number;
}
export interface FormationReportDTO {
  formationId: string;
  name: string;
  studentCount: number;
  dropoutCount: number;
  dropoutRate: number;
  revenueInRange: number;
}
export interface FinanceSeriesPointDTO {
  month: string;
  label: string;
  revenue: number;
  expenses: number;
}
export interface DateRangeParams {
  from?: string;
  to?: string;
}
