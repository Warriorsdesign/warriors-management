import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreditCard, CheckCircle2, XCircle, AlertCircle, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  maxCenters: number;
  maxStudents: number;
}

interface Subscription {
  id: string;
  status: 'active' | 'trial' | 'expired' | 'suspended';
  startDate: string;
  endDate: string;
  plan: Plan | null;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  reference: string;
  plan: Plan | null;
}

interface CurrentSubscriptionData {
  subscription: Subscription | null;
  usage: {
    centers: number;
    students: number;
  };
  payments: Payment[];
}

export function SubscriptionSettings() {
  const [data, setData] = useState<CurrentSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await apiFetch<CurrentSubscriptionData>('/api/subscriptions/current');
        setData(result);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement de l'abonnement");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement de l'abonnement...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-center text-destructive">{error || "Impossible de charger les données."}</div>;
  }

  const { subscription, usage, payments } = data;

  const formatQuota = (val: number, used?: number) => {
    if (val === -1) return "Illimité";
    if (used !== undefined) return `${used} / ${val}`;
    return val.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80"><CheckCircle2 className="w-3 h-3 mr-1" /> Actif</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80">Période d'essai</Badge>;
      case 'expired':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80"><AlertCircle className="w-3 h-3 mr-1" /> Expiré</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100/80"><XCircle className="w-3 h-3 mr-1" /> Suspendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-semibold text-foreground">Abonnement & Facturation</h2>
        <p className="text-sm text-muted-foreground mt-1">Consultez votre offre actuelle et gérez vos paiements.</p>
      </div>

      {!subscription ? (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-800">
          Aucun abonnement actif pour cette organisation. Veuillez contacter le support.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card Abonnement */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-secondary/20 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Plan {subscription.plan?.name || 'Inconnu'}
                  {getStatusBadge(subscription.status)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Valide du {format(new Date(subscription.startDate), 'dd MMM yyyy', { locale: fr })} au{' '}
                  <span className="font-semibold text-foreground">
                    {format(new Date(subscription.endDate), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-foreground">
                  {subscription.plan?.price.toLocaleString()} {subscription.plan?.currency}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Par mois</div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Utilisation des quotas</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Centres :</span>
                    <span className="font-medium">{formatQuota(subscription.plan?.maxCenters || 0, usage.centers)}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Apprenants :</span>
                    <span className="font-medium">{formatQuota(subscription.plan?.maxStudents || 0, usage.students)}</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col justify-center items-start md:items-end gap-3">
                <button
                  disabled
                  className="px-4 py-2 bg-primary/50 text-white rounded-md font-medium text-sm w-full cursor-not-allowed flex justify-center items-center gap-2"
                  title="Le paiement en ligne sera disponible prochainement"
                >
                  <CreditCard className="w-4 h-4" /> Renouveler l'abonnement
                </button>
                <p className="text-xs text-muted-foreground italic text-center md:text-right w-full">
                  Paiement par CinetPay bientôt disponible
                </p>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          <div>
            <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Historique des factures
            </h3>

            {payments.length === 0 ? (
              <div className="text-center p-8 bg-secondary/10 rounded-lg border border-border border-dashed text-sm text-muted-foreground">
                Aucun paiement trouvé
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/30 text-xs text-muted-foreground uppercase">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Référence</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium text-right">Montant</th>
                      <th className="px-4 py-3 font-medium text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payments.map(payment => (
                      <tr key={payment.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(new Date(payment.date), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{payment.reference}</td>
                        <td className="px-4 py-3">{payment.plan?.name || '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {payment.status === 'COMPLETED' ? (
                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">Complété</span>
                          ) : (
                            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-xs font-medium">{payment.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
