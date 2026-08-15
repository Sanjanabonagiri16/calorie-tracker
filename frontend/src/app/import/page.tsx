"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  FeaturePanel,
  PageHeader,
  Panel,
  StatusBadge,
  StepRail,
} from "@/components/ui";
import { api } from "@/lib/api";
import { emitDataChange } from "@/lib/live";

const SAMPLE = `date,mealType,name,quantity,unit,calories,protein,carbs,fat
2026-08-14,BREAKFAST,Oatmeal,1,bowl,320,12,54,6
2026-08-14,LUNCH,Chicken salad,1,serving,450,38,22,20`;

const FORMATS = [
  { label: "PDF", detail: "Tabular text export" },
  { label: "CSV", detail: "Header-aware columns" },
  { label: "TXT", detail: "Pipe / tab / spaces" },
];

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onImport() {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult("");
    setImportedCount(0);
    try {
      const res = await api.importPdf(file);
      emitDataChange();
      setImportedCount(res.imported);
      setResult(`Imported ${res.imported} entries.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Bulk import"
        subtitle="Upload a PDF or CSV/TXT food diary and map rows into your meal log."
      />

      <StepRail
        steps={["Upload", "Parse", "Imported"]}
        current={result ? 2 : busy ? 1 : file ? 0 : 0}
      />

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <FeaturePanel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(254,255,239,0.55)]">
                Diary upload
              </p>
              <h2 className="display text-3xl">Drop your file</h2>
            </div>
            <StatusBadge tone={result ? "success" : busy ? "warn" : "neutral"}>
              {result ? "Imported" : busy ? "Parsing…" : "Waiting"}
            </StatusBadge>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {FORMATS.map((item) => (
              <span
                key={item.label}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
              >
                {item.label}
                <span className="ml-1 font-normal text-[rgba(254,255,239,0.55)]">
                  {item.detail}
                </span>
              </span>
            ))}
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              setFile(e.dataTransfer.files?.[0] || null);
              setResult("");
              setError("");
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-6 py-14 text-center transition ${
              dragging
                ? "border-[#cbe09a] bg-white/10"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.csv,.txt,application/pdf,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setResult("");
                setError("");
              }}
            />
            <FileText size={30} className="mb-3 text-[#cbe09a]" />
            {file ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[var(--cream)]"
              >
                <p className="font-medium">{file.name}</p>
                <p className="mt-1 text-sm text-[rgba(254,255,239,0.6)]">
                  {(file.size / 1024).toFixed(1)} KB · ready to parse
                </p>
              </motion.div>
            ) : (
              <div className="text-[var(--cream)]">
                <p className="font-medium">Drop your diary here</p>
                <p className="mt-1 text-sm text-[rgba(254,255,239,0.6)]">
                  PDF, CSV, or TXT
                </p>
              </div>
            )}
          </label>

          <button
            className="btn btn-cream mt-4 w-full"
            disabled={!file || busy}
            onClick={onImport}
          >
            <Upload size={16} />
            {busy ? "Parsing file…" : "Import file"}
          </button>

          {error && (
            <p className="mt-3 rounded-xl bg-[rgba(165,33,33,0.18)] px-3 py-2 text-sm text-[#ffb4a8]">
              {error}
            </p>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm text-[var(--cream)]"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#cbe09a]" />
              <div>
                <p className="font-medium">{result}</p>
                <p className="mt-1 text-xs text-[rgba(254,255,239,0.6)]">
                  {importedCount} meal
                  {importedCount === 1 ? "" : "s"} synced into your private log.
                </p>
              </div>
            </motion.div>
          )}
        </FeaturePanel>

        <Panel title="Expected format" icon={FileText} delay={0.08}>
          <p className="text-sm text-[var(--ink-soft)]">
            Best results with these columns. Messy layouts are OK — AI parses them
            when the table detector can&apos;t.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-[var(--ink-tint)] p-4 text-xs leading-relaxed">
            {SAMPLE}
          </pre>

          <div className="mt-4 space-y-2">
            {[
              "Headers can be in any order — Date, Meal, Food, Calories all work.",
              "Meal type is matched loosely: Breakfast / BREAKFAST / lunch.",
              "Image-only scanned PDFs still need an OCR/text export first.",
            ].map((tip) => (
              <div
                key={tip}
                className="rounded-2xl border border-[var(--line)] bg-white/45 px-3 py-2 text-sm text-[var(--ink-soft)]"
              >
                {tip}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
