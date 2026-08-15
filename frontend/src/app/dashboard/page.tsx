"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Activity,
  Camera,
  Droplets,
  Flame,
  Salad,
  Target,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  ChartTooltip,
  EmptyState,
  FeaturePanel,
  MetricTile,
  NutritionRing,
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import { useLiveQuery } from "@/lib/live";
import { CHART } from "@/lib/theme";

const MICRO_LABELS: Record<string, { label: string; unit: string; color: string }> = {
  fiber: { label: "Fiber", unit: "g", color: "var(--leaf)" },
  sugar: { label: "Sugar", unit: "g", color: "var(--citrus)" },
  sodium: { label: "Sodium", unit: "mg", color: "var(--coral)" },
  vitaminA: { label: "Vitamin A", unit: "µg", color: "var(--citrus)" },
  vitaminC: { label: "Vitamin C", unit: "mg", color: "var(--leaf-bright)" },
  calcium: { label: "Calcium", unit: "mg", color: "var(--berry)" },
  iron: { label: "Iron", unit: "mg", color: "var(--coral)" },
};

function axisDate(value: string) {
  try {
    return format(parseISO(value), "EEE d");
  } catch {
    return value;
  }
}

function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const { data, loading, error } = useLiveQuery(`reports:${days}`, () =>
    api.reports(days)
  );
  const { data: recentMeals } = useLiveQuery("meals:dashboard:recent", () =>
    api.getMeals({ page: 1, limit: 4 })
  );

  const goal = data?.activeGoal;
  const micros = data ? Object.entries(data.micronutrientSummary) : [];
  const maxMicro = Math.max(1, ...micros.map(([, v]) => v));
  const hasData = (data?.totals.calories ?? 0) > 0;

  const today = useMemo(() => {
    const key = todayKey();
    const row =
      data?.goalVsActual.find((d) => d.date === key) ??
      data?.goalVsActual[data.goalVsActual.length - 1];
    const macros = data?.macroBreakdown.find((d) => d.date === (row?.date ?? key));
    return {
      calories: row?.caloriesActual ?? 0,
      protein: macros?.protein ?? row?.proteinActual ?? 0,
      carbs: macros?.carbs ?? row?.carbsActual ?? 0,
      fat: macros?.fat ?? row?.fatActual ?? 0,
      date: row?.date ?? key,
    };
  }, [data]);

  const calorieGoal = goal?.dailyCalories ?? 2000;
  const remaining = Math.max(0, calorieGoal - today.calories);
  const axisStyle = { fontSize: 11, fill: "var(--ink-faint)" };

  return (
    <AppShell>
      <PageHeader
        title="Overview"
        subtitle={`Today’s intake and ${days}-day nutrition trends.`}
        actions={
          <div className="glass flex gap-1 rounded-full p-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  days === d
                    ? "bg-[var(--leaf)] text-[var(--cream)] shadow-md shadow-[var(--leaf-tint-strong)]"
                    : "text-[var(--ink-soft)] hover:bg-white/60"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <p className="mb-4 rounded-2xl bg-[var(--coral-tint)] px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </p>
      )}

      {!loading && !goal && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--citrus-line)] bg-[var(--citrus-tint)] px-4 py-3">
          <p className="text-sm text-[var(--ink-soft)]">
            No targets yet — set your calorie and macro goals to unlock progress
            rings and goal comparison.
          </p>
          <Link href="/goals" className="btn btn-primary py-2 text-sm">
            Set goals
          </Link>
        </div>
      )}

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <FeaturePanel>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(254,255,239,0.55)]">
                Today · {format(new Date(), "MMM d")}
              </p>
              <h2 className="display mt-1 text-3xl md:text-4xl">Daily nutrition</h2>
              <p className="mt-1 text-sm text-[rgba(254,255,239,0.68)]">
                Snap meals, check macros, and stay on top of your goals.
              </p>
            </div>
            <StatusBadge tone="success">Live sync</StatusBadge>
          </div>

          <div className="mt-6 grid items-center gap-6 md:grid-cols-[auto_1fr]">
            {loading ? (
              <div className="skeleton mx-auto h-44 w-44 rounded-full bg-white/10" />
            ) : (
              <div className="mx-auto">
                <NutritionRing
                  value={today.calories}
                  max={calorieGoal}
                  tone="dark"
                  remainingLabel={`${remaining.toLocaleString()} kcal left`}
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Carbs"
                value={today.carbs}
                unit="g"
                goal={goal?.carbsGrams}
                color={CHART.citrus}
                tone="dark"
                delay={0.05}
              />
              <MetricTile
                label="Protein"
                value={today.protein}
                unit="g"
                goal={goal?.proteinGrams}
                color={CHART.leafBright}
                tone="dark"
                delay={0.1}
              />
              <MetricTile
                label="Fat"
                value={today.fat}
                unit="g"
                goal={goal?.fatGrams}
                color={CHART.coral}
                tone="dark"
                delay={0.15}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/scan" className="btn btn-cream">
              <Camera size={16} />
              Snap a meal
            </Link>
            <Link href="/meals" className="btn btn-ghost-light border border-white/15">
              <Salad size={16} />
              Open diary
            </Link>
            <Link href="/goals" className="btn btn-ghost-light border border-white/15">
              <Target size={16} />
              Adjust goals
            </Link>
          </div>
        </FeaturePanel>

        <Panel
          title="Recent meals"
          icon={Salad}
          delay={0.08}
          action={
            <Link href="/meals" className="text-sm font-semibold text-[var(--leaf)]">
              View all
            </Link>
          }
        >
          <div className="space-y-2.5">
            {(recentMeals?.items ?? []).slice(0, 4).map((item) => (
              <div key={item.id} className="diary-item">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--leaf-tint)] text-[var(--leaf)]">
                  <Flame size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs text-[var(--ink-faint)]">
                        {item.mealType} · {format(new Date(item.eatenAt), "h:mm a")}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[var(--leaf)]">
                      {Math.round(item.calories)} kcal
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {!recentMeals?.items?.length && (
              <EmptyState message="No meals logged yet — snap or add your first entry." />
            )}
          </div>
        </Panel>
      </div>

      <SectionTitle title="Detailed analytics" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Calorie trend" icon={Flame} delay={0.05}>
          <div className="h-64">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.calorieTrend || []}>
                  <defs>
                    <linearGradient id="cal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.leafBright} stopOpacity={0.55} />
                      <stop offset="100%" stopColor={CHART.leafBright} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={axisDate} tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={38} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.cursorLine }} />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke={CHART.leaf}
                    strokeWidth={2.5}
                    fill="url(#cal)"
                    dot={{ r: 3, fill: CHART.leaf, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Log a meal to see your calorie trend." />
            )}
          </div>
        </Panel>

        <Panel title="Macros by day" icon={Activity} delay={0.1}>
          <div className="h-64">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.macroBreakdown || []} barGap={2}>
                  <CartesianGrid strokeDasharray="4 6" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={axisDate} tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={38} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: CHART.cursorFill }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="protein" stackId="a" fill={CHART.leaf} />
                  <Bar dataKey="carbs" stackId="a" fill={CHART.citrus} />
                  <Bar dataKey="fat" stackId="a" fill={CHART.coral} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Macro breakdown appears once you log meals." />
            )}
          </div>
        </Panel>

        <Panel title="Goal vs actual" icon={Target} delay={0.15}>
          <div className="h-64">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.goalVsActual || []}>
                  <CartesianGrid strokeDasharray="4 6" stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={axisDate} tick={axisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={38} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    name="Actual"
                    dataKey="caloriesActual"
                    stroke={CHART.leaf}
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 0, fill: CHART.leaf }}
                  />
                  <Line
                    type="monotone"
                    name="Goal"
                    dataKey="caloriesGoal"
                    stroke={CHART.citrus}
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Set a goal and log meals to compare." />
            )}
          </div>
        </Panel>

        <Panel title="Micronutrients" icon={Droplets} delay={0.2}>
          <div className="space-y-3">
            {micros.map(([key, value]) => {
              const meta = MICRO_LABELS[key] || {
                label: key,
                unit: "",
                color: "var(--leaf)",
              };
              return (
                <div key={key}>
                  <div className="mb-1 flex items-baseline justify-between text-sm">
                    <span className="text-[var(--ink-soft)]">{meta.label}</span>
                    <span className="font-semibold">
                      {value}
                      <span className="ml-0.5 text-xs text-[var(--ink-faint)]">
                        {meta.unit}
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--ink-tint)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(2, (value / maxMicro) * 100)}%`,
                        background: meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {micros.length === 0 && (
              <EmptyState message="Log meals to see micronutrients." />
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
