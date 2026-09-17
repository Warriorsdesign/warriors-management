/**
 * Filtre "centre" global (sélecteur de la topbar) : centerId peut être répété dans la
 * query string (?centerId=a&centerId=b). Un tableau vide signifie "tous les centres" -
 * chaque helper retourne alors {} (aucune clause where ajoutée).
 *
 * Le chemin vers Center diffère selon le modèle (voir prisma/schema.prisma) :
 * ClassGroup a un centerId direct, Student/PaymentSchedule/Payment y accèdent via leur
 * classe (student.classGroup.centerId), Formation via ses classes (classes.some), et
 * Expense a désormais son propre centerId direct.
 */
export function parseCenterIds(searchParams: URLSearchParams): string[] {
  return searchParams.getAll('centerId').filter(Boolean);
}

export function centerIdWhere(centerIds: string[]) {
  return centerIds.length ? { centerId: { in: centerIds } } : {};
}

export function classGroupCenterWhere(centerIds: string[]) {
  return centerIds.length ? { classGroup: { centerId: { in: centerIds } } } : {};
}

export function studentClassGroupCenterWhere(centerIds: string[]) {
  return centerIds.length ? { student: { classGroup: { centerId: { in: centerIds } } } } : {};
}

export function formationClassesCenterWhere(centerIds: string[]) {
  return centerIds.length ? { classes: { some: { centerId: { in: centerIds } } } } : {};
}
