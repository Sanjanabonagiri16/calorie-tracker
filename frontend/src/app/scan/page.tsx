"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, ImagePlus, Sparkles } from "lucide-react";
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

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const;

const REVIEW_FIELDS = [
  { key: "quantity", label: "Quantity", type: "number" },
  { key: "unit", label: "Unit", type: "text" },
  { key: "calories", label: "Calories", type: "number" },
  { key: "protein", label: "Protein (g)", type: "number" },
  { key: "carbs", label: "Carbs (g)", type: "number" },
  { key: "fat", label: "Fat (g)", type: "number" },
] as const;

export default function ScanPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState<Record<string, string | number>>({
    mealType: "LUNCH",
    name: "",
    quantity: 1,
    unit: "serving",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [notes, setNotes] = useState("");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [extracted, setExtracted] = useState(false);

  const step = message.includes("saved")
    ? 2
    : extracted
      ? 1
      : 0;

  function onFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setMessage("");
    setError("");
    setExtracted(false);
    setNotes("");
    setProvider("");
  }

  async function extract() {
    if (!file) return;
    setBusy(true);
    setAnalyzing(true);
    setError("");
    try {
      const res = await api.extractImage(file);
      setProvider(res.provider);
      setNotes(res.extracted.notes || "");
      setForm({
        mealType: (res.extracted.mealType as string) || "LUNCH",
        name: res.extracted.name,
        quantity: res.extracted.quantity ?? 1,
        unit: res.extracted.unit || "serving",
        calories: res.extracted.calories ?? 0,
        protein: res.extracted.protein ?? 0,
        carbs: res.extracted.carbs ?? 0,
        fat: res.extracted.fat ?? 0,
        fiber: res.extracted.fiber ?? 0,
        sugar: res.extracted.sugar ?? 0,
        sodium: res.extracted.sodium ?? 0,
        vitaminA: res.extracted.vitaminA ?? 0,
        vitaminC: res.extracted.vitaminC ?? 0,
        calcium: res.extracted.calcium ?? 0,
        iron: res.extracted.iron ?? 0,
      });
      setExtracted(true);
      setMessage("AI analysis complete. Review the details and save.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extract failed");
    } finally {
      setBusy(false);
      setAnalyzing(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api.createMeal({
        mealType: String(form.mealType),
        name: String(form.name),
        quantity: Number(form.quantity),
        unit: String(form.unit),
        calories: Number(form.calories),
        protein: Number(form.protein || 0),
        carbs: Number(form.carbs || 0),
        fat: Number(form.fat || 0),
        fiber: Number(form.fiber || 0),
        sugar: Number(form.sugar || 0),
        sodium: Number(form.sodium || 0),
        vitaminA: Number(form.vitaminA || 0),
        vitaminC: Number(form.vitaminC || 0),
        calcium: Number(form.calcium || 0),
        iron: Number(form.iron || 0),
        source: "ai_scan",
      });
      emitDataChange();
      setMessage("Meal saved from scan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="AI Scan"
        subtitle="Point at a plate or label — AI fills calories and macros in seconds."
      />

      <StepRail steps={["Capture", "Review", "Saved"]} current={step} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <FeaturePanel>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(254,255,239,0.55)]">
                Meal scan
              </p>
              <h2 className="display text-3xl">Camera stage</h2>
            </div>
            {extracted ? (
              <StatusBadge tone="success">
                <CheckCircle2 size={12} /> AI analysis complete
              </StatusBadge>
            ) : (
              <StatusBadge tone="neutral">Ready to scan</StatusBadge>
            )}
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
              onFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`scan-stage block cursor-pointer ${
              dragging ? "ring-2 ring-[#cbe09a]/ring-offset-2 ring-offset-transparent" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
            <div className="scan-stage__frame">
              <span />
            </div>
            {analyzing && <div className="scan-pulse" />}

            <div className="relative z-[1] grid min-h-[280px] place-items-center p-6">
              {preview ? (
                <motion.img
                  key={preview}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={preview}
                  alt="Selected food"
                  className="max-h-72 w-full rounded-2xl object-cover shadow-2xl"
                />
              ) : (
                <div className="text-center text-[var(--cream)]">
                  <ImagePlus size={34} className="mx-auto mb-3 opacity-80" />
                  <p className="font-medium">Drop a plate or label photo</p>
                  <p className="mt-1 text-sm text-[rgba(254,255,239,0.62)]">
                    or click to browse
                  </p>
                </div>
              )}
            </div>
          </label>

          {extracted && (
            <div className="metric-row mt-4">
              {[
                { label: "kcal", value: form.calories, color: "#cbe09a" },
                { label: "protein", value: form.protein, color: "#9bb84c" },
                { label: "carbs", value: form.carbs, color: "#dda32b" },
                { label: "fats", value: form.fat, color: "#e08a6a" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/10 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                >
                  <p className="display text-xl text-[var(--cream)]">
                    {Math.round(Number(item.value))}
                    <span className="ml-1 text-xs font-sans text-[rgba(254,255,239,0.55)]">
                      {item.label === "kcal" ? "" : "g"}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(254,255,239,0.55)]">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: item.color }}
                    />
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-cream mt-4 w-full"
            disabled={!file || busy}
            onClick={extract}
          >
            <Sparkles size={16} />
            {analyzing ? "Analyzing…" : "Extract nutrition"}
          </button>

          {provider && (
            <p className="mt-3 text-center text-xs text-[rgba(254,255,239,0.55)]">
              Analyzed via {provider}
            </p>
          )}
        </FeaturePanel>

        <Panel title="Review & save" icon={Camera} delay={0.08}>
          {notes && (
            <p className="mb-3 rounded-xl bg-[var(--citrus-tint)] px-3 py-2 text-sm text-[var(--ink-soft)]">
              {notes}
            </p>
          )}

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, mealType: m })}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                    form.mealType === m
                      ? "border-transparent bg-[var(--leaf)] text-[var(--cream)]"
                      : "border-[var(--line)] bg-white/50 text-[var(--ink-soft)] hover:bg-white/80"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              className="input"
              placeholder="Food name"
              value={String(form.name)}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              {REVIEW_FIELDS.map((field) => (
                <label key={field.key} className="text-xs text-[var(--ink-faint)]">
                  {field.label}
                  <input
                    className="input mt-1"
                    type={field.type}
                    value={form[field.key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]:
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-[var(--coral-tint)] px-3 py-2 text-sm text-[var(--coral)]">
              {error}
            </p>
          )}
          {message && (
            <p className="mt-3 rounded-xl bg-[var(--leaf-tint)] px-3 py-2 text-sm text-[var(--leaf)]">
              {message}
            </p>
          )}

          <button
            className="btn btn-primary mt-4 w-full"
            disabled={!form.name || busy}
            onClick={save}
          >
            Save meal
          </button>
        </Panel>
      </div>
    </AppShell>
  );
}
