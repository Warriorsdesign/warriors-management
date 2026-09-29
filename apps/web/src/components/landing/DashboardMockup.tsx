import { BarChart3, Building2, CreditCard, GraduationCap, Layers, LayoutDashboard, Receipt, Users } from "lucide-react";

/**
 * Maquette du tableau de bord, reconstruite à partir de l'interface réelle (mêmes indicateurs :
 * effectifs, entrées / sorties, CA encaissé, recouvrement, par formation, à traiter).
 * Données fictives, signalées comme telles.
 */
const BARS = [34, 48, 26, 60, 42, 70, 55, 78, 40, 66, 88, 58, 72, 50, 84];

const FORMATIONS = [
  { name: "Informatique", entries: 18, exits: 2, effectif: 64 },
  { name: "Comptabilité", entries: 4, exits: 3, effectif: 41 },
  { name: "Secrétariat bureautique", entries: 2, exits: 3, effectif: 51 },
];

const NAV = [
  { icon: LayoutDashboard, label: "Tableau de bord", active: true },
  { icon: GraduationCap, label: "Étudiants" },
  { icon: Layers, label: "Formations" },
  { icon: Users, label: "Classes" },
  { icon: CreditCard, label: "Paiements" },
  { icon: Receipt, label: "Dépenses" },
  { icon: BarChart3, label: "Rapports" },
  { icon: Building2, label: "Centres" },
];

export function DashboardMockup() {
  return (
    <figure aria-label="Exemple du tableau de bord, avec des données fictives">
      <div className="rounded-[20px] border border-[var(--lp-line)] bg-white shadow-[0_40px_80px_-40px_rgba(20,20,20,0.35)] overflow-hidden text-[var(--lp-ink)]">
        <div className="flex">
          <aside className="hidden md:flex w-48 shrink-0 flex-col gap-1 border-r border-[var(--lp-line)] p-4 bg-[#fafaf8]">
            <p className="text-[11px] font-bold mb-3">Institut Excellence</p>
            {NAV.map((n) => (
              <span
                key={n.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${n.active ? "bg-[#ecebe6] font-semibold" : "text-[var(--lp-muted)]"}`}
              >
                <n.icon className="w-3.5 h-3.5" aria-hidden="true" /> {n.label}
              </span>
            ))}
          </aside>

          <div className="flex-1 min-w-0 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Bonjour, Aïcha</p>
              <div className="flex gap-1 text-[10px] font-medium">
                <span className="px-2 py-1 rounded-md text-[var(--lp-muted)]">Aujourd’hui</span>
                <span className="px-2 py-1 rounded-md bg-[#ecebe6]">Ce mois</span>
                <span className="hidden sm:inline px-2 py-1 rounded-md text-[var(--lp-muted)]">Trimestre</span>
                <span className="hidden sm:inline px-2 py-1 rounded-md text-[var(--lp-muted)]">Année</span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                { label: "Étudiants actifs", value: "156", sub: <><span className="text-emerald-700">+24 entrées</span> <span className="text-rose-700">-8 sorties</span></> },
                { label: "CA encaissé", value: "1 450 000", sub: <span className="text-emerald-700">FCFA ce mois</span> },
                { label: "Dépenses", value: "610 000", sub: <span className="text-[var(--lp-muted)]">42 % du CA</span> },
                { label: "Recouvrement", value: "82 %", sub: <span className="text-rose-700">320 000 en retard</span> },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-[var(--lp-line)] p-3">
                  <p className="text-[10px] text-[var(--lp-muted)]">{k.label}</p>
                  <p className="text-lg font-bold mt-0.5 tabular-nums">{k.value}</p>
                  <p className="text-[10px] mt-0.5">{k.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-2.5">
              <div className="lg:col-span-2 rounded-xl border border-[var(--lp-line)] p-3">
                <p className="text-[10px] font-semibold mb-2">Encaissements, jour par jour</p>
                <div className="flex items-end gap-1 h-24">
                  {BARS.map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-[#3f3f3c]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--lp-line)] p-3 hidden lg:block">
                <p className="text-[10px] font-semibold mb-2">À traiter</p>
                {[
                  ["0-30 jours", "180 000"],
                  ["30-60 jours", "95 000"],
                  ["+60 jours", "45 000"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px] py-1 border-b border-[var(--lp-line)] last:border-0">
                    <span className="text-[var(--lp-muted)]">{k}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
                <p className="text-[10px] text-[var(--lp-muted)] mt-2">5 échéances cette semaine</p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--lp-line)] p-3">
              <p className="text-[10px] font-semibold mb-1.5">Par formation</p>
              <table className="w-full text-[10px]">
                <thead className="text-[var(--lp-muted)]">
                  <tr>
                    <th className="text-left font-medium pb-1">Formation</th>
                    <th className="text-right font-medium pb-1">Entrées</th>
                    <th className="text-right font-medium pb-1">Sorties</th>
                    <th className="text-right font-medium pb-1">Effectif</th>
                  </tr>
                </thead>
                <tbody>
                  {FORMATIONS.map((f) => (
                    <tr key={f.name} className="border-t border-[var(--lp-line)]">
                      <td className="py-1">{f.name}</td>
                      <td className="py-1 text-right text-emerald-700">+{f.entries}</td>
                      <td className="py-1 text-right text-rose-700">-{f.exits}</td>
                      <td className="py-1 text-right tabular-nums">{f.effectif}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-[var(--lp-muted)]">Exemple d’interface, données fictives</figcaption>
    </figure>
  );
}
