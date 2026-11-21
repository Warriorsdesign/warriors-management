import { randomUUID } from 'node:crypto';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const id = () => text('id').primaryKey().$defaultFn(() => randomUUID());
const createdAt = () => timestamp('createdAt', { precision: 3 }).notNull().defaultNow();
const updatedAt = () =>
  timestamp('updatedAt', { precision: 3 })
    .notNull()
    .defaultNow()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const organizations = pgTable('Organization', {
  id: id(),
  name: text('name').notNull(),
  logoUrl: text('logoUrl'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  status: text('status').notNull().default('actif'),
  themeColor: text('themeColor').notNull().default('noir'),
  onboardingStatus: text('onboardingStatus').notNull().default('non_commence'),
  onboardingStep: text('onboardingStep'),
  onboardingSkippedSteps: text('onboardingSkippedSteps').array().notNull().default([]),
  onboardingCompletedAt: timestamp('onboardingCompletedAt', { precision: 3 }),
  onboardingCompletedById: text('onboardingCompletedById'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const centers = pgTable('Center', {
  id: id(),
  name: text('name').notNull(),
  address: text('address'),
  status: text('status').notNull().default('actif'),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable(
  'User',
  {
    id: id(),
    matricule: text('matricule').notNull(),
    firstName: text('firstName').notNull(),
    lastName: text('lastName').notNull(),
    email: text('email').notNull(),
    passwordHash: text('passwordHash').notNull(),
    avatarUrl: text('avatarUrl'),
    roles: text('roles').array().notNull(),
    isSuperAdmin: boolean('isSuperAdmin').notNull().default(false),
    status: text('status').notNull().default('actif'),
    lastLoginAt: timestamp('lastLoginAt', { precision: 3 }),
    mustChangePassword: boolean('mustChangePassword').notNull().default(false),
    organizationId: text('organizationId').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    matriculeUnique: uniqueIndex('User_matricule_key').on(table.matricule),
    emailUnique: uniqueIndex('User_email_key').on(table.email),
  }),
);

export const formations = pgTable('Formation', {
  id: id(),
  name: text('name').notNull(),
  duration: integer('duration').notNull(),
  hasLevels: boolean('hasLevels').notNull().default(false),
  levelCount: integer('levelCount'),
  levels: jsonb('levels'),
  totalCost: doublePrecision('totalCost').notNull(),
  status: text('status').notNull().default('actif'),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const classGroups = pgTable('ClassGroup', {
  id: id(),
  name: text('name').notNull(),
  status: text('status').notNull().default('ouverte'),
  capacity: integer('capacity').notNull(),
  startDate: timestamp('startDate', { precision: 3 }),
  endDate: timestamp('endDate', { precision: 3 }),
  formationId: text('formationId')
    .notNull()
    .references(() => formations.id, { onDelete: 'cascade' }),
  centerId: text('centerId')
    .notNull()
    .references(() => centers.id, { onDelete: 'cascade' }),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const students = pgTable(
  'Student',
  {
    id: id(),
    matricule: text('matricule').notNull(),
    firstName: text('firstName').notNull(),
    lastName: text('lastName').notNull(),
    contact: text('contact').notNull(),
    email: text('email'),
    gender: text('gender').notNull(),
    currentStatus: text('currentStatus').notNull().default('en_cours'),
    currentLevel: text('currentLevel'),
    enrollmentDate: timestamp('enrollmentDate', { precision: 3 }).notNull().defaultNow(),
    progressionLogs: jsonb('progressionLogs'),
    classId: text('classId')
      .notNull()
      .references(() => classGroups.id, { onDelete: 'cascade' }),
    organizationId: text('organizationId')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => ({
    matriculeOrganizationUnique: uniqueIndex('Student_matricule_organizationId_key').on(
      table.matricule,
      table.organizationId,
    ),
  }),
);

export const paymentSchedules = pgTable('PaymentSchedule', {
  id: id(),
  totalAmount: doublePrecision('totalAmount').notNull(),
  paidAmount: doublePrecision('paidAmount').notNull(),
  remainingAmount: doublePrecision('remainingAmount').notNull(),
  status: text('status').notNull().default('en_retard'),
  registrationFee: doublePrecision('registrationFee').notNull().default(0),
  installmentsCount: integer('installmentsCount').notNull().default(0),
  installmentInterval: text('installmentInterval').notNull().default('1_mois'),
  installments: jsonb('installments'),
  studentId: text('studentId')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const payments = pgTable('Payment', {
  id: id(),
  amount: doublePrecision('amount').notNull(),
  date: timestamp('date', { precision: 3 }).notNull().defaultNow(),
  method: text('method').notNull(),
  motif: text('motif'),
  reference: text('reference'),
  studentId: text('studentId')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  recordedById: text('recordedById').notNull().references(() => users.id),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const expenses = pgTable('Expense', {
  id: id(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  date: timestamp('date', { precision: 3 }).notNull().defaultNow(),
  description: text('description'),
  recordedById: text('recordedById').notNull().references(() => users.id),
  centerId: text('centerId')
    .notNull()
    .references(() => centers.id, { onDelete: 'cascade' }),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const plans = pgTable('Plan', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  price: doublePrecision('price').notNull().default(0),
  maxCenters: integer('maxCenters').notNull().default(1),
  maxStudents: integer('maxStudents').notNull().default(50),
  isUnlimitedCenters: boolean('isUnlimitedCenters').notNull().default(false),
  isUnlimitedStudents: boolean('isUnlimitedStudents').notNull().default(false),
  isPopular: boolean('isPopular').notNull().default(false),
  features: jsonb('features'),
  unavailableFeatures: jsonb('unavailableFeatures'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => ({
  nameUnique: uniqueIndex('Plan_name_key').on(table.name),
}));

export const subscriptions = pgTable('Subscription', {
  id: id(),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  planId: text('planId').references(() => plans.id),
  status: text('status').notNull().default('trial'),
  startDate: timestamp('startDate', { precision: 3 }).notNull().defaultNow(),
  endDate: timestamp('endDate', { precision: 3 }).notNull(),
  maxCenters: integer('maxCenters').notNull().default(3),
  maxStudents: integer('maxStudents').notNull().default(200),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => ({
  organizationUnique: uniqueIndex('Subscription_organizationId_key').on(table.organizationId),
}));

export const auditLogs = pgTable('AuditLog', {
  id: id(),
  actorId: text('actorId').notNull(),
  actorEmail: text('actorEmail').notNull(),
  actorName: text('actorName').notNull(),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resourceId'),
  details: jsonb('details'),
  createdAt: createdAt(),
}, (table) => ({
  actionIndex: index('AuditLog_action_idx').on(table.action),
  resourceIndex: index('AuditLog_resource_resourceId_idx').on(table.resource, table.resourceId),
  createdAtIndex: index('AuditLog_createdAt_idx').on(table.createdAt),
}));

export const platformPayments = pgTable('PlatformPayment', {
  id: id(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('COMPLETED'),
  date: timestamp('date', { precision: 3 }).notNull().defaultNow(),
  currency: text('currency').notNull().default('FCFA'),
  reference: text('reference').notNull().default(''),
  organizationId: text('organizationId')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  planId: text('planId').references(() => plans.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => ({
  referenceUnique: uniqueIndex('PlatformPayment_reference_key').on(table.reference),
}));

export const roles = pgTable('Role', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('isSystem').notNull().default(false),
  systemKey: text('systemKey'),
  organizationId: text('organizationId').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => ({
  nameOrganizationUnique: uniqueIndex('Role_name_organizationId_key').on(table.name, table.organizationId),
}));

export const rolePermissions = pgTable('RolePermission', {
  id: id(),
  roleId: text('roleId')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  resource: text('resource').notNull(),
  canRead: boolean('canRead').notNull().default(false),
  canWrite: boolean('canWrite').notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => ({
  roleResourceUnique: uniqueIndex('RolePermission_roleId_resource_key').on(table.roleId, table.resource),
}));

export const centerUsers = pgTable(
  '_CenterUsers',
  {
    centerId: text('A')
      .notNull()
      .references(() => centers.id, { onDelete: 'cascade' }),
    userId: text('B')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    primary: uniqueIndex('_CenterUsers_AB_unique').on(table.centerId, table.userId),
    userIndex: index('_CenterUsers_B_index').on(table.userId),
  }),
);

export const formationCenters = pgTable(
  '_FormationCenters',
  {
    centerId: text('A')
      .notNull()
      .references(() => centers.id, { onDelete: 'cascade' }),
    formationId: text('B')
      .notNull()
      .references(() => formations.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    primary: uniqueIndex('_FormationCenters_AB_unique').on(table.centerId, table.formationId),
    formationIndex: index('_FormationCenters_B_index').on(table.formationId),
  }),
);

export type Organization = typeof organizations.$inferSelect;
export type Center = typeof centers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Formation = typeof formations.$inferSelect;
export type ClassGroup = typeof classGroups.$inferSelect;
export type Student = typeof students.$inferSelect;
export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type PlatformPayment = typeof platformPayments.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type RolePermission = typeof rolePermissions.$inferSelect;
