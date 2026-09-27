import type { ImportType } from '@/lib/api/types';
import { ApiError } from '@/lib/api/errors';
import { classesImport } from './definitions/classes';
import { formationsImport } from './definitions/formations';
import { studentsImport } from './definitions/students';
import type { ImportDefinition } from './types';

const REGISTRY: Record<ImportType, ImportDefinition<unknown>> = {
  formations: formationsImport as ImportDefinition<unknown>,
  classes: classesImport as ImportDefinition<unknown>,
  students: studentsImport as ImportDefinition<unknown>,
};

export function getImportDefinition(type: string): ImportDefinition<unknown> {
  const definition = REGISTRY[type as ImportType];
  if (!definition) throw new ApiError(404, "Type d'import inconnu.", 'IMPORT_TYPE_NOT_FOUND');
  return definition;
}
