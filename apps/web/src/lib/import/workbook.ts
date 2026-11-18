import ExcelJS from 'exceljs';
import type { ImportRowIssue } from '@/lib/api/types';
import { normalizeKey, toText } from './cells';
import type { CellValue, ColumnDef, ImportDefinition, RawRow } from './types';

export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const DATA_SHEET = 'Données';
const LISTS_SHEET = 'Listes';
const TEMPLATE_ROWS = 1000;

export interface ParsedFile {
  rows: RawRow[];
  fileErrors: string[];
  warnings: string[];
}

function cellValue(value: ExcelJS.CellValue): CellValue {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if ('richText' in value) return cellValue(value.richText.map((r) => r.text).join(''));
    if ('formula' in value || 'sharedFormula' in value) {
      return cellValue((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
    }
    if ('hyperlink' in value) return cellValue((value as ExcelJS.CellHyperlinkValue).text);
    if ('error' in value) return null;
  }
  return String(value);
}

function isXlsx(buffer: Buffer): boolean {
  // Un .xlsx est une archive ZIP ("PK\x03\x04") ; les .xls (OLE) et .csv sont refusés tôt.
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

/**
 * Lit l'onglet "Données" et associe chaque colonne à sa définition par en-tête (et non par
 * position : l'utilisateur peut réordonner ou ajouter des colonnes). Aucune validation
 * métier ici - seulement la structure du fichier.
 */
export async function parseWorkbook(buffer: Buffer, columns: ColumnDef[]): Promise<ParsedFile> {
  const fileErrors: string[] = [];
  const warnings: string[] = [];
  const fail = (message: string): ParsedFile => ({ rows: [], fileErrors: [message], warnings });

  if (buffer.length === 0) return fail('Le fichier est vide.');
  if (buffer.length > MAX_FILE_BYTES) return fail('Le fichier dépasse la taille maximale autorisée (4 Mo).');
  if (!isXlsx(buffer)) {
    return fail('Format non supporté : enregistrez votre fichier au format Excel .xlsx (les fichiers .xls et .csv ne sont pas acceptés).');
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    return fail('Fichier Excel illisible ou corrompu.');
  }

  const sheets = workbook.worksheets.filter((ws) => ws.state === 'visible' && normalizeKey(ws.name) !== normalizeKey(LISTS_SHEET));
  const sheet =
    sheets.find((ws) => normalizeKey(ws.name) === normalizeKey(DATA_SHEET)) ?? (sheets.length === 1 ? sheets[0] : undefined);
  if (!sheet) return fail(`Onglet "${DATA_SHEET}" introuvable. Utilisez le modèle fourni et remplissez l'onglet "${DATA_SHEET}".`);

  const lookup = new Map<string, ColumnDef>();
  for (const col of columns) {
    lookup.set(normalizeKey(col.label), col);
    for (const alias of col.aliases ?? []) lookup.set(normalizeKey(alias), col);
  }

  const mapping = new Map<number, string>(); // n° de colonne Excel -> clé
  const unknown: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = toText(cellValue(cell.value));
    if (!header) return;
    const col = lookup.get(normalizeKey(header));
    if (!col) {
      unknown.push(header);
    } else if (Array.from(mapping.values()).includes(col.key)) {
      fileErrors.push(`La colonne "${col.label}" est présente plusieurs fois.`);
    } else {
      mapping.set(colNumber, col.key);
    }
  });

  if (mapping.size === 0) return fail("Aucune colonne reconnue sur la première ligne de l'onglet. Vérifiez que vous utilisez le bon modèle.");

  const present = new Set(mapping.values());
  const missing = columns.filter((c) => c.required && !present.has(c.key)).map((c) => c.label);
  if (missing.length > 0) fileErrors.push(`Colonne(s) obligatoire(s) manquante(s) : ${missing.join(', ')}.`);
  if (unknown.length > 0) warnings.push(`Colonne(s) non reconnue(s), ignorée(s) : ${unknown.join(', ')}.`);
  if (fileErrors.length > 0) return { rows: [], fileErrors, warnings };

  const rows: RawRow[] = [];
  let tooMany = false;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1 || tooMany) return;
    const values: Record<string, CellValue> = {};
    let empty = true;
    mapping.forEach((key, colNumber) => {
      const value = cellValue(row.getCell(colNumber).value);
      values[key] = value;
      if (value !== null) empty = false;
    });
    if (empty) return;
    if (rows.length >= MAX_ROWS) {
      tooMany = true;
      return;
    }
    rows.push({ row: rowNumber, values });
  });

  if (tooMany) return fail(`Le fichier dépasse ${MAX_ROWS} lignes. Découpez-le en plusieurs fichiers.`);
  if (rows.length === 0) return fail(`L'onglet "${DATA_SHEET}" ne contient aucune ligne de données.`);
  return { rows, fileErrors, warnings };
}

const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFFFFFFF' } };

function headerLabel(col: ColumnDef): string {
  return col.required ? `${col.label} *` : col.label;
}

function styleHeader(sheet: ExcelJS.Worksheet, columns: ColumnDef[]) {
  sheet.columns = columns.map((col) => ({ header: headerLabel(col), key: col.key, width: Math.max(16, col.label.length + 6) }));
  const header = sheet.getRow(1);
  header.font = HEADER_FONT;
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Modèle Excel propre à l'organisation : les listes déroulantes proposent ses centres,
 * formations et classes réels. Onglets : Instructions, Données (à remplir), Exemple.
 */
export async function buildTemplate(definition: ImportDefinition, lists: Record<string, string[]>): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Warriors Management';
  workbook.created = new Date();

  const instructions = workbook.addWorksheet('Instructions');
  instructions.columns = [
    { key: 'a', width: 28 },
    { key: 'b', width: 14 },
    { key: 'c', width: 70 },
    { key: 'd', width: 26 },
  ];
  instructions.addRow([`Import des ${definition.label.toLowerCase()} - Warriors Management`]).font = { bold: true, size: 14 };
  instructions.addRow([]);
  const general = [
    `1. Remplissez l'onglet "${DATA_SHEET}" : une ligne par élément, sans modifier les en-têtes.`,
    '2. Les colonnes marquées * sont obligatoires.',
    "3. L'onglet \"Exemple\" montre une saisie correcte ; il n'est jamais importé.",
    `4. ${MAX_ROWS} lignes maximum par fichier, 4 Mo maximum, format .xlsx uniquement.`,
    "5. Avant tout enregistrement, l'application analyse le fichier et vous montre les erreurs éventuelles.",
    ...definition.instructions.map((text, i) => `${i + 6}. ${text}`),
  ];
  general.forEach((text) => instructions.addRow([text]));
  instructions.addRow([]);
  const tableHeader = instructions.addRow(['Colonne', 'Obligatoire', 'Description', 'Exemple']);
  tableHeader.font = HEADER_FONT;
  tableHeader.fill = HEADER_FILL;
  for (const col of definition.columns) {
    const row = instructions.addRow([col.label, col.required ? 'Oui' : 'Non', col.help, String(definition.examples[0]?.[col.key] ?? '')]);
    row.alignment = { wrapText: true, vertical: 'top' };
  }

  const data = workbook.addWorksheet(DATA_SHEET);
  styleHeader(data, definition.columns);

  const example = workbook.addWorksheet('Exemple');
  styleHeader(example, definition.columns);
  definition.examples.forEach((values) => example.addRow(values));

  const listSheet = workbook.addWorksheet(LISTS_SHEET, { state: 'hidden' });
  const listRanges = new Map<string, string>();
  let listCol = 1;
  for (const [key, values] of Object.entries(lists)) {
    if (values.length === 0) continue;
    const letter = listSheet.getColumn(listCol).letter;
    listSheet.getCell(1, listCol).value = key;
    values.forEach((v, i) => (listSheet.getCell(i + 2, listCol).value = v));
    listRanges.set(key, `'${LISTS_SHEET}'!$${letter}$2:$${letter}$${values.length + 1}`);
    listCol++;
  }

  definition.columns.forEach((col, index) => {
    const column = data.getColumn(index + 1);
    if (col.format === 'text') column.numFmt = '@';
    if (col.format === 'date') column.numFmt = 'dd/mm/yyyy';
    const range = col.list ? listRanges.get(col.list) : undefined;
    for (let r = 2; r <= TEMPLATE_ROWS + 1; r++) {
      const cell = data.getCell(r, index + 1);
      if (range) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [range],
          showErrorMessage: false, // saisie libre tolérée : l'analyse signalera les valeurs inconnues
        };
      }
    }
  });

  workbook.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 1, visibility: 'visible' }];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/**
 * Rapport des lignes rejetées, directement ré-importable après correction : mêmes en-têtes,
 * valeurs d'origine, plus une colonne "Erreurs" (ignorée à l'import).
 */
export async function buildErrorReport(definition: ImportDefinition, rows: RawRow[], issues: ImportRowIssue[]): Promise<Buffer> {
  const byRow = new Map<number, string[]>();
  for (const issue of issues) {
    const text = issue.column ? `${issue.column} : ${issue.message}` : issue.message;
    byRow.set(issue.row, [...(byRow.get(issue.row) ?? []), text]);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(DATA_SHEET);
  styleHeader(sheet, [...definition.columns, { key: '__errors', label: 'Erreurs', required: false, help: '' }]);
  sheet.getColumn(definition.columns.length + 1).width = 80;

  for (const raw of rows) {
    const messages = byRow.get(raw.row);
    if (!messages) continue;
    const values: Record<string, ExcelJS.CellValue> = { __errors: `Ligne ${raw.row} - ${messages.join(' | ')}` };
    for (const col of definition.columns) values[col.key] = raw.values[col.key] ?? null;
    const row = sheet.addRow(values);
    row.getCell(definition.columns.length + 1).font = { color: { argb: 'FFB91C1C' } };
  }
  definition.columns.forEach((col, i) => {
    if (col.format === 'date') sheet.getColumn(i + 1).numFmt = 'dd/mm/yyyy';
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
