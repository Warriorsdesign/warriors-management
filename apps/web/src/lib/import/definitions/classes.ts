import type { ImportRowIssue } from '@/lib/api/types';
import { normalizeKey, optionalDate, requiredInt, requiredText } from '../cells';
import { indexByName, RowReader } from '../row';
import type { ColumnDef, ImportDefinition, PreparedRow } from '../types';
import { chunk } from '../chunk';

export interface ClassImportRow {
  name: string;
  formationId: string;
  centerId: string;
  capacity: number;
  startDate?: Date;
  endDate?: Date;
}

// Colonnes dérivées du modèle ClassGroup et de createClassSchema (lib/validation/classes.ts).
// Formation et centre sont désignés par leur NOM : ils sont résolus côté serveur parmi les
// données de l'organisation connectée uniquement - aucun identifiant n'est accepté du fichier.
const columns: ColumnDef[] = [
  { key: 'name', label: 'Nom de la classe', required: true, aliases: ['Nom', 'Classe'], help: 'Nom de la classe (unique par centre).', format: 'text' },
  { key: 'formation', label: 'Formation', required: true, help: 'Nom exact d\'une formation existante dans votre organisation.', list: 'formations' },
  { key: 'center', label: 'Centre', required: true, help: 'Nom exact d\'un centre existant dans votre organisation.', list: 'centers' },
  { key: 'capacity', label: 'Capacité', required: true, aliases: ['Capacite', 'Places'], help: "Nombre maximum d'étudiants (entier supérieur à 0).", format: 'number' },
  { key: 'startDate', label: 'Date de début', required: false, aliases: ['Début'], help: 'Format jj/mm/aaaa.', format: 'date' },
  { key: 'endDate', label: 'Date de fin', required: false, aliases: ['Fin'], help: 'Format jj/mm/aaaa, postérieure à la date de début.', format: 'date' },
];

export const classesImport: ImportDefinition<ClassImportRow> = {
  type: 'classes',
  label: 'Classes',
  resource: 'classes',
  columns,
  instructions: [
    'Les formations et centres référencés doivent déjà exister : créez-les ou importez les formations avant les classes.',
    'Une classe portant le même nom dans le même centre est signalée comme doublon.',
  ],
  examples: [
    { name: 'Informatique - Promo Janvier', formation: 'Formation en Informatique', center: 'Centre Akwa', capacity: 30, startDate: '06/01/2026', endDate: '18/12/2026' },
    { name: 'Comptabilité - Soir', formation: 'Formation en Comptabilité', center: 'Centre Yaoundé', capacity: 25, startDate: '02/02/2026', endDate: '' },
  ],

  async loadTemplateLists({ tx, orgId, scope }) {
    const [formations, centers] = await Promise.all([
      tx.formation.findMany({ where: { organizationId: orgId, ...scope.formation() }, select: { name: true }, orderBy: { name: 'asc' } }),
      tx.center.findMany({ where: { organizationId: orgId, ...scope.center() }, select: { name: true }, orderBy: { name: 'asc' } }),
    ]);
    return { formations: formations.map((f) => f.name), centers: centers.map((c) => c.name) };
  },

  async validate(rows, { tx, orgId, scope }) {
    const issues: ImportRowIssue[] = [];
    const valid: PreparedRow<ClassImportRow>[] = [];

    // Un centre ou une formation hors du périmètre de l'utilisateur est traité comme introuvable.
    const [formations, centers, existingClasses] = await Promise.all([
      tx.formation.findMany({ where: { organizationId: orgId, ...scope.formation() }, select: { id: true, name: true, centers: { select: { id: true } } } }),
      tx.center.findMany({ where: { organizationId: orgId, ...scope.center() }, select: { id: true, name: true } }),
      tx.classGroup.findMany({ where: { organizationId: orgId, ...scope.classGroup() }, select: { name: true, centerId: true } }),
    ]);
    const formationsByName = indexByName(formations, (f) => f.name, normalizeKey);
    const centersByName = indexByName(centers, (c) => c.name, normalizeKey);
    const existingKeys = new Set(existingClasses.map((c) => `${c.centerId}|${normalizeKey(c.name)}`));
    const seen = new Map<string, number>();

    for (const raw of rows) {
      const r = new RowReader(raw, columns, issues);
      const name = r.read('name', (v) => requiredText(v, 150));
      const formationName = r.read('formation', (v) => requiredText(v));
      const centerName = r.read('center', (v) => requiredText(v));
      const capacity = r.read('capacity', (v) => requiredInt(v, { min: 1, max: 10000 }));
      const startDate = r.read('startDate', optionalDate);
      const endDate = r.read('endDate', optionalDate);

      let formationId: string | undefined;
      let formationCenterIds: string[] = [];
      if (formationName) {
        const matches = formationsByName.get(normalizeKey(formationName)) ?? [];
        if (matches.length === 0) r.error(`Formation "${formationName}" introuvable dans votre organisation.`, 'formation');
        else if (matches.length > 1) r.error(`Plusieurs formations portent le nom "${formationName}" : renommez-les pour lever l'ambiguïté.`, 'formation');
        else {
          formationId = matches[0].id;
          formationCenterIds = matches[0].centers.map((c) => c.id);
        }
      }

      let centerId: string | undefined;
      if (centerName) {
        const matches = centersByName.get(normalizeKey(centerName)) ?? [];
        if (matches.length === 0) r.error(`Centre "${centerName}" introuvable dans votre organisation.`, 'center');
        else if (matches.length > 1) r.error(`Plusieurs centres portent le nom "${centerName}" : renommez-les pour lever l'ambiguïté.`, 'center');
        else centerId = matches[0].id;
      }

      // Une classe ne s'ouvre que dans un centre où sa formation est proposée.
      if (formationId && centerId && !formationCenterIds.includes(centerId)) {
        r.error(`La formation "${formationName}" n'est pas proposée dans le centre "${centerName}".`, 'center');
      }

      if (startDate && endDate && endDate < startDate) {
        r.error('La date de fin doit être postérieure à la date de début.', 'endDate');
      }

      if (name && centerId) {
        const key = `${centerId}|${normalizeKey(name)}`;
        if (existingKeys.has(key)) r.duplicate(`La classe "${name}" existe déjà dans le centre "${centerName}".`, 'name');
        else if (seen.has(key)) r.duplicate(`Doublon dans le fichier (déjà présente ligne ${seen.get(key)}).`, 'name');
        else seen.set(key, raw.row);
      }

      if (!r.hasErrors && name && formationId && centerId && capacity !== undefined) {
        valid.push({ row: raw.row, data: { name, formationId, centerId, capacity, startDate, endDate } });
      }
    }

    return { valid, issues, fileErrors: [], warnings: [] };
  },

  async commit(rows, { tx, orgId }) {
    for (const batch of chunk(rows, 500)) {
      await tx.classGroup.createMany({
        data: batch.map(({ data }) => ({ ...data, status: 'ouverte', organizationId: orgId })),
      });
    }
    return rows.length;
  },
};
