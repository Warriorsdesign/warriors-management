"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

/**
 * Accordéon à un seul panneau ouvert. La hauteur est animée par grid-template-rows (0fr -> 1fr),
 * sans mesure en JS. Titres numérotés 01, 02... si `numbered`, dans un badge rond (voir NumBadge).
 */
// Cercle de rayon 25 (périmètre ~157) : deux arcs de 120° séparés par deux trous de 60°, placés
// à gauche et à droite ; un point termine chaque arc.
const ARC = "52.36 26.18";
const DOT_ANGLES = [30, 150, 210, 330];

/** Numéro dans un disque, entouré de deux arcs prune qui pivotent quand l'étape s'ouvre. */
function NumBadge({ n, gradientId }: { n: number; gradientId: string }) {
  return (
    <span className="lp-badge" aria-hidden="true">
      <svg className="lp-badge__ring" viewBox="0 0 56 56">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--lp-accent)" />
            <stop offset="100%" stopColor="var(--lp-accent)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <g transform="rotate(30 28 28)">
          <circle cx="28" cy="28" r="25" fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.6" strokeDasharray={ARC} strokeLinecap="round" />
        </g>
        {DOT_ANGLES.map((a) => (
          <circle key={a} cx={28 + 25 * Math.cos((a * Math.PI) / 180)} cy={28 + 25 * Math.sin((a * Math.PI) / 180)} r="2.2" fill="var(--lp-accent)" />
        ))}
      </svg>
      <span className="lp-badge__disc">{String(n).padStart(2, "0")}</span>
    </span>
  );
}

export function Accordion({
  items,
  defaultOpen = null,
  numbered = true,
  headingLevel = 3,
}: {
  items: AccordionItem[];
  defaultOpen?: number | null;
  numbered?: boolean;
  headingLevel?: 3 | 4;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const baseId = useId();
  const gradientBase = baseId.replace(/[^a-zA-Z0-9_-]/g, "");
  const Heading = `h${headingLevel}` as "h3" | "h4";

  return (
    <div className="lp-acc">
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const buttonId = `${baseId}-button-${i}`;
        return (
          <div key={item.title} className={`lp-acc__item ${isOpen ? "is-open" : ""}`}>
            <Heading className="m-0">
              <button
                id={buttonId}
                type="button"
                className="lp-acc__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {numbered && <NumBadge n={i + 1} gradientId={`${gradientBase}-g${i}`} />}
                <span className="lp-h3" style={{ fontSize: "clamp(1.1rem, 1rem + 0.5vw, 1.35rem)" }}>{item.title}</span>
                <span className="lp-acc__sign" aria-hidden="true"><Plus className="w-4 h-4" /></span>
              </button>
            </Heading>
            <div id={panelId} role="region" aria-labelledby={buttonId} className="lp-acc__panel">
              <div className="lp-acc__inner">
                <div className="pb-7">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
