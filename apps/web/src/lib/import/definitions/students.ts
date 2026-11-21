import { randomUUID } from 'crypto';
import { and, asc, count, eq, inArray, notInArray } from 'drizzle-orm';
import { classGroups, centers as centersTable, formations, paymentSchedules, payments as paymentsTable, students as studentsTable, subscriptions, plans } from '@/lib/db/schema';
import type { ImportRowIssue } from '@/lib/api/types';
import type { PaymentMethod, StudentStatus } from '@/lib/types/enums';
import {
  applyPaymentToInstallments,
  buildInstallmentPlan,
  computeScheduleTotals,
  type IntervalType,
} from '@/lib/business/paymentSchedule';
import { generateStudentMatriculesBatch } from '@/lib/business/matricule';
import { INACTIVE_STATUSES } from '@/lib/business/classStatus';
import { quotaMessage } from '@/lib/business/studentQuota';
import {
  CellError,
  choiceLabels,
  normalizeKey,
  optionalAmount,
  optionalChoice,
  optionalInt,
  optionalText,
  requiredDate,
  requiredText,
} from '../cells';
import { indexByName, RowReader } from '../row';
import type { ColumnDef, ImportDefinition, PreparedRow } from '../types';
import { chunk } from '../chunk';

export interface StudentImportRow {
  lastName: string;
  firstName: string;
  gender: 'Male' | 'Female';
  contact: string;
  email?: string;
  classId: string;
  totalCost: number;
  currentLevel?: string;
  enrollmentDate: Date;
  matricule?: string;
  currentStatus: StudentStatus;
  registrationFee: number;
  paymentMethod: PaymentMethod;
  installmentsCount: number;
  installmentInterval: IntervalType;
  alreadyPaid: number;
}

const GENDER_CHOICES = { Male: ['M', 'Masculin', 'Homme', 'H', 'Garçon'], Female: ['F', 'Féminin', 'Femme', 'Fille'] } as const;

// Libellés alignés sur ceux de l'application (lib/validation/students.ts pour les codes).
const STATUS_CHOICES = {
  nouvel_inscrit: ['Nouvel inscrit'],
  en_cours: ['En cours'],
  reinscrit: ['Réinscrit'],
  niveau_terminee: ['Niveau terminé'],
  formation_terminee: ['Formation terminée', 'Diplômé'],
  suspendu: ['Suspendu'],
  abandonne: ['Abandonné', 'Abandon'],
} as const satisfies Record<StudentStatus, readonly string[]>;

const PAYMENT_METHOD_CHOICES = {
  'Espèces': ['Espèces', 'Especes', 'Cash'],
  'Mobile Money': ['Mobile Money', 'MoMo', 'Orange Money', 'OM', 'MTN MoMo'],
  'Virement': ['Virement'],
  'Bank Transfer': ['Virement bancaire', 'Bank Transfer'],
  'Chèque': ['Chèque', 'Cheque'],
} as const satisfies Record<PaymentMethod, readonly string[]>;

const INTERVAL_CHOICES = {
  '1_semaine': ['1 semaine'],
  '2_semaines': ['2 semaines'],
  '3_semaines': ['3 semaines'],
  '1_mois': ['1 mois', 'Mensuel'],
  '2_mois': ['2 mois'],
  '3_mois': ['3 mois', 'Trimestriel'],
  '4_mois': ['4 mois'],
} as const satisfies Record<IntervalType, readonly string[]>;

// Colonnes dérivées du modèle Student + PaymentSchedule et de createStudentSchema. La classe
// (et le centre, pour lever une ambiguïté de nom) sont résolus côté serveur dans l'organisation.
const columns: ColumnDef[] = [
  { key: 'lastName', label: 'Nom', required: true, help: "Nom de famille de l'étudiant.", format: 'text' },
  { key: 'firstName', label: 'Prénom', required: true, aliases: ['Prenoms', 'Prénoms'], help: "Prénom(s) de l'étudiant.", format: 'text' },
  { key: 'gender', label: 'Genre', required: true, aliases: ['Sexe'], help: 'M ou F.', list: 'genders' },
  { key: 'contact', label: 'Contact', required: true, aliases: ['Téléphone', 'Telephone', 'Tel'], help: 'Numéro de téléphone (ex : 699 11 22 33).', format: 'text' },
  { key: 'email', label: 'Email', required: false, aliases: ['E-mail', 'Adresse email'], help: 'Adresse email (facultative).', format: 'text' },
  { key: 'className', label: 'Classe', required: true, help: "Nom exact d'une classe existante dans votre organisation.", list: 'classes' },
  { key: 'centerName', label: 'Centre', required: false, help: 'Facultatif : à renseigner si deux centres ont une classe du même nom.', list: 'centers' },
  { key: 'level', label: 'Niveau', required: false, help: 'Nom du niveau (ex : Niveau 1) si la formation de la classe est découpée en niveaux.', format: 'text' },
  { key: 'enrollmentDate', label: "Date d'inscription", required: true, aliases: ['Date inscription', 'Inscrit le'], help: 'Format jj/mm/aaaa. Les dates passées sont acceptées.', format: 'date' },
  { key: 'matricule', label: 'Matricule', required: false, help: 'Facultatif : conservez votre matricule existant. Vide = généré automatiquement (WMAAAAxxxx).', format: 'text' },
  { key: 'status', label: 'Statut', required: false, help: `Par défaut : Nouvel inscrit. Valeurs : ${choiceLabels(STATUS_CHOICES).join(', ')}.`, list: 'statuses' },
  { key: 'registrationFee', label: "Frais d'inscription payés (FCFA)", required: false, aliases: ["Frais d'inscription", 'Frais inscription'], help: "Montant des frais d'inscription déjà réglés. Par défaut : 0.", format: 'number' },
  { key: 'paymentMethod', label: 'Mode de paiement', required: false, help: `Mode de paiement des sommes déjà versées. Par défaut : Espèces.`, list: 'paymentMethods' },
  { key: 'installmentsCount', label: "Nombre d'échéances", required: false, aliases: ['Echéances', 'Nombre echeances'], help: 'Nombre de mensualités pour le reste à payer. Par défaut : 0 (paiement libre).', format: 'number' },
  { key: 'installmentInterval', label: 'Intervalle des échéances', required: false, aliases: ['Intervalle'], help: 'Par défaut : 1 mois.', list: 'intervals' },
  { key: 'alreadyPaid', label: 'Montant déjà versé hors inscription (FCFA)', required: false, aliases: ['Montant déjà versé', 'Déjà versé', 'Deja paye'], help: "Scolarité déjà réglée en dehors des frais d'inscription (reprise de l'historique). Évite que l'étudiant apparaisse en retard de paiement. Par défaut : 0.", format: 'number' },
];

/** Clé d'identité pour la détection de doublons : nom + prénom + contact (chiffres seuls). */
function identityKey(lastName: string, firstName: string, contact: string): string {
  let digits = contact.replace(/\D/g, '');
  if (digits.length > 9 && digits.startsWith('237')) digits = digits.slice(3);
  return `${normalizeKey(lastName)}|${normalizeKey(firstName)}|${digits}`;
}

function levelsOf(value: unknown): { id: string; name: string }[] {
  return Array.isArray(value) ? (value as unknown as { id: string; name: string }[]) : [];
}

export const studentsImport: ImportDefinition<StudentImportRow> = {
  type: 'students',
  label: 'Étudiants',
  resource: 'students',
  columns,
  instructions: [
    'Chaque étudiant doit être rattaché à une classe existante : créez ou importez vos classes avant vos étudiants.',
    "Pour chaque étudiant, un échéancier est créé à partir du coût de la formation de sa classe, comme pour une inscription manuelle.",
    "Les frais d'inscription payés et le montant déjà versé sont enregistrés comme paiements à la date d'inscription.",
    'Un étudiant déjà présent (même matricule, ou même nom + prénom + contact) est signalé comme doublon : vous pouvez ré-importer un fichier corrigé sans créer de doublons.',
    "L'import est refusé s'il ferait dépasser le nombre d'étudiants autorisé par votre abonnement.",
  ],
  examples: [
    { lastName: 'Mbarga', firstName: 'Jean-Paul', gender: 'M', contact: '699 11 22 33', email: 'jp.mbarga@example.cm', className: 'Informatique - Promo Janvier', centerName: 'Centre Akwa', level: 'Niveau 1', enrollmentDate: '06/01/2026', matricule: '', status: 'En cours', registrationFee: 25000, paymentMethod: 'Mobile Money', installmentsCount: 10, installmentInterval: '1 mois', alreadyPaid: 85000 },
    { lastName: 'Ngo Bassa', firstName: 'Aïcha', gender: 'F', contact: '677 45 67 89', email: '', className: 'Comptabilité - Soir', centerName: '', level: '', enrollmentDate: '02/02/2026', matricule: 'CPT-2026-014', status: 'Nouvel inscrit', registrationFee: 0, paymentMethod: 'Espèces', installmentsCount: 0, installmentInterval: '', alreadyPaid: 0 },
  ],

  async loadTemplateLists({ tx, orgId, scope }) {
    const [classes, centers] = await Promise.all([
      tx.select({ name: classGroups.name }).from(classGroups).where(and(
        eq(classGroups.organizationId, orgId),
        ...(scope.centerIds ? [inArray(classGroups.centerId, scope.centerIds)] : []),
      )).orderBy(asc(classGroups.name)),
      tx.select({ name: centersTable.name }).from(centersTable).where(and(
        eq(centersTable.organizationId, orgId),
        ...(scope.centerIds ? [inArray(centersTable.id, scope.centerIds)] : []),
      )).orderBy(asc(centersTable.name)),
    ]);
    return {
      genders: ['M', 'F'],
      classes: Array.from(new Set(classes.map((c) => c.name))),
      centers: centers.map((c) => c.name),
      statuses: choiceLabels(STATUS_CHOICES),
      paymentMethods: choiceLabels(PAYMENT_METHOD_CHOICES),
      intervals: choiceLabels(INTERVAL_CHOICES),
    };
  },

  async validate(rows, { tx, orgId, scope, perms }) {
    const canCollect = perms.can('students.collect', 'write') || perms.can('payments', 'write');
    const issues: ImportRowIssue[] = [];
    const valid: PreparedRow<StudentImportRow>[] = [];

    const [classes, classCounts, existingStudents, subscription] = await Promise.all([
      // Seules les classes du périmètre de l'utilisateur sont utilisables comme référence.
      tx.select({
        id: classGroups.id, name: classGroups.name, capacity: classGroups.capacity, status: classGroups.status,
        centerName: centersTable.name, totalCost: formations.totalCost,
        hasLevels: formations.hasLevels, levels: formations.levels,
      }).from(classGroups)
        .innerJoin(centersTable, eq(centersTable.id, classGroups.centerId))
        .innerJoin(formations, eq(formations.id, classGroups.formationId))
        .where(and(
          eq(classGroups.organizationId, orgId),
          ...(scope.centerIds ? [inArray(classGroups.centerId, scope.centerIds)] : []),
        )).then((rows) => rows.map(({ centerName, totalCost, hasLevels, levels, ...row }) => ({
          ...row,
          center: { name: centerName },
          formation: { totalCost, hasLevels, levels },
        }))),
      tx.select({ classId: studentsTable.classId, count: count() }).from(studentsTable)
        .where(and(
          eq(studentsTable.organizationId, orgId),
          notInArray(studentsTable.currentStatus, INACTIVE_STATUSES),
        )).groupBy(studentsTable.classId),
      // Toute l'organisation : les matricules sont uniques par organisation et le quota est global.
      tx.select({
        matricule: studentsTable.matricule, firstName: studentsTable.firstName, lastName: studentsTable.lastName,
        contact: studentsTable.contact, classId: studentsTable.classId, currentStatus: studentsTable.currentStatus,
      }).from(studentsTable).where(eq(studentsTable.organizationId, orgId)),
      tx.select({ maxStudents: subscriptions.maxStudents, planName: plans.name }).from(subscriptions)
        .leftJoin(plans, eq(plans.id, subscriptions.planId))
        .where(eq(subscriptions.organizationId, orgId)).limit(1).then(([row]) => row ?? null),
    ]);

    const classesByName = indexByName(classes, (c) => c.name, normalizeKey);
    // Même règle que POST /api/students (assertClassHasRoom) : seuls les étudiants actifs occupent une place.
    const occupancy = new Map(classCounts.map((c) => [c.classId, Number(c.count)]));
    const existingMatricules = new Set(existingStudents.map((s) => normalizeKey(s.matricule)));
    // Doublons d'identité recherchés dans le périmètre uniquement, pour ne pas révéler les
    // étudiants des autres centres.
    const scopedClassIds = new Set(classes.map((c) => c.id));
    const existingIdentities = new Set(
      existingStudents.filter((s) => scopedClassIds.has(s.classId)).map((s) => identityKey(s.lastName, s.firstName, s.contact))
    );
    const seenMatricules = new Map<string, number>();
    const seenIdentities = new Map<string, number>();

    for (const raw of rows) {
      const r = new RowReader(raw, columns, issues);
      const lastName = r.read('lastName', (v) => requiredText(v, 100));
      const firstName = r.read('firstName', (v) => requiredText(v, 100));
      const gender = r.read('gender', (v) => {
        const g = optionalChoice(v, GENDER_CHOICES);
        if (!g) throw new CellError('Champ obligatoire vide.');
        return g;
      });
      const contact = r.read('contact', (v) => requiredText(v, 50));
      const email = r.read('email', (v) => {
        const text = optionalText(v, 150);
        if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new CellError(`Email "${text}" invalide.`);
        return text;
      });
      const className = r.read('className', (v) => requiredText(v, 150));
      const centerName = r.read('centerName', (v) => optionalText(v, 150));
      const levelName = r.read('level', (v) => optionalText(v, 100));
      const enrollmentDate = r.read('enrollmentDate', requiredDate);
      const matricule = r.read('matricule', (v) => optionalText(v, 50));
      const currentStatus = r.read('status', (v) => optionalChoice(v, STATUS_CHOICES)) ?? 'nouvel_inscrit';
      const registrationFee = r.read('registrationFee', optionalAmount) ?? 0;
      const paymentMethod = r.read('paymentMethod', (v) => optionalChoice(v, PAYMENT_METHOD_CHOICES)) ?? 'Espèces';
      const installmentsCount = r.read('installmentsCount', (v) => optionalInt(v, { min: 0, max: 60 })) ?? 0;
      const installmentInterval = r.read('installmentInterval', (v) => optionalChoice(v, INTERVAL_CHOICES)) ?? '1_mois';
      const alreadyPaid = r.read('alreadyPaid', optionalAmount) ?? 0;

      // Résolution de la classe (et donc de la formation) dans l'organisation uniquement.
      let classGroup: (typeof classes)[number] | undefined;
      if (className) {
        let matches = classesByName.get(normalizeKey(className)) ?? [];
        if (centerName) matches = matches.filter((c) => normalizeKey(c.center.name) === normalizeKey(centerName));
        if (matches.length === 0) {
          r.error(
            centerName
              ? `Classe "${className}" introuvable dans le centre "${centerName}".`
              : `Classe "${className}" introuvable dans votre organisation.`,
            'className'
          );
        } else if (matches.length > 1) {
          r.error(`Plusieurs classes portent le nom "${className}" : précisez le centre.`, 'centerName');
        } else {
          classGroup = matches[0];
        }
      }

      let currentLevel: string | undefined;
      if (classGroup && levelName) {
        const levels = levelsOf(classGroup.formation.levels);
        if (!classGroup.formation.hasLevels || levels.length === 0) {
          r.error("La formation de cette classe n'est pas découpée en niveaux : laissez la colonne vide.", 'level');
        } else {
          const key = normalizeKey(levelName);
          const level = levels.find((l) => normalizeKey(l.name) === key || normalizeKey(l.id) === key || l.id === `lvl_${key}`);
          if (!level) r.error(`Niveau "${levelName}" inconnu. Niveaux possibles : ${levels.map((l) => l.name).join(', ')}.`, 'level');
          else currentLevel = level.id;
        }
      }

      // Reprise d'un historique de paiements = encaissement : réservé aux rôles qui peuvent encaisser.
      if (alreadyPaid > 0 && !canCollect) {
        r.error("Votre rôle ne permet pas d'enregistrer des sommes déjà versées : laissez la colonne vide.", 'alreadyPaid');
      }

      if (classGroup && registrationFee + alreadyPaid > classGroup.formation.totalCost) {
        r.error(
          `Les sommes versées (${registrationFee + alreadyPaid} FCFA) dépassent le coût de la formation (${classGroup.formation.totalCost} FCFA).`,
          alreadyPaid > 0 ? 'alreadyPaid' : 'registrationFee'
        );
      }

      // Doublons : matricule (unique en base) puis identité.
      if (matricule) {
        const key = normalizeKey(matricule);
        if (existingMatricules.has(key)) r.duplicate(`Le matricule "${matricule}" est déjà attribué.`, 'matricule');
        else if (seenMatricules.has(key)) r.duplicate(`Matricule en double dans le fichier (ligne ${seenMatricules.get(key)}).`, 'matricule');
        else seenMatricules.set(key, raw.row);
      }
      if (lastName && firstName && contact) {
        const key = identityKey(lastName, firstName, contact);
        if (existingIdentities.has(key)) r.duplicate(`${firstName} ${lastName} (${contact}) est déjà inscrit(e).`);
        else if (seenIdentities.has(key)) r.duplicate(`Étudiant en double dans le fichier (ligne ${seenIdentities.get(key)}).`);
        else seenIdentities.set(key, raw.row);
      }

      if (r.hasErrors || !classGroup || !lastName || !firstName || !gender || !contact || !enrollmentDate) continue;

      if (classGroup.status === 'cloturee') {
        r.error(`La classe "${classGroup.name}" est clôturée : elle n'accepte plus d'étudiants.`, 'className');
        continue;
      }
      // Capacité : évaluée dans l'ordre du fichier, sur les seules lignes par ailleurs valides.
      // Un étudiant importé directement comme abandonné ou diplômé n'occupe pas de place.
      const takesSeat = !INACTIVE_STATUSES.includes(currentStatus);
      const occupied = occupancy.get(classGroup.id) ?? 0;
      if (takesSeat && occupied >= classGroup.capacity) {
        r.error(`La classe "${classGroup.name}" est complète (capacité de ${classGroup.capacity} atteinte).`, 'className');
        continue;
      }
      if (takesSeat) occupancy.set(classGroup.id, occupied + 1);

      valid.push({
        row: raw.row,
        data: {
          lastName, firstName, gender, contact, email, classId: classGroup.id,
          totalCost: classGroup.formation.totalCost, currentLevel, enrollmentDate, matricule,
          currentStatus, registrationFee, paymentMethod, installmentsCount, installmentInterval, alreadyPaid,
        },
      });
    }

    const fileErrors: string[] = [];
    if (!subscription) {
      fileErrors.push("Abonnement introuvable : contactez l'administrateur de Warriors Management.");
    } else if (subscription.maxStudents !== -1) {
      // Quota : seuls les étudiants actifs comptent, déjà en base comme dans le fichier.
      const activeExisting = existingStudents.filter((s) => !INACTIVE_STATUSES.includes(s.currentStatus)).length;
      const activeInFile = valid.filter((v) => !INACTIVE_STATUSES.includes(v.data.currentStatus)).length;
      if (activeExisting + activeInFile > subscription.maxStudents) {
        const remaining = Math.max(0, subscription.maxStudents - activeExisting);
        fileErrors.push(
          quotaMessage(subscription.planName, subscription.maxStudents, ` : vous pouvez encore en ajouter ${remaining}, le fichier en contient ${activeInFile} actif(s). Réduisez le fichier`)
        );
      }
    }

    return { valid, issues, fileErrors, warnings: [] };
  },

  async commit(rows, { tx, orgId, userId }) {
    const existing = await tx.select({ matricule: studentsTable.matricule }).from(studentsTable)
      .where(eq(studentsTable.organizationId, orgId));
    const taken = new Set(existing.map((s) => s.matricule));
    rows.forEach(({ data }) => data.matricule && taken.add(data.matricule));
    const generated = generateStudentMatriculesBatch(taken, rows.filter(({ data }) => !data.matricule).length);

    const now = new Date();
    const studentRows: (typeof studentsTable.$inferInsert)[] = [];
    const scheduleRows: (typeof paymentSchedules.$inferInsert)[] = [];
    const paymentRows: (typeof paymentsTable.$inferInsert)[] = [];

    for (const { data } of rows) {
      const studentId = randomUUID();
      studentRows.push({
        id: studentId,
        matricule: data.matricule ?? generated.pop()!,
        firstName: data.firstName,
        lastName: data.lastName,
        contact: data.contact,
        email: data.email,
        gender: data.gender,
        currentStatus: data.currentStatus,
        currentLevel: data.currentLevel,
        enrollmentDate: data.enrollmentDate,
        classId: data.classId,
        organizationId: orgId,
      });

      // Paiements repris à la date d'inscription (et non à la date d'import) pour ne pas
      // gonfler artificiellement les encaissements du mois courant dans les rapports.
      const studentPayments: (typeof paymentsTable.$inferInsert)[] = [];
      if (data.registrationFee > 0) {
        studentPayments.push({
          studentId, organizationId: orgId, amount: data.registrationFee, date: data.enrollmentDate,
          method: data.paymentMethod, motif: "Frais d'inscription", recordedById: userId,
        });
      }
      if (data.alreadyPaid > 0) {
        studentPayments.push({
          studentId, organizationId: orgId, amount: data.alreadyPaid, date: data.enrollmentDate,
          method: data.paymentMethod, motif: 'Reprise de solde (import)', recordedById: userId,
        });
      }
      paymentRows.push(...studentPayments);

      // Même calcul que rebuildScheduleForStudent (plan de base + rejeu des paiements), fait en
      // mémoire pour éviter 3 requêtes par étudiant.
      let installments = buildInstallmentPlan(
        {
          totalCost: data.totalCost,
          registrationFee: data.registrationFee,
          installmentsCount: data.installmentsCount,
          installmentInterval: data.installmentInterval,
          enrollmentDate: data.enrollmentDate,
        },
        now
      );
      for (const payment of studentPayments) {
        installments = applyPaymentToInstallments(installments, payment.amount, now);
      }
      const totals = computeScheduleTotals(installments, data.totalCost);
      scheduleRows.push({
        studentId,
        organizationId: orgId,
        totalAmount: data.totalCost,
        paidAmount: totals.paidAmount,
        remainingAmount: totals.remainingAmount,
        status: totals.status,
        registrationFee: data.registrationFee,
        installmentsCount: data.installmentsCount,
        installmentInterval: data.installmentInterval,
        installments,
      });
    }

    for (const batch of chunk(studentRows, 500)) await tx.insert(studentsTable).values(batch);
    for (const batch of chunk(scheduleRows, 500)) await tx.insert(paymentSchedules).values(batch);
    for (const batch of chunk(paymentRows, 500)) await tx.insert(paymentsTable).values(batch);

    return rows.length;
  },
};
