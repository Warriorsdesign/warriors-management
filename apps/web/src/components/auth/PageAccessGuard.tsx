"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import type { PermissionResource } from "@/lib/auth/permissionCatalog";

/**
 * Permission de lecture requise par page (préfixe d'URL). Le menu masque déjà ces entrées ;
 * cette garde couvre l'accès par URL directe. La vraie barrière reste l'API (403).
 */
const PAGE_PERMISSIONS: { prefix: string; resource: PermissionResource }[] = [
  { prefix: "/students", resource: "students" },
  { prefix: "/formations", resource: "formations" },
  { prefix: "/classes", resource: "classes" },
  { prefix: "/payments", resource: "payments" },
  { prefix: "/expenses", resource: "expenses" },
  { prefix: "/reports", resource: "reports" },
  { prefix: "/centers", resource: "centers" },
  { prefix: "/users", resource: "users" },
];

export function PageAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { permissions, isLoading } = useSession();

  const rule = PAGE_PERMISSIONS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
  if (!rule) return <>{children}</>;
  // Session en cours de chargement : rien d'affiché plutôt qu'un contenu non autorisé.
  if (!permissions) return isLoading ? null : <>{children}</>;
  if (permissions[rule.resource]?.read) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
        <ShieldOff className="w-7 h-7 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Accès non autorisé</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        Votre rôle ne donne pas accès à cette page. Si vous en avez besoin, demandez à
        l&apos;administrateur de votre organisation d&apos;ajuster vos droits.
      </p>
      <Link href="/" className="mt-6 text-sm font-semibold text-primary hover:underline">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
