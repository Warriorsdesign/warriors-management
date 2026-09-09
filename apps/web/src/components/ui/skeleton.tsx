import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-secondary", className)} {...props} />;
}

/** Ligne de tableau avec des barres de largeur variable pour éviter un effet "grille parfaite" trop artificiel. */
export function TableRowSkeleton({ columns }: { columns: number }) {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-1/3", "w-full", "w-1/2"];
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton className={cn("h-4", widths[i % widths.length])} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns }: { rows?: number; columns: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className={cn("w-full flex items-end gap-2 px-2", height)}>
      {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/** Carte façon "Card" avec quelques lignes de texte factices, pour les grilles de fiches (ex: Utilisateurs). */
export function CardGridItemSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col items-center">
      <Skeleton className="w-20 h-20 rounded-full mb-4" />
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-3 w-20 mb-4" />
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
