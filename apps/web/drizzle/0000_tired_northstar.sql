CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"actorId" text NOT NULL,
	"actorEmail" text NOT NULL,
	"actorName" text NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resourceId" text,
	"details" jsonb,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_CenterUsers" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Center" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"status" text DEFAULT 'actif' NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ClassGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'ouverte' NOT NULL,
	"capacity" integer NOT NULL,
	"startDate" timestamp (3),
	"endDate" timestamp (3),
	"formationId" text NOT NULL,
	"centerId" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Expense" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"amount" double precision NOT NULL,
	"date" timestamp (3) DEFAULT now() NOT NULL,
	"description" text,
	"recordedById" text NOT NULL,
	"centerId" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_FormationCenters" (
	"A" text NOT NULL,
	"B" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Formation" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"duration" integer NOT NULL,
	"hasLevels" boolean DEFAULT false NOT NULL,
	"levelCount" integer,
	"levels" jsonb,
	"totalCost" double precision NOT NULL,
	"status" text DEFAULT 'actif' NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logoUrl" text,
	"email" text,
	"phone" text,
	"address" text,
	"status" text DEFAULT 'actif' NOT NULL,
	"themeColor" text DEFAULT 'noir' NOT NULL,
	"onboardingStatus" text DEFAULT 'non_commence' NOT NULL,
	"onboardingStep" text,
	"onboardingSkippedSteps" text[] DEFAULT '{}' NOT NULL,
	"onboardingCompletedAt" timestamp (3),
	"onboardingCompletedById" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PaymentSchedule" (
	"id" text PRIMARY KEY NOT NULL,
	"totalAmount" double precision NOT NULL,
	"paidAmount" double precision NOT NULL,
	"remainingAmount" double precision NOT NULL,
	"status" text DEFAULT 'en_retard' NOT NULL,
	"registrationFee" double precision DEFAULT 0 NOT NULL,
	"installmentsCount" integer DEFAULT 0 NOT NULL,
	"installmentInterval" text DEFAULT '1_mois' NOT NULL,
	"installments" jsonb,
	"studentId" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Payment" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" double precision NOT NULL,
	"date" timestamp (3) DEFAULT now() NOT NULL,
	"method" text NOT NULL,
	"motif" text,
	"reference" text,
	"studentId" text NOT NULL,
	"recordedById" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" double precision DEFAULT 0 NOT NULL,
	"maxCenters" integer DEFAULT 1 NOT NULL,
	"maxStudents" integer DEFAULT 50 NOT NULL,
	"isUnlimitedCenters" boolean DEFAULT false NOT NULL,
	"isUnlimitedStudents" boolean DEFAULT false NOT NULL,
	"isPopular" boolean DEFAULT false NOT NULL,
	"features" jsonb,
	"unavailableFeatures" jsonb,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PlatformPayment" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" double precision NOT NULL,
	"status" text DEFAULT 'COMPLETED' NOT NULL,
	"date" timestamp (3) DEFAULT now() NOT NULL,
	"currency" text DEFAULT 'FCFA' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"organizationId" text NOT NULL,
	"planId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RolePermission" (
	"id" text PRIMARY KEY NOT NULL,
	"roleId" text NOT NULL,
	"resource" text NOT NULL,
	"canRead" boolean DEFAULT false NOT NULL,
	"canWrite" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Role" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"isSystem" boolean DEFAULT false NOT NULL,
	"systemKey" text,
	"organizationId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Student" (
	"id" text PRIMARY KEY NOT NULL,
	"matricule" text NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"contact" text NOT NULL,
	"email" text,
	"gender" text NOT NULL,
	"currentStatus" text DEFAULT 'en_cours' NOT NULL,
	"currentLevel" text,
	"enrollmentDate" timestamp (3) DEFAULT now() NOT NULL,
	"progressionLogs" jsonb,
	"classId" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"planId" text,
	"status" text DEFAULT 'trial' NOT NULL,
	"startDate" timestamp (3) DEFAULT now() NOT NULL,
	"endDate" timestamp (3) NOT NULL,
	"maxCenters" integer DEFAULT 3 NOT NULL,
	"maxStudents" integer DEFAULT 200 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"matricule" text NOT NULL,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"avatarUrl" text,
	"roles" text[] NOT NULL,
	"isSuperAdmin" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'actif' NOT NULL,
	"lastLoginAt" timestamp (3),
	"mustChangePassword" boolean DEFAULT false NOT NULL,
	"organizationId" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "_CenterUsers" ADD CONSTRAINT "_CenterUsers_A_Center_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Center"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_CenterUsers" ADD CONSTRAINT "_CenterUsers_B_User_id_fk" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Center" ADD CONSTRAINT "Center_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_formationId_Formation_id_fk" FOREIGN KEY ("formationId") REFERENCES "public"."Formation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_centerId_Center_id_fk" FOREIGN KEY ("centerId") REFERENCES "public"."Center"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_User_id_fk" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_centerId_Center_id_fk" FOREIGN KEY ("centerId") REFERENCES "public"."Center"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_FormationCenters" ADD CONSTRAINT "_FormationCenters_A_Center_id_fk" FOREIGN KEY ("A") REFERENCES "public"."Center"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "_FormationCenters" ADD CONSTRAINT "_FormationCenters_B_Formation_id_fk" FOREIGN KEY ("B") REFERENCES "public"."Formation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Formation" ADD CONSTRAINT "Formation_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_studentId_Student_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_Student_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_User_id_fk" FOREIGN KEY ("recordedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PlatformPayment" ADD CONSTRAINT "PlatformPayment_planId_Plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_Role_id_fk" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Role" ADD CONSTRAINT "Role_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_ClassGroup_id_fk" FOREIGN KEY ("classId") REFERENCES "public"."ClassGroup"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_Plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_Organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" USING btree ("action");--> statement-breakpoint
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "AuditLog" USING btree ("resource","resourceId");--> statement-breakpoint
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "_CenterUsers_AB_unique" ON "_CenterUsers" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_CenterUsers_B_index" ON "_CenterUsers" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "_FormationCenters_AB_unique" ON "_FormationCenters" USING btree ("A","B");--> statement-breakpoint
CREATE INDEX "_FormationCenters_B_index" ON "_FormationCenters" USING btree ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "PlatformPayment_reference_key" ON "PlatformPayment" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "RolePermission_roleId_resource_key" ON "RolePermission" USING btree ("roleId","resource");--> statement-breakpoint
CREATE UNIQUE INDEX "Role_name_organizationId_key" ON "Role" USING btree ("name","organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "Student_matricule_organizationId_key" ON "Student" USING btree ("matricule","organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_matricule_key" ON "User" USING btree ("matricule");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");