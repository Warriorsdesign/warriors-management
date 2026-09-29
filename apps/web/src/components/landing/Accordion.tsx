"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

export interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

/**
 * Accordéon à un seul panneau ouvert. La hauteur est animée par grid-template-rows (0fr -> 1fr),
 * sans mesure en JS. Titres numérotés 01, 02... si `numbered`.
 */
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
                {numbered && <span className="lp-num">{String(i + 1).padStart(2, "0")}</span>}
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
