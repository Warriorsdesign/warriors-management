import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { regenerateLevels } from '@/lib/business/formations';
import type { ImportRowIssue } from '@/lib/api/types';
import { normalizeKey, optionalChoice, optionalInt, optionalText, requiredAmount, requiredInt, requiredText } from '../cells';
import { indexByName, RowReader } from '../row';
import type { ColumnDef, ImportDefinition, PreparedRow } from '../types';
import { chunk } from '../chunk';

export interface FormationImportRow {
  name: string;
  duration: number;
  totalCost: number;
  levelCount: number;
  status: 'actif' | 'inactif';
  centerIds: string[];
}

const STATUS_CHOICES = { actif: ['Actif'], inactif: ['Inactif'] } as const;
const MAX_LEVELS = 20;

// Colonnes dérivées du modèle Formation et de createFormationSchema (lib/validation/formations.ts).
const columns: ColumnDef[] = [
  { key: 'name', label: 'Nom de la formation', required: true, aliases: ['Nom', 'Formation'], help: 'Nom unique de la formation dans votre organisation.', format: 'text' },
  { key: 'duration', label: 'Durée (mois)', required: true, aliases: ['Durée', 'Duree mois'], help: 'Durée totale en mois (nombre entier supérieur à 0).', format: 'number' },
  { key: 'totalCost', label: 'Coût total (FCFA)', required: true, aliases: ['Coût total', 'Cout', 'Prix'], help: 'Coût total de la formation en FCFA, sans décimales.', format: 'number' },
  { key: 'levelCount', label: 'Nombre de niveaux', required: false, aliases: ['Niveaux'], help: `Laisser vide ou 0 si la formation n'est pas découpée en niveaux (${MAX_LEVELS} maximum). Les niveaux sont nommés "Niveau 1", "Niveau 2"... et renommables ensuite.`, format: 'number' },
  { key: 'status', label: 'Statut', required: false, help: 'Actif ou Inactif. Par défaut : Actif.', list: 'status' },
  // Obligatoire par ligne (au moins un centre), sauf si un seul centre est accessible : il est alors utilisé par défaut.
  { key: 'centers', label: 'Centres', required: false, aliases: ['Centre'], help: "Centre(s) où la formation est proposée, séparés par des virgules (ex : Centre Akwa, Centre Yaoundé). Obligatoire, sauf si vous n'avez accès qu'à un seul centre (utilisé par défaut).", list: 'centers', format: 'text' },
];

export const formationsImport: ImportDefinition<FormationImportRow> = {
  type: 'formations',
  label: 'Formations',
  resource: 'formations',
  columns,
  instructions: [
    'Une formation déjà existante (même nom) est signalée comme doublon et ne sera pas recréée.',
    'Importez les formations avant les classes : chaque classe doit référencer une formation existante.',
  ],
  examples: [
    { name: 'Formation en Informatique', duration: 12, totalCost: 450000, levelCount: 2, status: 'Actif', centers: 'Centre Akwa, Centre Yaoundé' },
    { name: 'Formation en Comptabilité', duration: 10, totalCost: 350000, levelCount: 0, status: 'Actif', centers: 'Centre Akwa' },
    { name: 'Formation en Marketing Digital', duration: 6, totalCost: 250000, levelCount: '', status: 'Actif', centers: 'Centre Bafoussam' },
  ],

  async loadTemplateLists({ tx, orgId, scope }) {
    const centers = await tx.center.findMany({ where: { organizationId: orgId, ...scope.center() }, select: { name: true }, orderBy: { name: 'asc' } });
    return { status: ['Actif', 'Inactif'], centers: centers.map((c) => c.name) };
  },

  async validate(rows, { tx, orgId, scope }) {
    const issues: ImportRowIssue[] = [];
    const valid: PreparedRow<FormationImportRow>[] = [];

    const existing = await tx.formation.findMany({ where: { organizationId: orgId }, select: { name: true } });
    // Centres résolus dans le périmètre de l'utilisateur uniquement.
    const centers = await tx.center.findMany({ where: { organizationId: orgId, ...scope.center() }, select: { id: true, name: true } });
    const centersByName = indexByName(centers, (c) => c.name, normalizeKey);
    const defaultCenterIds = centers.length === 1 ? [centers[0].id] : null;
    const existingNames = new Set(existing.map((f) => normalizeKey(f.name)));
    const seen = new Map<string, number>();

    for (const raw of rows) {
      const r = new RowReader(raw, columns, issues);
      const name = r.read('name', (v) => requiredText(v, 150));
      const duration = r.read('duration', (v) => requiredInt(v, { min: 1, max: 240 }));
      const totalCost = r.read('totalCost', requiredAmount);
      const levelCount = r.read('levelCount', (v) => optionalInt(v, { min: 0, max: MAX_LEVELS })) ?? 0;
      const status = r.read('status', (v) => optionalChoice(v, STATUS_CHOICES)) ?? 'actif';
      const centerNames = (r.read('centers', (v) => optionalText(v, 1000)) ?? '')
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const centerIds: string[] = [];
      if (centerNames.length === 0) {
        if (defaultCenterIds) centerIds.push(...defaultCenterIds);
        else r.error('Au moins un centre est obligatoire.', 'centers');
      } else {
        for (const centerName of centerNames) {
          const matches = centersByName.get(normalizeKey(centerName)) ?? [];
          if (matches.length === 0) r.error(`Centre "${centerName}" introuvable dans votre organisation.`, 'centers');
          else if (matches.length > 1) r.error(`Plusieurs centres portent le nom "${centerName}" : renommez-les pour lever l'ambiguïté.`, 'centers');
          else if (!centerIds.includes(matches[0].id)) centerIds.push(matches[0].id);
        }
      }

      if (name) {
        const key = normalizeKey(name);
        if (existingNames.has(key)) {
          r.duplicate(`La formation "${name}" existe déjà.`, 'name');
        } else if (seen.has(key)) {
          r.duplicate(`Doublon dans le fichier (déjà présente ligne ${seen.get(key)}).`, 'name');
        } else {
          seen.set(key, raw.row);
        }
      }

      if (!r.hasErrors && name && duration !== undefined && totalCost !== undefined) {
        valid.push({ row: raw.row, data: { name, duration, totalCost, levelCount, status, centerIds } });
      }
    }

    return { valid, issues, fileErrors: [], warnings: [] };
  },

  async commit(rows, { tx, orgId }) {
    const withIds = rows.map(({ data }) => ({ id: randomUUID(), data }));
    for (const batch of chunk(withIds, 500)) {
      await tx.formation.createMany({
        data: batch.map(({ id, data }) => ({
          id,
          name: data.name,
          duration: data.duration,
          totalCost: data.totalCost,
          hasLevels: data.levelCount > 0,
          levelCount: data.levelCount > 0 ? data.levelCount : null,
          levels: (data.levelCount > 0 ? regenerateLevels(null, data.levelCount) : []) as unknown as Prisma.InputJsonValue,
          status: data.status,
          organizationId: orgId,
        })),
      });
      // Centres des formations (table de jonction implicite : "A" = Center.id, "B" = Formation.id).
      const links = batch.flatMap(({ id, data }) => data.centerIds.map((centerId) => [centerId, id] as const));
      await tx.$executeRawUnsafe(
        'INSERT INTO "_FormationCenters" ("A", "B") SELECT * FROM UNNEST($1::text[], $2::text[]) ON CONFLICT DO NOTHING',
        links.map((l) => l[0]),
        links.map((l) => l[1])
      );
    }
    return rows.length;
  },
};
