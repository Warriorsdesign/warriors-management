--
-- PostgreSQL database dump
--

\restrict 7PHocPyONATODcmAxfyK9y9osfh6ihPvWAXic5kzKQzJv5RFprSKlOUmuRo7FLS

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS tenant_isolation_user ON public."User";
DROP POLICY IF EXISTS tenant_isolation_subscription ON public."Subscription";
DROP POLICY IF EXISTS tenant_isolation_student ON public."Student";
DROP POLICY IF EXISTS tenant_isolation_paymentschedule ON public."PaymentSchedule";
DROP POLICY IF EXISTS tenant_isolation_payment ON public."Payment";
DROP POLICY IF EXISTS tenant_isolation_organization ON public."Organization";
DROP POLICY IF EXISTS tenant_isolation_formation ON public."Formation";
DROP POLICY IF EXISTS tenant_isolation_expense ON public."Expense";
DROP POLICY IF EXISTS tenant_isolation_classgroup ON public."ClassGroup";
DROP POLICY IF EXISTS tenant_isolation_centerusers ON public."_CenterUsers";
DROP POLICY IF EXISTS tenant_isolation_center ON public."Center";
DROP POLICY IF EXISTS tenant_auditlog_insert ON public."AuditLog";
DROP POLICY IF EXISTS auth_read_user ON public."User";
ALTER TABLE IF EXISTS ONLY public."_CenterUsers" DROP CONSTRAINT IF EXISTS "_CenterUsers_B_fkey";
ALTER TABLE IF EXISTS ONLY public."_CenterUsers" DROP CONSTRAINT IF EXISTS "_CenterUsers_A_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Subscription" DROP CONSTRAINT IF EXISTS "Subscription_planId_fkey";
ALTER TABLE IF EXISTS ONLY public."Subscription" DROP CONSTRAINT IF EXISTS "Subscription_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Student" DROP CONSTRAINT IF EXISTS "Student_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Student" DROP CONSTRAINT IF EXISTS "Student_classId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_recordedById_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."PaymentSchedule" DROP CONSTRAINT IF EXISTS "PaymentSchedule_studentId_fkey";
ALTER TABLE IF EXISTS ONLY public."PaymentSchedule" DROP CONSTRAINT IF EXISTS "PaymentSchedule_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Formation" DROP CONSTRAINT IF EXISTS "Formation_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Expense" DROP CONSTRAINT IF EXISTS "Expense_recordedById_fkey";
ALTER TABLE IF EXISTS ONLY public."Expense" DROP CONSTRAINT IF EXISTS "Expense_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."Expense" DROP CONSTRAINT IF EXISTS "Expense_centerId_fkey";
ALTER TABLE IF EXISTS ONLY public."ClassGroup" DROP CONSTRAINT IF EXISTS "ClassGroup_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ClassGroup" DROP CONSTRAINT IF EXISTS "ClassGroup_formationId_fkey";
ALTER TABLE IF EXISTS ONLY public."ClassGroup" DROP CONSTRAINT IF EXISTS "ClassGroup_centerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Center" DROP CONSTRAINT IF EXISTS "Center_organizationId_fkey";
DROP INDEX IF EXISTS public."_CenterUsers_B_index";
DROP INDEX IF EXISTS public."_CenterUsers_AB_unique";
DROP INDEX IF EXISTS public."User_matricule_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."Subscription_organizationId_key";
DROP INDEX IF EXISTS public."Student_matricule_organizationId_key";
DROP INDEX IF EXISTS public."Plan_name_key";
DROP INDEX IF EXISTS public."AuditLog_resource_resourceId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AuditLog_action_idx";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Subscription" DROP CONSTRAINT IF EXISTS "Subscription_pkey";
ALTER TABLE IF EXISTS ONLY public."Student" DROP CONSTRAINT IF EXISTS "Student_pkey";
ALTER TABLE IF EXISTS ONLY public."Plan" DROP CONSTRAINT IF EXISTS "Plan_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."PaymentSchedule" DROP CONSTRAINT IF EXISTS "PaymentSchedule_pkey";
ALTER TABLE IF EXISTS ONLY public."Organization" DROP CONSTRAINT IF EXISTS "Organization_pkey";
ALTER TABLE IF EXISTS ONLY public."Formation" DROP CONSTRAINT IF EXISTS "Formation_pkey";
ALTER TABLE IF EXISTS ONLY public."Expense" DROP CONSTRAINT IF EXISTS "Expense_pkey";
ALTER TABLE IF EXISTS ONLY public."ClassGroup" DROP CONSTRAINT IF EXISTS "ClassGroup_pkey";
ALTER TABLE IF EXISTS ONLY public."Center" DROP CONSTRAINT IF EXISTS "Center_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
DROP TABLE IF EXISTS public."_CenterUsers";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Subscription";
DROP TABLE IF EXISTS public."Student";
DROP TABLE IF EXISTS public."Plan";
DROP TABLE IF EXISTS public."PaymentSchedule";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."Organization";
DROP TABLE IF EXISTS public."Formation";
DROP TABLE IF EXISTS public."Expense";
DROP TABLE IF EXISTS public."ClassGroup";
DROP TABLE IF EXISTS public."Center";
DROP TABLE IF EXISTS public."AuditLog";
DROP FUNCTION IF EXISTS public.rls_auto_enable();
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text NOT NULL,
    "actorEmail" text NOT NULL,
    "actorName" text NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE ONLY public."AuditLog" FORCE ROW LEVEL SECURITY;


--
-- Name: Center; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Center" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    status text DEFAULT 'actif'::text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."Center" FORCE ROW LEVEL SECURITY;


--
-- Name: ClassGroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClassGroup" (
    id text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'ouverte'::text NOT NULL,
    capacity integer NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "formationId" text NOT NULL,
    "centerId" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."ClassGroup" FORCE ROW LEVEL SECURITY;


--
-- Name: Expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "recordedById" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "centerId" text NOT NULL
);

ALTER TABLE ONLY public."Expense" FORCE ROW LEVEL SECURITY;


--
-- Name: Formation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Formation" (
    id text NOT NULL,
    name text NOT NULL,
    duration integer NOT NULL,
    "hasLevels" boolean DEFAULT false NOT NULL,
    "levelCount" integer,
    levels jsonb,
    "totalCost" double precision NOT NULL,
    status text DEFAULT 'actif'::text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."Formation" FORCE ROW LEVEL SECURITY;


--
-- Name: Organization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    "logoUrl" text,
    email text,
    phone text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'actif'::text NOT NULL
);

ALTER TABLE ONLY public."Organization" FORCE ROW LEVEL SECURITY;


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    method text NOT NULL,
    motif text,
    reference text,
    "studentId" text NOT NULL,
    "recordedById" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."Payment" FORCE ROW LEVEL SECURITY;


--
-- Name: PaymentSchedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentSchedule" (
    id text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "paidAmount" double precision NOT NULL,
    "remainingAmount" double precision NOT NULL,
    status text DEFAULT 'en_retard'::text NOT NULL,
    installments jsonb,
    "studentId" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "installmentInterval" text DEFAULT '1_mois'::text NOT NULL,
    "installmentsCount" integer DEFAULT 0 NOT NULL,
    "registrationFee" double precision DEFAULT 0 NOT NULL
);

ALTER TABLE ONLY public."PaymentSchedule" FORCE ROW LEVEL SECURITY;


--
-- Name: Plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Plan" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision DEFAULT 0 NOT NULL,
    "maxCenters" integer DEFAULT 1 NOT NULL,
    "maxStudents" integer DEFAULT 50 NOT NULL,
    "isPopular" boolean DEFAULT false NOT NULL,
    features jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Student; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Student" (
    id text NOT NULL,
    matricule text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    contact text NOT NULL,
    email text,
    gender text NOT NULL,
    "currentStatus" text DEFAULT 'en_cours'::text NOT NULL,
    "currentLevel" text,
    "enrollmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "progressionLogs" jsonb,
    "classId" text NOT NULL,
    "organizationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

ALTER TABLE ONLY public."Student" FORCE ROW LEVEL SECURITY;


--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "organizationId" text NOT NULL,
    status text DEFAULT 'trial'::text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "maxCenters" integer DEFAULT 3 NOT NULL,
    "maxStudents" integer DEFAULT 200 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "planId" text
);

ALTER TABLE ONLY public."Subscription" FORCE ROW LEVEL SECURITY;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    matricule text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    roles text[],
    status text DEFAULT 'actif'::text NOT NULL,
    "organizationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "avatarUrl" text,
    "isSuperAdmin" boolean DEFAULT false NOT NULL
);

ALTER TABLE ONLY public."User" FORCE ROW LEVEL SECURITY;


--
-- Name: _CenterUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_CenterUsers" (
    "A" text NOT NULL,
    "B" text NOT NULL
);

ALTER TABLE ONLY public."_CenterUsers" FORCE ROW LEVEL SECURITY;


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "actorId", "actorEmail", "actorName", action, resource, "resourceId", details, "createdAt") FROM stdin;
e5a4b683-ba74-4aad-a31c-9a5c3a45c96e	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	ORGANIZATION_ACTIVATED	Organization	0e83f155-6a19-4016-93e1-3687c95e6c9d	{"reason": "paiement ok", "newStatus": "actif", "previousStatus": "suspendu", "organizationName": "D institut"}	2026-09-27 01:40:14.206
8339b6af-7769-48aa-b0c6-6258f6bb34c5	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	SUBSCRIPTION_UPDATED	Subscription	a20c6ba5-453b-4e55-ac15-48c85d6c79c0	{"plan": "PRO", "status": "active", "endDate": "2027-09-27T00:00:00.000Z", "organizationName": "D institut"}	2026-09-27 01:41:15.788
5e0c8e59-5d25-426e-b374-267e9142abc3	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	SUBSCRIPTION_UPDATED	Subscription	a20c6ba5-453b-4e55-ac15-48c85d6c79c0	{"plan": "PRO", "status": "active", "endDate": "2027-09-27T00:00:00.000Z", "organizationName": "D institut"}	2026-09-27 01:41:41.207
e9f41ffc-190b-4a20-ab99-9d7712c39f60	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGIN	Security	4937081b-630c-48e6-ba96-2b90b1429036	{"ip": "::1", "userAgent": "node"}	2026-09-27 09:03:37.857
0c357324-ac6f-4b03-8e43-9a5860ae3965	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGOUT	Security	4937081b-630c-48e6-ba96-2b90b1429036	\N	2026-09-27 09:03:39.55
fefb23d6-3217-4919-aeef-917aca2748c8	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGIN	Security	4937081b-630c-48e6-ba96-2b90b1429036	{"ip": "::1", "userAgent": "node"}	2026-09-27 09:10:25.023
ab1e91e7-f1f3-43a9-9e97-e1c0e6ac4b90	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGIN	Security	4937081b-630c-48e6-ba96-2b90b1429036	{"ip": "::1", "userAgent": "node"}	2026-09-27 09:24:25.8
ae614c2f-f2ae-484e-8585-9b10f3c77c62	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGIN	Security	4937081b-630c-48e6-ba96-2b90b1429036	{"ip": "::1", "userAgent": "node"}	2026-09-27 09:25:57.48
c2d6d9fb-6578-4eb2-8b87-acbd815f7d2d	4937081b-630c-48e6-ba96-2b90b1429036	superadmin@warriors.com	Super Admin	ADMIN_LOGIN	Security	4937081b-630c-48e6-ba96-2b90b1429036	{"ip": "::1", "userAgent": "node"}	2026-09-27 09:29:53.519
d6a61efe-c169-4df1-9c6d-8da227c4f1ff	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	USER_DEACTIVATED	User	c5c34151-f217-4d02-bb46-a47d1c24fc26	{"reason": "Non précisé", "newStatus": "inactif", "targetName": "dony samo", "targetEmail": "samodony@gmail.com"}	2026-09-27 09:35:27.671
c4b8c8d2-1fc6-4411-95b4-7712d4e56c5a	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	USER_ACTIVATED	User	c5c34151-f217-4d02-bb46-a47d1c24fc26	{"reason": "Non précisé", "newStatus": "actif", "targetName": "dony samo", "targetEmail": "samodony@gmail.com"}	2026-09-27 09:35:31.088
2c23880f-09b0-414e-badf-46729f4b7323	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	USER_DEACTIVATED	User	97378af7-a0f4-4cef-8717-5b710136de81	{"reason": "Non précisé", "newStatus": "inactif", "targetName": "Chris Donald", "targetEmail": "samo@gmail.com"}	2026-09-27 09:35:37.131
65de92c6-9b0f-4719-861f-4a1eb9dd37f6	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	SUBSCRIPTION_UPDATED	Subscription	9a56b690-27d8-4b49-9ad0-a2ea4575cbe5	{"planId": null, "status": "active", "endDate": "2026-09-27T00:00:00.000Z", "organizationName": "Institut Lavoire"}	2026-09-27 10:02:18.954
af5ea940-616e-473f-a757-6e92d1c4b4b0	c949b6e4-f145-4d62-886a-7230009d193c	alexsong@gmail.com	Super Admin	ADMIN_LOGOUT	Security	c949b6e4-f145-4d62-886a-7230009d193c	\N	2026-09-27 10:09:01.192
\.


--
-- Data for Name: Center; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Center" (id, name, address, status, "organizationId", "createdAt", "updatedAt") FROM stdin;
0bb9d628-4774-4d9e-964c-4e30a3ce22bf	Centre Abidjan	Cocody	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 01:14:06.131	2026-09-02 01:14:29.419
e676c77a-9c4b-499e-83ee-89cc5cb66b37	Centre Test PW		actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:38:48.544	2026-09-02 20:38:48.544
41cccfde-e640-4071-8d35-5c571feb15cb	Centre Test PW		actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:40:11.97	2026-09-02 20:40:11.97
5b3b02b3-5271-43fc-943b-8e32c3984bb7	Centre Test PW		actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:42:30.679	2026-09-02 20:42:30.679
9a2f9f30-a1c4-4ead-8e2a-b2aaed1369fd	Centre M3 892689		actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:45:07.369	2026-09-02 20:45:07.369
035cc8ba-2d8d-4692-a49f-0c687ab7100c	Centre M3 015279	\N	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:46:58.784	2026-09-02 20:46:58.784
347ade0c-01b4-42d4-9ddd-afec451658ce	Centre M3 636016	\N	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:24.041	2026-09-02 20:57:24.041
0d46dc93-bc59-4fd9-99e6-20899f0f9933	Campus de Douala		actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:00:33.872	2026-09-09 18:00:33.872
5dbead6c-1ad1-44cf-be70-90865a81d89a	Campus Yaoundé		actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:25:17.099	2026-09-09 18:25:17.099
fd9538c3-3742-4cf8-8bd5-48fd28a6ce97	Campus de Bafoussam	famla carrefour	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-26 23:58:14.774	2026-09-26 23:58:14.774
\.


--
-- Data for Name: ClassGroup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ClassGroup" (id, name, status, capacity, "startDate", "endDate", "formationId", "centerId", "organizationId", "createdAt", "updatedAt") FROM stdin;
7d524485-4561-4838-a53c-77161eb1ee0a	Promo A	cloturee	20	\N	\N	94a0ab05-0bce-4a6c-a49c-d4346ebc5eee	0bb9d628-4774-4d9e-964c-4e30a3ce22bf	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 01:14:59.689	2026-09-02 01:15:18.01
7f68e651-f3e0-4a55-a26d-b17d17048664	Promo B	ouverte	2	\N	\N	94a0ab05-0bce-4a6c-a49c-d4346ebc5eee	0bb9d628-4774-4d9e-964c-4e30a3ce22bf	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:39:16.495	2026-09-02 05:39:16.495
5c616bba-401a-4803-acf6-bd4be14f6461	Promo M3 015279	ouverte	10	\N	\N	f9d7bcaa-9c77-4074-a341-50f8eb593120	035cc8ba-2d8d-4692-a49f-0c687ab7100c	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:03.384	2026-09-02 20:47:03.384
3c811b5b-e7c5-4d63-bdb3-52599c6a439b	Promo M3 636016	ouverte	10	\N	\N	cb6a3dc9-7a49-4688-9490-87577734c68a	347ade0c-01b4-42d4-9ddd-afec451658ce	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:29.011	2026-09-02 20:57:29.011
5383ef6f-335d-4722-9783-720933e0fad1	Berlin	ouverte	15	\N	\N	3f79c76a-c64c-430e-8bfb-de929cdc741f	0d46dc93-bc59-4fd9-99e6-20899f0f9933	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:18:34.029	2026-09-09 18:18:34.029
1514ffe8-dc12-4837-aa20-b541c501c9f4	Hamburg	ouverte	10	\N	\N	4f2ace51-7a3f-4019-8211-bc929437febd	0d46dc93-bc59-4fd9-99e6-20899f0f9933	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:24:42.581	2026-09-09 18:24:42.581
2699c672-cf0a-4143-a304-f47a2dd7153a	Frankfurt	ouverte	25	\N	\N	3f79c76a-c64c-430e-8bfb-de929cdc741f	5dbead6c-1ad1-44cf-be70-90865a81d89a	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:25:55.703	2026-09-09 18:25:55.703
b85e1dba-7e0e-444b-a351-a4752de20170	Londres	ouverte	10	\N	\N	433e51d5-6978-4615-9934-26e1bf3a9bcd	5dbead6c-1ad1-44cf-be70-90865a81d89a	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:29:32.153	2026-09-09 18:29:32.153
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Expense" (id, title, category, amount, date, description, "recordedById", "organizationId", "createdAt", "updatedAt", "centerId") FROM stdin;
b476e9bf-be68-49a9-8d36-bcec06e0b897	Loyer Septembre	Loyer	150000	2026-09-01 00:00:00	\N	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:43:26.45	2026-09-17 02:38:36.265	0bb9d628-4774-4d9e-964c-4e30a3ce22bf
341cc91e-ac11-475f-8b65-971687957de8	Test	Autre	1000	2026-09-01 00:00:00	\N	98a8851b-38c7-44e3-94b1-91c30d882a58	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:43:45.76	2026-09-17 02:38:36.888	0bb9d628-4774-4d9e-964c-4e30a3ce22bf
ee8abac6-d8f9-49ff-b030-423c1fe7e38e	Achat matériel	Équipement	20000	2026-09-09 00:00:00	\N	a2cd910d-8026-49e6-a86d-93694764ac1b	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 19:14:12.805	2026-09-17 02:38:37.233	0d46dc93-bc59-4fd9-99e6-20899f0f9933
\.


--
-- Data for Name: Formation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Formation" (id, name, duration, "hasLevels", "levelCount", levels, "totalCost", status, "organizationId", "createdAt", "updatedAt") FROM stdin;
94a0ab05-0bce-4a6c-a49c-d4346ebc5eee	Fullstack Dev	9	t	5	[{"id": "lvl_1", "name": "Niveau 1"}, {"id": "lvl_2", "name": "Niveau Intermediaire"}, {"id": "lvl_3", "name": "Niveau 3"}, {"id": "lvl_4", "name": "Niveau 4"}, {"id": "lvl_5", "name": "Niveau 5"}]	900000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 01:14:39.977	2026-09-02 01:14:54.764
853b3cca-be1d-4bca-8116-36494db40453	Formation Test PW	6	t	3	[{"id": "lvl_1", "name": "Niveau 1"}, {"id": "lvl_2", "name": "Niveau 2"}, {"id": "lvl_3", "name": "Niveau 3"}]	300000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:42:42.372	2026-09-02 20:42:42.372
e9a0573e-9352-4426-bc2f-9d50b9ba290d	Formation M3 892689	6	f	\N	[]	500000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:45:14.342	2026-09-02 20:45:14.342
f9d7bcaa-9c77-4074-a341-50f8eb593120	Formation M3 015279	6	f	\N	[]	500000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:01.241	2026-09-02 20:47:01.241
cb6a3dc9-7a49-4688-9490-87577734c68a	Formation M3 636016	6	f	\N	[]	500000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:26.591	2026-09-02 20:57:26.591
966b7458-7915-4e4e-a57f-f118cf9c5b68	Formation Test PW	6	t	3	[{"id": "lvl_1", "name": "Débutant"}, {"id": "lvl_2", "name": "Niveau 2"}, {"id": "lvl_3", "name": "Niveau 3"}]	300000	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:40:23.727	2026-09-02 21:19:03.107
ce413ef3-343e-4654-883d-ad06b7d690bb	Test Gest	3	f	\N	[]	100000	inactif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 01:15:47.748	2026-09-02 21:29:13.741
3f79c76a-c64c-430e-8bfb-de929cdc741f	Allemand Débutant	3	t	2	[{"id": "lvl_1", "name": "A1"}, {"id": "lvl_2", "name": "A2"}]	80000	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:17:45.863	2026-09-09 18:18:13.505
433e51d5-6978-4615-9934-26e1bf3a9bcd	Anglais	3	f	\N	[]	55000	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:20:29.663	2026-09-09 18:20:29.663
4f2ace51-7a3f-4019-8211-bc929437febd	Allemand Intermédiaire	2	t	2	[{"id": "lvl_1", "name": "B1"}, {"id": "lvl_2", "name": "B2"}]	95000	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:19:16.747	2026-09-09 18:29:51.824
\.


--
-- Data for Name: Organization; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Organization" (id, name, "logoUrl", email, phone, address, "createdAt", "updatedAt", status) FROM stdin;
3d2b5868-0cc4-41eb-aba6-31bf45197cea	Institut Lavoire	\N	admin@org-b.test	\N	\N	2026-09-02 01:00:27.921	2026-09-27 00:00:09.522	actif
0e83f155-6a19-4016-93e1-3687c95e6c9d	D institut	\N	dinstitut@gmail.com	+237 688 25 14 25	Yaoundé	2026-09-02 01:00:25.087	2026-09-27 01:40:13.352	actif
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, amount, date, method, motif, reference, "studentId", "recordedById", "organizationId", "createdAt", "updatedAt") FROM stdin;
da084dec-0c5e-49e4-8c26-9dde9280afc8	50000	2026-01-15 00:00:00	Virement	Frais d'inscription	\N	f10d0bc6-a1d7-4029-9cc2-898fabeb2576	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:40:35.988	2026-09-02 05:40:35.988
bae6de63-4a4d-426f-ace0-e873b9eb3b9d	100000	2026-09-02 05:40:58.822	Virement	\N	\N	f10d0bc6-a1d7-4029-9cc2-898fabeb2576	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:40:58.825	2026-09-02 05:40:58.825
74fb13ad-702e-4771-b171-223877a0f5b3	50000	2026-09-02 00:00:00	Virement	Frais d'inscription	\N	4609b838-b2e3-401f-80ef-ab0a4739ccad	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:08.614	2026-09-02 20:47:08.614
92787eba-aabe-4735-b521-a4a31e6504f4	80000	2026-09-02 20:47:20.007	Chèque	\N	\N	4609b838-b2e3-401f-80ef-ab0a4739ccad	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:20.016	2026-09-02 20:47:20.016
a6fe4c18-baaa-4cee-88b3-2416b5064f02	60000	2026-09-02 20:47:14.735	Espèces	\N	\N	4609b838-b2e3-401f-80ef-ab0a4739ccad	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:14.743	2026-09-02 20:47:24.862
543113a7-0ad0-46ff-871a-f83aaff182f9	50000	2026-09-02 00:00:00	Virement	Frais d'inscription	\N	058afd22-99af-4e26-b1e2-8f5e0c034a47	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:34.906	2026-09-02 20:57:34.906
88630801-85b9-4c73-96df-1621324a8185	80000	2026-09-02 20:57:46.165	Chèque	\N	\N	058afd22-99af-4e26-b1e2-8f5e0c034a47	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:46.166	2026-09-02 20:57:46.166
92dbd745-e7dc-40e8-998e-6960a488e92b	60000	2026-09-02 20:57:40.744	Espèces	\N	\N	058afd22-99af-4e26-b1e2-8f5e0c034a47	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:40.745	2026-09-02 20:57:51.793
3571f611-89f8-4251-b4af-3a5e55a30f2f	100000	2026-09-02 00:00:00	Espèces	Frais d'inscription	\N	57d52cdf-2994-4a08-8ab1-554611af01ad	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 21:10:43.088	2026-09-02 21:10:43.088
749f6dd4-1dbf-43bc-ae29-808d74a7b3ea	200000	2026-09-02 21:12:13.868	Espèces	Tranche 2	\N	57d52cdf-2994-4a08-8ab1-554611af01ad	5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 21:12:13.87	2026-09-02 21:12:13.87
e268dbd4-443c-4319-ba76-6463b6d05cab	20000	2026-09-09 00:00:00	Espèces	Frais d'inscription	\N	9a7b1296-f527-4ba7-9e4e-cbe31e4e3d9f	a2cd910d-8026-49e6-a86d-93694764ac1b	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:40:27.91	2026-09-09 18:40:27.91
5d6e7447-5d94-44f5-abdf-4e64b0ccae8e	15000	2026-09-09 00:00:00	Espèces	Frais d'inscription	\N	135c5721-24d2-4a6c-ab9c-1735e9b5153e	a2cd910d-8026-49e6-a86d-93694764ac1b	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:42:14.398	2026-09-09 18:42:14.398
68ebf8ab-61a6-4cdd-8b32-25c5587c3b3a	30000	2026-09-09 00:00:00	Espèces	Frais d'inscription	\N	8b191ad7-18fd-4437-b7d8-3db5b98aa7a2	a2cd910d-8026-49e6-a86d-93694764ac1b	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:55:14.501	2026-09-09 18:55:14.501
ba97d425-936b-460f-8eea-3ab90d8746af	5000	2026-09-09 00:00:00	Espèces	Frais d'inscription	\N	495b20cb-70bf-4c42-b661-a611903cf2d1	a2cd910d-8026-49e6-a86d-93694764ac1b	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:56:37.151	2026-09-09 18:56:37.151
a409c87e-1ae9-4ac1-86f1-9159ba40dff3	1000	2026-09-11 00:00:00	Virement	Frais d'inscription	\N	df747601-d6a5-4ce1-a069-4a7b8f4f1682	97378af7-a0f4-4cef-8717-5b710136de81	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-11 17:48:00.684	2026-09-11 17:48:00.684
\.


--
-- Data for Name: PaymentSchedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentSchedule" (id, "totalAmount", "paidAmount", "remainingAmount", status, installments, "studentId", "organizationId", "createdAt", "updatedAt", "installmentInterval", "installmentsCount", "registrationFee") FROM stdin;
0f6121f1-3a90-469f-be17-11ecad43cb42	500000	190000	310000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-02T00:00:00.000Z", "plannedAmount": 50000}, {"amount": 10000, "status": "a_jour", "dueDate": "2026-10-02T00:00:00.000Z", "plannedAmount": 150000}, {"amount": 150000, "status": "a_jour", "dueDate": "2026-11-02T00:00:00.000Z", "plannedAmount": 150000}, {"amount": 150000, "status": "a_jour", "dueDate": "2026-12-02T00:00:00.000Z", "plannedAmount": 150000}]	4609b838-b2e3-401f-80ef-ab0a4739ccad	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:07.997	2026-09-02 20:47:27.353	1_mois	3	50000
9355c81d-862f-43b9-a38c-091cda6965a9	80000	20000	60000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-09T00:00:00.000Z", "plannedAmount": 20000}, {"amount": 30000, "status": "a_jour", "dueDate": "2026-09-30T00:00:00.000Z", "plannedAmount": 30000}, {"amount": 30000, "status": "a_jour", "dueDate": "2026-10-21T00:00:00.000Z", "plannedAmount": 30000}]	9a7b1296-f527-4ba7-9e4e-cbe31e4e3d9f	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:40:27.374	2026-09-09 18:40:29.966	3_semaines	2	20000
b7a55ad6-792b-4146-b72a-15f499230549	900000	150000	750000	en_retard	[{"amount": 0, "status": "solde", "dueDate": "2026-01-15T00:00:00.000Z", "plannedAmount": 50000}, {"amount": 183333, "status": "en_retard", "dueDate": "2026-02-15T00:00:00.000Z", "plannedAmount": 283333}, {"amount": 283333, "status": "en_retard", "dueDate": "2026-03-15T00:00:00.000Z", "plannedAmount": 283333}, {"amount": 283334, "status": "en_retard", "dueDate": "2026-04-15T00:00:00.000Z", "plannedAmount": 283334}]	f10d0bc6-a1d7-4029-9cc2-898fabeb2576	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:40:35.279	2026-09-02 05:43:14.436	1_mois	3	50000
06aa5f53-2d03-49f0-bab2-166449a75c07	500000	190000	310000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-02T00:00:00.000Z", "plannedAmount": 50000}, {"amount": 10000, "status": "a_jour", "dueDate": "2026-10-02T00:00:00.000Z", "plannedAmount": 150000}, {"amount": 150000, "status": "a_jour", "dueDate": "2026-11-02T00:00:00.000Z", "plannedAmount": 150000}, {"amount": 150000, "status": "a_jour", "dueDate": "2026-12-02T00:00:00.000Z", "plannedAmount": 150000}]	058afd22-99af-4e26-b1e2-8f5e0c034a47	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:34.287	2026-09-02 20:57:53.804	1_mois	3	50000
4c82523d-5b3f-488c-8740-52cb828d2bf1	95000	15000	80000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-09T00:00:00.000Z", "plannedAmount": 15000}, {"amount": 40000, "status": "a_jour", "dueDate": "2026-09-30T00:00:00.000Z", "plannedAmount": 40000}, {"amount": 40000, "status": "a_jour", "dueDate": "2026-10-21T00:00:00.000Z", "plannedAmount": 40000}]	135c5721-24d2-4a6c-ab9c-1735e9b5153e	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:42:13.85	2026-09-09 18:42:16.828	3_semaines	2	15000
f4299a37-f13b-4448-b543-ddbe35f42bfe	900000	300000	600000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-02T00:00:00.000Z", "plannedAmount": 100000}, {"amount": 0, "status": "solde", "dueDate": "2026-10-02T00:00:00.000Z", "plannedAmount": 200000}, {"amount": 200000, "status": "a_jour", "dueDate": "2026-11-02T00:00:00.000Z", "plannedAmount": 200000}, {"amount": 200000, "status": "a_jour", "dueDate": "2026-12-02T00:00:00.000Z", "plannedAmount": 200000}, {"amount": 200000, "status": "a_jour", "dueDate": "2027-01-02T00:00:00.000Z", "plannedAmount": 200000}]	57d52cdf-2994-4a08-8ab1-554611af01ad	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 21:10:42.476	2026-09-02 21:12:16.23	1_mois	4	100000
2ec3e598-1ea3-43bf-aa38-ba22e9cd203b	80000	30000	50000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-09T00:00:00.000Z", "plannedAmount": 30000}, {"amount": 25000, "status": "a_jour", "dueDate": "2026-10-09T00:00:00.000Z", "plannedAmount": 25000}, {"amount": 25000, "status": "a_jour", "dueDate": "2026-11-09T00:00:00.000Z", "plannedAmount": 25000}]	8b191ad7-18fd-4437-b7d8-3db5b98aa7a2	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:55:13.937	2026-09-09 18:55:16.591	1_mois	2	30000
923d6bd7-e755-4113-901a-411ef9a87c13	55000	5000	50000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-09T00:00:00.000Z", "plannedAmount": 5000}, {"amount": 25000, "status": "a_jour", "dueDate": "2026-10-09T00:00:00.000Z", "plannedAmount": 25000}, {"amount": 25000, "status": "a_jour", "dueDate": "2026-11-09T00:00:00.000Z", "plannedAmount": 25000}]	495b20cb-70bf-4c42-b661-a611903cf2d1	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:56:36.629	2026-09-09 18:56:39.203	1_mois	2	5000
c0ef2410-20d2-48da-8f08-f2c5e0633b21	55000	1000	54000	a_jour	[{"amount": 0, "status": "solde", "dueDate": "2026-09-11T00:00:00.000Z", "plannedAmount": 1000}, {"amount": 10800, "status": "a_jour", "dueDate": "2026-09-25T00:00:00.000Z", "plannedAmount": 10800}, {"amount": 10800, "status": "a_jour", "dueDate": "2026-10-09T00:00:00.000Z", "plannedAmount": 10800}, {"amount": 10800, "status": "a_jour", "dueDate": "2026-10-23T00:00:00.000Z", "plannedAmount": 10800}, {"amount": 10800, "status": "a_jour", "dueDate": "2026-11-06T00:00:00.000Z", "plannedAmount": 10800}, {"amount": 10800, "status": "a_jour", "dueDate": "2026-11-20T00:00:00.000Z", "plannedAmount": 10800}]	df747601-d6a5-4ce1-a069-4a7b8f4f1682	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-11 17:48:00.134	2026-09-11 17:48:02.523	2_semaines	5	1000
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Plan" (id, name, description, price, "maxCenters", "maxStudents", "isPopular", features, "createdAt", "updatedAt") FROM stdin;
7d89dbf4-4bd5-437b-b15e-7770e23ee2b3	STARTER	Idéal pour commencer	0	1	50	f	\N	2026-09-27 08:48:12.94	2026-09-27 08:48:12.94
8bb376a7-a469-4280-905f-a5b9412e7c65	PRO	Pour les structures en croissance	25000	3	200	t	null	2026-09-27 08:48:13.32	2026-09-27 09:44:00.771
24553018-8d8a-46a3-9776-1f3e962a923c	ENTERPRISE	Pour les grands réseaux	50000	10	1000	f	null	2026-09-27 08:48:13.495	2026-09-27 09:44:10.269
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Student" (id, matricule, "firstName", "lastName", contact, email, gender, "currentStatus", "currentLevel", "enrollmentDate", "progressionLogs", "classId", "organizationId", "createdAt", "updatedAt") FROM stdin;
4609b838-b2e3-401f-80ef-ab0a4739ccad	WM20269901	Awa	M3015279	0102030405	\N	Female	nouvel_inscrit	\N	2026-09-02 00:00:00	\N	5c616bba-401a-4803-acf6-bd4be14f6461	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:47:07.285	2026-09-02 20:47:07.285
058afd22-99af-4e26-b1e2-8f5e0c034a47	WM20263904	Awa	M3636016	0102030405	\N	Female	nouvel_inscrit	\N	2026-09-02 00:00:00	\N	3c811b5b-e7c5-4d63-bdb3-52599c6a439b	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 20:57:33.685	2026-09-02 20:57:33.685
57d52cdf-2994-4a08-8ab1-554611af01ad	WM20261362	Christian	SAMO	+237693820914	\N	Male	nouvel_inscrit	lvl_1	2026-09-02 00:00:00	\N	7f68e651-f3e0-4a55-a26d-b17d17048664	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 21:10:41.867	2026-09-02 21:10:41.867
f10d0bc6-a1d7-4029-9cc2-898fabeb2576	WM20262323	Awa	Traore	0102030405	\N	Female	abandonne	lvl_2	2026-01-15 00:00:00	[{"id": "806a7973-0897-4078-9a4c-2e8349a8cd4c", "date": "2026-09-02T21:30:47.244Z", "level": "lvl_2", "reason": "Raison familiale", "status": "abandonne", "recordedBy": "c5c34151-f217-4d02-bb46-a47d1c24fc26"}, {"id": "c9899c2f-9e36-4a48-93b4-9be49374f07d", "date": "2026-09-02T05:41:08.554Z", "level": "lvl_2", "reason": "Passage au niveau suivant", "status": "en_cours", "recordedBy": "5d13c81d-29a8-4f69-9651-d60cdcfd8f9a"}, {"id": "b22e5ada-49cb-475e-ace4-2055216211f8", "date": "2026-09-02T05:41:04.187Z", "level": "lvl_1", "reason": "Test", "status": "en_cours", "recordedBy": "5d13c81d-29a8-4f69-9651-d60cdcfd8f9a"}]	7f68e651-f3e0-4a55-a26d-b17d17048664	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:40:34.697	2026-09-02 21:30:47.246
9a7b1296-f527-4ba7-9e4e-cbe31e4e3d9f	WM20260414	Samuel	Salem	+237 655 84 74 15	\N	Male	nouvel_inscrit	lvl_1	2026-09-09 00:00:00	\N	5383ef6f-335d-4722-9783-720933e0fad1	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:40:26.811	2026-09-09 18:40:26.811
135c5721-24d2-4a6c-ab9c-1735e9b5153e	WM20261608	Yvan	Nfinda	+237 689 54 51 24	\N	Male	nouvel_inscrit	lvl_1	2026-09-09 00:00:00	\N	1514ffe8-dc12-4837-aa20-b541c501c9f4	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:42:13.184	2026-09-09 18:42:13.184
8b191ad7-18fd-4437-b7d8-3db5b98aa7a2	WM20262779	Larissa	Moguem	+237 682 45 87 45	\N	Female	nouvel_inscrit	lvl_1	2026-09-09 00:00:00	\N	5383ef6f-335d-4722-9783-720933e0fad1	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:55:13.324	2026-09-09 18:55:13.324
495b20cb-70bf-4c42-b661-a611903cf2d1	WM20263820	Samuela	Boudjou	+237 695 24 58 45	\N	Female	nouvel_inscrit	\N	2026-09-09 00:00:00	\N	b85e1dba-7e0e-444b-a351-a4752de20170	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:56:36.138	2026-09-09 18:56:36.138
df747601-d6a5-4ce1-a069-4a7b8f4f1682	WM20262654	Christospher	Nolan	555555555	\N	Male	abandonne	\N	2026-02-03 00:00:00	[{"id": "7f297e2b-fb25-4ac8-9cab-5a8d32bb2f19", "date": "2026-09-11T17:53:33.385Z", "level": null, "status": "abandonne", "recordedBy": "97378af7-a0f4-4cef-8717-5b710136de81"}, {"id": "674273d8-14fb-44ac-bd78-129dbbdc387e", "date": "2026-09-11T17:49:13.528Z", "level": null, "status": "suspendu", "recordedBy": "97378af7-a0f4-4cef-8717-5b710136de81"}]	b85e1dba-7e0e-444b-a351-a4752de20170	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-11 17:47:59.563	2026-09-11 17:53:33.387
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subscription" (id, "organizationId", status, "startDate", "endDate", "maxCenters", "maxStudents", "createdAt", "updatedAt", "planId") FROM stdin;
a20c6ba5-453b-4e55-ac15-48c85d6c79c0	0e83f155-6a19-4016-93e1-3687c95e6c9d	active	2026-09-26 23:33:03.568	2027-09-27 00:00:00	7	800	2026-09-26 23:33:03.57	2026-09-27 01:41:39.471	\N
9a56b690-27d8-4b49-9ad0-a2ea4575cbe5	3d2b5868-0cc4-41eb-aba6-31bf45197cea	active	2026-09-26 23:33:03.157	2026-09-27 00:00:00	3	200	2026-09-26 23:33:03.162	2026-09-27 10:02:17.726	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, matricule, "firstName", "lastName", email, "passwordHash", roles, status, "organizationId", "createdAt", "updatedAt", "avatarUrl", "isSuperAdmin") FROM stdin;
c5c34151-f217-4d02-bb46-a47d1c24fc26	DINS2609003	dony	samo	samodony@gmail.com	$2b$10$5tTFelqhxvqiZj9d/taLVe76EYOatZQgZ76B7RAztMtn20lYT27ku	{GESTIONNAIRE}	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 21:15:11.958	2026-09-27 09:35:30.847	data:image/png;base64,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	f
97378af7-a0f4-4cef-8717-5b710136de81	ORGB2609002	Chris	Donald	samo@gmail.com	$2b$10$86PZffHr.Ca2sBg3xvlBsusgTcyJGENfLX3oZNXPuoCKs4ArG4sDO	{GESTIONNAIRE}	inactif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:08:42.737	2026-09-27 09:35:36.721	\N	f
5d13c81d-29a8-4f69-9651-d60cdcfd8f9a	DINS2609001	Admin	Org A Test	admin@org-a.test	$2b$10$hI2fqPmH68/ZWM.gBMbFZOvvtN5uMI9l57jlldsZdBFGXytCaT70.	{ADMIN}	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 01:00:25.652	2026-09-17 02:58:17.327	\N	f
728647ce-1420-4e3a-9503-81ba77296b2f	ORGB2609001	Admin	Org B Test	admin@org-b.test	$2b$10$TE51ApDlJVKX9LA1J.DZq.t6i//tToeZivyUtzh70ierRdSgb75L2	{ADMIN}	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-02 01:00:28.613	2026-09-17 02:58:17.703	\N	f
98a8851b-38c7-44e3-94b1-91c30d882a58	DINS2609002	Marie	Kone	marie.kone@org-a.test	$2b$10$vSKHXV7vBahwDNbRGYA1x.WSFQyIDdCKvyvl7a9KmaoQjAc7PrHWK	{COMPTABLE}	actif	0e83f155-6a19-4016-93e1-3687c95e6c9d	2026-09-02 05:43:31.727	2026-09-17 02:58:17.865	\N	f
4937081b-630c-48e6-ba96-2b90b1429036	SA-ROOT	Super	Admin	superadmin@warriors.com	$2b$10$2ZbhhRk5TLDafciT8FaZOeq/EFAhWSbRCVAsiWeN4OXkOJqAR9QXC	{SUPER_ADMIN}	actif	\N	2026-09-26 23:33:02.409	2026-09-26 23:33:02.409	\N	t
a2cd910d-8026-49e6-a86d-93694764ac1b	ORGB2609003	Frédéric	Atemengue	fred@gmail.com	$2b$10$cYMGnZgshgnA4W0742C56uFU929i65yIydR56STsdqF6B6fqRxVxO	{GESTIONNAIRE,COMPTABLE}	actif	3d2b5868-0cc4-41eb-aba6-31bf45197cea	2026-09-09 18:27:30.257	2026-09-26 23:48:37.555	\N	f
c949b6e4-f145-4d62-886a-7230009d193c	SASONG	Alexandre	Song	alexsong@gmail.com	$2b$10$mBo9PKvPzXb98ZAfY35eOOAnGxfnT70HtaOTf8N1VBPa1ef4oFGdC	{SUPER_ADMIN}	actif	\N	2026-09-27 00:32:15.917	2026-09-27 00:32:15.917	\N	t
\.


--
-- Data for Name: _CenterUsers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_CenterUsers" ("A", "B") FROM stdin;
0bb9d628-4774-4d9e-964c-4e30a3ce22bf	c5c34151-f217-4d02-bb46-a47d1c24fc26
0d46dc93-bc59-4fd9-99e6-20899f0f9933	97378af7-a0f4-4cef-8717-5b710136de81
5dbead6c-1ad1-44cf-be70-90865a81d89a	a2cd910d-8026-49e6-a86d-93694764ac1b
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Center Center_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Center"
    ADD CONSTRAINT "Center_pkey" PRIMARY KEY (id);


--
-- Name: ClassGroup ClassGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassGroup"
    ADD CONSTRAINT "ClassGroup_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Formation Formation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Formation"
    ADD CONSTRAINT "Formation_pkey" PRIMARY KEY (id);


--
-- Name: Organization Organization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);


--
-- Name: PaymentSchedule PaymentSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentSchedule"
    ADD CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_resource_resourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_resource_resourceId_idx" ON public."AuditLog" USING btree (resource, "resourceId");


--
-- Name: Plan_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Plan_name_key" ON public."Plan" USING btree (name);


--
-- Name: Student_matricule_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Student_matricule_organizationId_key" ON public."Student" USING btree (matricule, "organizationId");


--
-- Name: Subscription_organizationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_organizationId_key" ON public."Subscription" USING btree ("organizationId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_matricule_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_matricule_key" ON public."User" USING btree (matricule);


--
-- Name: _CenterUsers_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_CenterUsers_AB_unique" ON public."_CenterUsers" USING btree ("A", "B");


--
-- Name: _CenterUsers_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_CenterUsers_B_index" ON public."_CenterUsers" USING btree ("B");


--
-- Name: Center Center_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Center"
    ADD CONSTRAINT "Center_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassGroup ClassGroup_centerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassGroup"
    ADD CONSTRAINT "ClassGroup_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES public."Center"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassGroup ClassGroup_formationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassGroup"
    ADD CONSTRAINT "ClassGroup_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES public."Formation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClassGroup ClassGroup_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClassGroup"
    ADD CONSTRAINT "ClassGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Expense Expense_centerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES public."Center"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Expense Expense_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Expense Expense_recordedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Formation Formation_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Formation"
    ADD CONSTRAINT "Formation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentSchedule PaymentSchedule_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentSchedule"
    ADD CONSTRAINT "PaymentSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentSchedule PaymentSchedule_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentSchedule"
    ADD CONSTRAINT "PaymentSchedule_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_recordedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payment Payment_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Student Student_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."ClassGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Student Student_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CenterUsers _CenterUsers_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_CenterUsers"
    ADD CONSTRAINT "_CenterUsers_A_fkey" FOREIGN KEY ("A") REFERENCES public."Center"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CenterUsers _CenterUsers_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_CenterUsers"
    ADD CONSTRAINT "_CenterUsers_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

--
-- Name: Center; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Center" ENABLE ROW LEVEL SECURITY;

--
-- Name: ClassGroup; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."ClassGroup" ENABLE ROW LEVEL SECURITY;

--
-- Name: Expense; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Expense" ENABLE ROW LEVEL SECURITY;

--
-- Name: Formation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Formation" ENABLE ROW LEVEL SECURITY;

--
-- Name: Organization; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Organization" ENABLE ROW LEVEL SECURITY;

--
-- Name: Payment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Payment" ENABLE ROW LEVEL SECURITY;

--
-- Name: PaymentSchedule; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."PaymentSchedule" ENABLE ROW LEVEL SECURITY;

--
-- Name: Plan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Plan" ENABLE ROW LEVEL SECURITY;

--
-- Name: Student; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Student" ENABLE ROW LEVEL SECURITY;

--
-- Name: Subscription; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."Subscription" ENABLE ROW LEVEL SECURITY;

--
-- Name: User; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

--
-- Name: _CenterUsers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."_CenterUsers" ENABLE ROW LEVEL SECURITY;

--
-- Name: User auth_read_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_read_user ON public."User" FOR SELECT TO app_auth USING (true);


--
-- Name: AuditLog tenant_auditlog_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_auditlog_insert ON public."AuditLog" FOR INSERT TO app_user WITH CHECK (true);


--
-- Name: Center tenant_isolation_center; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_center ON public."Center" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: _CenterUsers tenant_isolation_centerusers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_centerusers ON public."_CenterUsers" TO app_user USING ((EXISTS ( SELECT 1
   FROM public."Center"
  WHERE (("Center".id = "_CenterUsers"."A") AND ("Center"."organizationId" = current_setting('app.org_id'::text, true)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public."Center"
  WHERE (("Center".id = "_CenterUsers"."A") AND ("Center"."organizationId" = current_setting('app.org_id'::text, true))))));


--
-- Name: ClassGroup tenant_isolation_classgroup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_classgroup ON public."ClassGroup" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: Expense tenant_isolation_expense; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_expense ON public."Expense" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: Formation tenant_isolation_formation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_formation ON public."Formation" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: Organization tenant_isolation_organization; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_organization ON public."Organization" TO app_user USING ((id = current_setting('app.org_id'::text, true))) WITH CHECK ((id = current_setting('app.org_id'::text, true)));


--
-- Name: Payment tenant_isolation_payment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_payment ON public."Payment" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: PaymentSchedule tenant_isolation_paymentschedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_paymentschedule ON public."PaymentSchedule" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: Student tenant_isolation_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_student ON public."Student" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: Subscription tenant_isolation_subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_subscription ON public."Subscription" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- Name: User tenant_isolation_user; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tenant_isolation_user ON public."User" TO app_user USING (("organizationId" = current_setting('app.org_id'::text, true))) WITH CHECK (("organizationId" = current_setting('app.org_id'::text, true)));


--
-- PostgreSQL database dump complete
--

\unrestrict 7PHocPyONATODcmAxfyK9y9osfh6ihPvWAXic5kzKQzJv5RFprSKlOUmuRo7FLS

