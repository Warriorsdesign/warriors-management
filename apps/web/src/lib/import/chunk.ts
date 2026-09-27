/** Découpe les insertions en lots : borne le nombre de paramètres liés par requête (limite Postgres : 65 535). */
export function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}
