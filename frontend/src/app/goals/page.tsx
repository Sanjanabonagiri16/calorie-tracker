"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  FeaturePanel,
  MetricTile,
  NutritionRing,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import { emitDataChange, useLiveQuery } from "@/lib/live";

const FIELDS = [
  { key: "dailyCalories", label: "Daily calories", unit: "kcal", color: "var(--leaf)" },
  { key: "proteinGrams", label: "Protein", unit: "g", color: "var(--leaf-bright)" },
  { key: "carbsGrams", label: "Carbs", unit: "g", color: "var(--citrus)" },
  { key: "fatGrams", label: "Fat", unit: "g", color: "var(--coral)" },
] as const;

const PRESETS = [
  {
    name: "Maintain",
    blurb: "Steady energy",
    dailyCalories: 2000,
    proteinGrams: 120,
    carbsGrams: 230,
    fatGrams: 65,
  },
  {
    name: "Cut",
    blurb: "Higher protein deficit",
    dailyCalories: 1700,
    proteinGrams: 150,
    carbsGrams: 150,
    fatGrams: 55,
  },
  {
    name: "Bulk",
    blurb: "Surplus for growth",
    dailyCalories: 2800,
    proteinGrams: 180,
    carbsGrams: 320,
    fatGrams: 85,
  },
];

export default function GoalsPage() {
  const [form, setForm] = useState({
    dailyCalories: 2000,
    proteinGrams: 150,
    carbsGrams: 200,
    fatGrams: 65,
    weightGoalKg: "" as number | "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, error: loadError, refresh } = useLiveQuery("goals:active", () =>
    api.getGoals()
  );
  const goal = data?.items[0] ?? null;

  const hydrated = useRef(false);
  useEffect(() => {
    if (!goal || hydrated.current) return;
    hydrated.current = true;
    setForm({
      dailyCalories: goal.dailyCalories,
      proteinGrams: goal.proteinGrams,
      carbsGrams: goal.carbsGrams,
      fatGrams: goal.fatGrams,
      weightGoalKg: goal.weightGoalKg ?? "",
    });
  }, [goal]);

  const macroCalories =
    form.proteinGrams * 4 + form.carbsGrams * 4 + form.fatGrams * 9;
  const drift = Math.round(macroCalories - form.dailyCalories);
  const balanced = Math.abs(drift) <= 50;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api.saveGoal({
        dailyCalories: Number(form.dailyCalories),
        proteinGrams: Number(form.proteinGrams),
        carbsGrams: Number(form.carbsGrams),
        fatGrams: Number(form.fatGrams),
        weightGoalKg:
          form.weightGoalKg === "" ? null : Number(form.weightGoalKg),
      });
      await refresh();
      emitDataChange();
      setMessage("Goals updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Goals"
        subtitle="Visual targets for calories, macros, and optional weight."
      />

      <FeaturePanel className="mb-6">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <div className="mx-auto">
            <NutritionRing
              value={macroCalories}
              max={Math.max(form.dailyCalories, 1)}
              label="macro kcal"
              tone="dark"
              remainingLabel={
                balanced
                  ? "Balanced with calorie target"
                  : `${Math.abs(drift)} kcal ${drift > 0 ? "over" : "under"}`
              }
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(254,255,239,0.55)]">
                Target preview
              </p>
              <StatusBadge tone={balanced ? "success" : "warn"}>
                {balanced ? "In range" : "Needs tuning"}
              </StatusBadge>
            </div>
            <h2 className="display mt-1 text-3xl md:text-4xl">
              {form.dailyCalories.toLocaleString()} kcal / day
            </h2>
            <p className="mt-2 text-sm text-[rgba(254,255,239,0.68)]">
              Macros currently add up to {Math.round(macroCalories).toLocaleString()}{" "}
              kcal
              {form.weightGoalKg !== ""
                ? ` · weight goal ${form.weightGoalKg} kg`
                : ""}
              .
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Protein"
                value={form.proteinGrams}
                unit="g"
                color="var(--leaf-bright)"
                tone="dark"
              />
              <MetricTile
                label="Carbs"
                value={form.carbsGrams}
                unit="g"
                color="var(--citrus)"
                tone="dark"
              />
              <MetricTile
                label="Fat"
                value={form.fatGrams}
                unit="g"
                color="var(--coral)"
                tone="dark"
              />
            </div>
          </div>
        </div>
      </FeaturePanel>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Panel title="Your targets" icon={Target}>
          <form onSubmit={onSave} className="grid gap-4">
            {FIELDS.map((field) => (
              <label key={field.key} className="text-sm text-[var(--ink-soft)]">
                <span className="flex items-baseline justify-between">
                  {field.label}
                  <span className="text-xs text-[var(--ink-faint)]">
                    {field.unit}
                  </span>
                </span>
                <input
                  className="input mt-1"
                  type="number"
                  step="any"
                  min={0}
                  value={form[field.key]}
                  onChange={(e) =>
                    setForm({ ...form, [field.key]: Number(e.target.value) })
                  }
                  required
                />
              </label>
            ))}

            <label className="text-sm text-[var(--ink-soft)]">
              <span className="flex items-baseline justify-between">
                Weight goal
                <span className="text-xs text-[var(--ink-faint)]">
                  kg · optional
                </span>
              </span>
              <input
                className="input mt-1"
                type="number"
                step="any"
                min={0}
                value={form.weightGoalKg}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weightGoalKg:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </label>

            {(error || loadError) && (
              <p className="rounded-xl bg-[var(--coral-tint)] px-3 py-2 text-sm text-[var(--coral)]">
                {error || loadError}
              </p>
            )}
            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl bg-[var(--leaf-tint)] px-3 py-2 text-sm text-[var(--leaf)]"
              >
                <Check size={15} />
                {message}
              </motion.p>
            )}

            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Save goals"}
            </button>

            {goal && (
              <p className="text-center text-xs text-[var(--ink-faint)]">
                Previous goals stay inactive for history.
              </p>
            )}
          </form>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel title="Quick presets" delay={0.08}>
            <div className="grid gap-2">
              {PRESETS.map((preset) => {
                const active =
                  form.dailyCalories === preset.dailyCalories &&
                  form.proteinGrams === preset.proteinGrams &&
                  form.carbsGrams === preset.carbsGrams &&
                  form.fatGrams === preset.fatGrams;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        dailyCalories: preset.dailyCalories,
                        proteinGrams: preset.proteinGrams,
                        carbsGrams: preset.carbsGrams,
                        fatGrams: preset.fatGrams,
                      })
                    }
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-[var(--leaf)] bg-[var(--leaf-tint)]"
                        : "border-[var(--line)] bg-white/50 hover:border-[var(--leaf-bright)] hover:bg-white/85"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{preset.name}</span>
                      <span className="text-xs text-[var(--ink-faint)]">
                        {preset.dailyCalories} kcal
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">
                      {preset.blurb} · P{preset.proteinGrams} / C
                      {preset.carbsGrams} / F{preset.fatGrams}
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Macro balance" delay={0.14}>
            <p className="text-sm text-[var(--ink-soft)]">
              Your macros add up to{" "}
              <strong className="text-[var(--ink)]">
                {Math.round(macroCalories)} kcal
              </strong>
              .
            </p>
            <p
              className="mt-2 text-sm"
              style={{
                color: balanced ? "var(--leaf)" : "var(--citrus)",
              }}
            >
              {balanced
                ? "Nicely balanced against your calorie target."
                : `${drift > 0 ? "Over" : "Under"} your calorie target by ${Math.abs(drift)} kcal.`}
            </p>

            <div className="mt-4 flex h-3 overflow-hidden rounded-full">
              {[
                { value: form.proteinGrams * 4, color: "var(--leaf)" },
                { value: form.carbsGrams * 4, color: "var(--citrus)" },
                { value: form.fatGrams * 9, color: "var(--coral)" },
              ].map((seg, i) => (
                <div
                  key={i}
                  style={{
                    width: `${
                      macroCalories ? (seg.value / macroCalories) * 100 : 0
                    }%`,
                    background: seg.color,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-[var(--ink-faint)]">
              <span>Protein</span>
              <span>Carbs</span>
              <span>Fat</span>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
