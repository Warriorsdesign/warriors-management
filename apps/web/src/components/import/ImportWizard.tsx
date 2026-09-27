"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Copy, Download, FileSpreadsheet, Loader2, RotateCcw, Upload, XCircle,
} from "lucide-react";
import { ApiClientError } from "@/lib/api/client";
import type { ImportAnalysisDTO, ImportType } from "@/lib/api/types";
import {
  analyzeImport, commitImport, downloadImportErrorReport, downloadImportTemplate,
} from "@/lib/hooks/useImport";
import { useUIStore } from "@/lib/store/useUIStore";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<ImportType, { label: string; hint: string }> = {
  formations: { label: "Formations", hint: "Nom, durée, coût, niveaux" },
  classes: { label: "Classes", hint: "Rattachées à une formation et un centre existants" },
  students: { label: "Étudiants", hint: "Rattachés à une classe existante, avec leur échéancier" },
};

type Phase = "select" | "analyzing" | "report" | "confirm" | "importing" | "done";

interface ImportWizardProps {
  types: ImportType[];
  defaultType?: ImportType;
  onImported?: (type: ImportType, imported: number) => void;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

/**
 * Parcours d'import Excel : choix du type -> modèle -> dépôt du fichier -> analyse (aucune
 * écriture) -> rapport -> confirmation -> insertion. La validation fait foi côté serveur ;
 * ce composant ne fait qu'afficher son résultat.
 */
export function ImportWizard({ types, defaultType, onImported }: ImportWizardProps) {
  const [type, setType] = useState<ImportType>(defaultType ?? types[0]);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [analysis, setAnalysis] = useState<ImportAnalysisDTO | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = (nextType: ImportType = type) => {
    setType(nextType);
    setFile(null);
    setAnalysis(null);
    setResult(null);
    setError(null);
    setShowIssues(false);
    setPhase("select");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleTemplate = async () => {
    setIsDownloading(true);
    try {
      await downloadImportTemplate(type);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Téléchargement impossible.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFile = (selected: File | undefined) => {
    setError(null);
    setAnalysis(null);
    if (!selected) return setFile(null);
    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Seuls les fichiers Excel .xlsx sont acceptés. Utilisez le modèle fourni.");
      return;
    }
    setFile(selected);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setPhase("analyzing");
    setError(null);
    try {
      setAnalysis(await analyzeImport(type, file));
      setPhase("report");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "L'analyse du fichier a échoué.");
      setPhase("select");
    }
  };

  const handleImport = async () => {
    if (!file || !analysis) return;
    setPhase("importing");
    setError(null);
    try {
      const res = await commitImport(type, file, analysis);
      setResult(res);
      setPhase("done");
      useUIStore.getState().showToast(`${fmt(res.imported)} ligne(s) importée(s) avec succès.`, "success");
      onImported?.(type, res.imported);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "L'import a échoué. Aucune donnée n'a été enregistrée.";
      // Les erreurs de quota passent par la modale globale existante (voir useUIStore.showToast).
      if (/quota atteint/i.test(message)) useUIStore.getState().showToast(message, "error");
      setError(message);
      setPhase("report");
    }
  };

  const handleReport = async () => {
    if (!file) return;
    setIsDownloading(true);
    try {
      await downloadImportErrorReport(type, file);
    } catch (err) {
      useUIStore.getState().showToast(err instanceof ApiClientError ? err.message : "Téléchargement impossible.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const busy = phase === "analyzing" || phase === "importing";
  const rejected = analysis ? analysis.invalidRows + analysis.duplicateRows : 0;
  const issueRows = new Set(analysis?.issues.map((i) => i.row));

  return (
    <div className="space-y-5">
      {types.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Type de données</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                disabled={busy}
                onClick={() => reset(t)}
                className={cn(
                  "text-left rounded-lg border px-3 py-2.5 transition-all disabled:opacity-50",
                  type === t ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/50 hover:shadow-sm"
                )}
              >
                <span className="block text-sm font-medium text-foreground">{TYPE_LABELS[t].label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{TYPE_LABELS[t].hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase !== "done" && (
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-secondary text-xs font-semibold flex items-center justify-center">1</span>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">Téléchargez le modèle et remplissez l’onglet « Données »</p>
              <p className="text-xs text-muted-foreground">
                Le modèle contient les instructions, un exemple et des listes déroulantes avec vos centres, formations et classes.
              </p>
              <button
                type="button"
                onClick={handleTemplate}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Modèle {TYPE_LABELS[type].label.toLowerCase()} (.xlsx)
              </button>
            </div>
          </li>

          <li className="flex gap-3">
            <span className="w-6 h-6 shrink-0 rounded-full bg-secondary text-xs font-semibold flex items-center justify-center">2</span>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">Déposez votre fichier</p>
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!busy) handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-all",
                  file ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/50 hover:shadow-md",
                  busy && "pointer-events-none opacity-60"
                )}
              >
                <FileSpreadsheet className={cn("w-8 h-8", file ? "text-primary" : "text-muted-foreground")} />
                {file ? (
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Glissez un fichier .xlsx ici ou cliquez pour le choisir (4 Mo, 5 000 lignes max.)</span>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {phase === "select" && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!file}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> Analyser le fichier
                </button>
              )}
              {phase === "analyzing" && (
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...
                </p>
              )}
            </div>
          </li>
        </ol>
      )}

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md animate-fade-in flex gap-2">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {analysis && (phase === "report" || phase === "confirm" || phase === "importing") && (
        <div className="rounded-xl border border-border bg-card animate-fade-in">
          <div className="px-4 py-3 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground">Analyse du fichier</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(analysis.totalRows)} ligne(s) lue(s). Rien n’a encore été enregistré.</p>
          </div>

          <div className="p-4 space-y-4">
            {analysis.fileErrors.length > 0 && (
              <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md space-y-1">
                <p className="font-semibold flex items-center gap-2"><XCircle className="w-4 h-4" /> Import impossible</p>
                {analysis.fileErrors.map((m) => <p key={m}>{m}</p>)}
              </div>
            )}

            {analysis.fileErrors.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm"><b>{fmt(analysis.validRows)}</b> ligne(s) valide(s)</span>
                </div>
                <div className={cn("rounded-lg border px-3 py-2 flex items-center gap-2", analysis.invalidRows ? "border-rose-100 bg-rose-50 text-rose-700" : "border-border text-muted-foreground")}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm"><b>{fmt(analysis.invalidRows)}</b> ligne(s) avec erreurs</span>
                </div>
                <div className={cn("rounded-lg border px-3 py-2 flex items-center gap-2", analysis.duplicateRows ? "border-amber-100 bg-amber-50 text-amber-700" : "border-border text-muted-foreground")}>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm"><b>{fmt(analysis.duplicateRows)}</b> doublon(s)</span>
                </div>
              </div>
            )}

            {analysis.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">{w}</p>
            ))}

            {analysis.issues.length > 0 && (
              <div className="space-y-2">
                <button type="button" onClick={() => setShowIssues((v) => !v)} className="text-sm font-medium text-primary hover:underline">
                  {showIssues ? "Masquer les erreurs" : `Voir les erreurs (${fmt(analysis.issues.length)})`}
                </button>
                {showIssues && (
                  <div className="max-h-64 overflow-auto rounded-md border border-border">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                        <tr>
                          <th className="px-3 py-2 font-medium">Ligne</th>
                          <th className="px-3 py-2 font-medium">Colonne</th>
                          <th className="px-3 py-2 font-medium">Problème</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysis.issues.map((issue, i) => (
                          <tr key={`${issue.row}-${i}`}>
                            <td className="px-3 py-1.5 font-mono">{issue.row}</td>
                            <td className="px-3 py-1.5">{issue.column ?? "-"}</td>
                            <td className={cn("px-3 py-1.5", issue.kind === "duplicate" ? "text-amber-700" : "text-rose-700")}>{issue.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {analysis.preview.length > 0 && analysis.fileErrors.length === 0 && (
              <details className="group">
                <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                  Aperçu des {analysis.preview.length} premières lignes
                </summary>
                <div className="mt-2 max-h-64 overflow-auto rounded-md border border-border">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-3 py-2 font-medium">Ligne</th>
                        {analysis.columns.map((c) => <th key={c.key} className="px-3 py-2 font-medium">{c.label}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {analysis.preview.map((p) => (
                        <tr key={p.row} className={issueRows.has(p.row) ? "bg-rose-50/60" : undefined}>
                          <td className="px-3 py-1.5 font-mono">{p.row}</td>
                          {analysis.columns.map((c) => <td key={c.key} className="px-3 py-1.5">{p.values[c.key]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            {phase === "confirm" ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3 animate-fade-in">
                <p className="text-sm text-foreground">
                  Confirmer l’import de <b>{fmt(analysis.validRows)}</b> ligne(s) valide(s) ?
                  {rejected > 0 && <> Les <b>{fmt(rejected)}</b> ligne(s) en erreur ou en doublon seront ignorées.</>}
                  {" "}L’opération est globale : soit toutes ces lignes sont enregistrées, soit aucune.
                </p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setPhase("report")} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Retour
                  </button>
                  <button type="button" onClick={handleImport} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                    Confirmer l’import
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => reset()} disabled={busy} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  Annuler
                </button>
                {analysis.issues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReport}
                    disabled={busy || isDownloading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> Rapport d’erreurs (.xlsx)
                  </button>
                )}
                {analysis.canImport && (
                  <button
                    type="button"
                    onClick={() => setPhase("confirm")}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {phase === "importing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {phase === "importing" ? "Import en cours..." : rejected > 0 ? `Importer les ${fmt(analysis.validRows)} lignes valides` : `Importer ${fmt(analysis.validRows)} ligne(s)`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-3 animate-fade-in">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="w-5 h-5" /> Import terminé
          </p>
          <p className="text-sm text-emerald-800">
            {fmt(result.imported)} ligne(s) enregistrée(s){result.skipped > 0 && `, ${fmt(result.skipped)} ligne(s) ignorée(s)`}.
          </p>
          <button type="button" onClick={() => reset()} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline">
            <RotateCcw className="w-4 h-4" /> Importer un autre fichier
          </button>
        </div>
      )}
    </div>
  );
}
