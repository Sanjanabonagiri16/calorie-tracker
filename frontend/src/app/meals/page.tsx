"use client";

import { useMemo, useState } from "react";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  EmptyState,
  FeaturePanel,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import { emitDataChange, useLiveQuery } from "@/lib/live";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACKS"] as const;

const MEAL_COLORS: Record<string, string> = {
  BREAKFAST: "var(--citrus)",
  LUNCH: "var(--leaf)",
  DINNER: "var(--berry)",
  SNACKS: "var(--coral)",
};

const MEAL_TEXT: Record<string, string> = {
  BREAKFAST: "var(--ink)",
  LUNCH: "var(--cream)",
  DINNER: "var(--cream)",
  SNACKS: "var(--cream)",
};

const MACRO_FIELDS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
  "vitaminA",
  "vitaminC",
  "calcium",
  "iron",
] as const;

const emptyForm = {
  mealType: "BREAKFAST" as (typeof MEAL_TYPES)[number],
  name: "",
  quantity: 1,
  unit: "serving",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  vitaminA: 0,
  vitaminC: 0,
  calcium: 0,
  iron: 0,
  eatenAt: new Date().toISOString().slice(0, 16),
};

export default function MealsPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mealType, setMealType] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [removingIds, setRemovingIds] = useState<string[]>([]);

  const {
    data,
    loading,
    error: loadError,
    refresh,
  } = useLiveQuery(`meals:${page}:${from}:${to}:${mealType}`, () =>
    api.getMeals({
      page,
      limit: 10,
      from: from ? startOfDay(parseISO(from)).toISOString() : undefined,
      to: to ? endOfDay(parseISO(to)).toISOString() : undefined,
      mealType: mealType || undefined,
    })
  );

  const items = (data?.items ?? []).filter(
    (item) => !removingIds.includes(item.id)
  );
  const pagination = data?.pagination ?? null;

  const pageSummary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [items]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const key = format(new Date(item.eatenAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items]);

  async function load() {
    await refresh();
    emitDataChange();
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createMeal({
        ...form,
        quantity: Number(form.quantity),
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        fiber: Number(form.fiber),
        sugar: Number(form.sugar),
        sodium: Number(form.sodium),
        vitaminA: Number(form.vitaminA),
        vitaminC: Number(form.vitaminC),
        calcium: Number(form.calcium),
        iron: Number(form.iron),
        eatenAt: new Date(form.eatenAt).toISOString(),
      });
      setForm({ ...emptyForm, eatenAt: new Date().toISOString().slice(0, 16) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save meal");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setRemovingIds((prev) => [...prev, id]);
    try {
      await api.deleteMeal(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setRemovingIds((prev) => prev.filter((removed) => removed !== id));
    }
  }

  const filtersActive = Boolean(from || to || mealType);

  return (
    <AppShell>
      <PageHeader
        title="Meals"
        subtitle="Diary-style log with filters by date and meal type."
      />

      <FeaturePanel className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(254,255,239,0.55)]">
              Visible page
            </p>
            <h2 className="display mt-1 text-3xl">
              {Math.round(pageSummary.calories).toLocaleString()} kcal
            </h2>
            <p className="mt-1 text-sm text-[rgba(254,255,239,0.68)]">
              {items.length} {items.length === 1 ? "entry" : "entries"} on this page
            </p>
          </div>
          <div className="metric-row w-full max-w-md">
            {[
              { label: "Protein", value: pageSummary.protein },
              { label: "Carbs", value: pageSummary.carbs },
              { label: "Fat", value: pageSummary.fat },
              { label: "Meals", value: items.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/10 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
              >
                <p className="display text-xl text-[var(--cream)]">
                  {Math.round(item.value)}
                  {item.label !== "Meals" && (
                    <span className="ml-1 text-xs font-sans text-[rgba(254,255,239,0.55)]">
                      g
                    </span>
                  )}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(254,255,239,0.55)]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FeaturePanel>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel title="Food diary" icon={Filter}>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-[var(--ink-faint)]">
              From
              <input
                className="input mt-1"
                type="date"
                value={from}
                onChange={(e) => {
                  setPage(1);
                  setFrom(e.target.value);
                }}
              />
            </label>
            <label className="text-xs text-[var(--ink-faint)]">
              To
              <input
                className="input mt-1"
                type="date"
                value={to}
                onChange={(e) => {
                  setPage(1);
                  setTo(e.target.value);
                }}
              />
            </label>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {["", ...MEAL_TYPES].map((m) => (
              <button
                key={m || "all"}
                onClick={() => {
                  setPage(1);
                  setMealType(m);
                }}
                className={`chip border transition ${
                  mealType === m
                    ? "border-transparent bg-[var(--leaf)] text-[var(--cream)]"
                    : "border-[var(--line)] bg-white/50 text-[var(--ink-soft)] hover:bg-white/80"
                }`}
              >
                {m || "All"}
              </button>
            ))}
            {filtersActive && (
              <button
                className="chip border border-[var(--line)] bg-white/50 text-[var(--coral)]"
                onClick={() => {
                  setFrom("");
                  setTo("");
                  setMealType("");
                  setPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>

          {(error || loadError) && (
            <p className="mb-3 rounded-xl bg-[var(--coral-tint)] px-3 py-2 text-sm text-[var(--coral)]">
              {error || loadError}
            </p>
          )}

          <div className="space-y-5">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}

            <AnimatePresence initial={false}>
              {!loading &&
                grouped.map(([day, dayItems]) => {
                  const dayCalories = dayItems.reduce(
                    (sum, item) => sum + item.calories,
                    0
                  );
                  return (
                    <motion.div
                      key={day}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--ink-soft)]">
                          {format(parseISO(`${day}T12:00:00`), "EEEE, MMM d")}
                        </p>
                        <StatusBadge tone="success">
                          {Math.round(dayCalories)} kcal
                        </StatusBadge>
                      </div>
                      <div className="space-y-2.5">
                        {dayItems.map((item) => (
                          <div key={item.id} className="diary-item group">
                            <span
                              className="mt-1 h-11 w-1.5 shrink-0 rounded-full"
                              style={{ background: MEAL_COLORS[item.mealType] }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">{item.name}</p>
                                  <p className="text-sm text-[var(--ink-faint)]">
                                    {item.mealType} ·{" "}
                                    {format(new Date(item.eatenAt), "h:mm a")} ·{" "}
                                    {item.quantity} {item.unit}
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <p className="text-sm font-semibold text-[var(--leaf)]">
                                    {Math.round(item.calories)} kcal
                                  </p>
                                  <button
                                    className="btn btn-ghost px-2 opacity-0 transition group-hover:opacity-100"
                                    onClick={() => onDelete(item.id)}
                                    aria-label={`Delete ${item.name}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                                <span className="chip bg-[var(--leaf-tint-soft)] text-[var(--ink-soft)]">
                                  P {item.protein}
                                </span>
                                <span className="chip bg-[var(--citrus-tint)] text-[var(--ink-soft)]">
                                  C {item.carbs}
                                </span>
                                <span className="chip bg-[var(--coral-tint)] text-[var(--ink-soft)]">
                                  F {item.fat}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>

            {!loading && items.length === 0 && (
              <EmptyState message="No meals in this range yet." />
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span className="text-sm text-[var(--ink-faint)]">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
                entries
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </Panel>

        <Panel title="Add meal" icon={Plus} delay={0.08}>
          <form onSubmit={onCreate} className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, mealType: m })}
                  className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                    form.mealType === m
                      ? "border-transparent"
                      : "border-[var(--line)] bg-white/50 text-[var(--ink-soft)] hover:bg-white/80"
                  }`}
                  style={
                    form.mealType === m
                      ? { background: MEAL_COLORS[m], color: MEAL_TEXT[m] }
                      : undefined
                  }
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              className="input"
              placeholder="Food name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                type="number"
                step="any"
                placeholder="Qty"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: Number(e.target.value) })
                }
              />
              <input
                className="input"
                placeholder="Unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>

            <input
              className="input"
              type="datetime-local"
              value={form.eatenAt}
              onChange={(e) => setForm({ ...form, eatenAt: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              {MACRO_FIELDS.map((key) => (
                <label
                  key={key}
                  className="text-xs capitalize text-[var(--ink-faint)]"
                >
                  {key}
                  <input
                    className="input mt-1"
                    type="number"
                    step="any"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>

            <button className="btn btn-primary mt-1" disabled={busy}>
              {busy ? "Saving…" : "Save meal"}
            </button>
          </form>
        </Panel>
      </div>
    </AppShell>
  );
}
