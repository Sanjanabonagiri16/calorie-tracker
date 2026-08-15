"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="display text-4xl md:text-5xl"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.08 }}
            className="mt-1 max-w-xl text-[var(--ink-soft)]"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  actionHref,
}: {
  title: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="display text-xl md:text-2xl">{title}</h2>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="text-sm font-semibold text-[var(--leaf)] transition hover:text-[var(--leaf-deep)]"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  icon: Icon,
  delay = 0,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  delay?: number;
  action?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx("glass card-hover rounded-[28px] p-5", className)}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--leaf-tint)] text-[var(--leaf)]">
                <Icon size={16} />
              </span>
            )}
            {title && <h2 className="display text-2xl">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Dark olive feature panel used for hero summaries and camera stages. */
export function FeaturePanel({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "hero-surface relative overflow-hidden rounded-[32px] p-5 shadow-[var(--shadow)] md:p-6",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}

export function ProgressRing({
  value,
  max,
  size = 62,
  color = "var(--leaf)",
  stroke = 6,
  track = "rgba(43,53,32,0.1)",
}: {
  value: number;
  max: number;
  size?: number;
  color?: string;
  stroke?: number;
  track?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={track}
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - ratio) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Large calorie ring with centered copy, matching the reference dashboard. */
export function NutritionRing({
  value,
  max,
  label = "kcal",
  remainingLabel,
  size = 180,
  tone = "light",
}: {
  value: number;
  max: number;
  label?: string;
  remainingLabel?: string;
  size?: number;
  tone?: "light" | "dark";
}) {
  const remaining = Math.max(0, Math.round(max - value));
  const dark = tone === "dark";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <ProgressRing
        value={value}
        max={Math.max(max, 1)}
        size={size}
        stroke={12}
        color={dark ? "#cbe09a" : "var(--leaf-bright)"}
        track={dark ? "rgba(255,255,255,0.14)" : "rgba(43,53,32,0.1)"}
      />
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p
            className={clsx(
              "display text-3xl leading-none md:text-4xl",
              dark ? "text-[var(--cream)]" : "text-[var(--ink)]"
            )}
          >
            {Math.round(value).toLocaleString()}
            <span
              className={clsx(
                "ml-1 text-base font-sans",
                dark ? "text-[rgba(254,255,239,0.6)]" : "text-[var(--ink-faint)]"
              )}
            >
              / {Math.round(max).toLocaleString()}
            </span>
          </p>
          <p
            className={clsx(
              "mt-1 text-xs font-semibold uppercase tracking-[0.16em]",
              dark ? "text-[rgba(254,255,239,0.55)]" : "text-[var(--ink-faint)]"
            )}
          >
            {label}
          </p>
          {remainingLabel !== undefined ? (
            <p
              className={clsx(
                "mt-2 text-sm font-medium",
                dark ? "text-[#cbe09a]" : "text-[var(--leaf)]"
              )}
            >
              {remainingLabel}
            </p>
          ) : max > 0 ? (
            <p
              className={clsx(
                "mt-2 text-sm font-medium",
                dark ? "text-[#cbe09a]" : "text-[var(--leaf)]"
              )}
            >
              {remaining.toLocaleString()} left
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  unit,
  goal,
  color = "var(--leaf)",
  tone = "light",
  delay = 0,
}: {
  label: string;
  value: number;
  unit: string;
  goal?: number | null;
  color?: string;
  tone?: "light" | "dark";
  delay?: number;
}) {
  const pct = goal && goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : null;
  const dark = tone === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={clsx(
        "rounded-2xl p-4",
        dark
          ? "bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          : "glass rounded-[22px]"
      )}
    >
      <p
        className={clsx(
          "text-xs font-semibold uppercase tracking-[0.14em]",
          dark ? "text-[rgba(254,255,239,0.6)]" : "text-[var(--ink-faint)]"
        )}
      >
        {label}
      </p>
      <p
        className={clsx(
          "display mt-1 text-2xl",
          dark ? "text-[var(--cream)]" : "text-[var(--ink)]"
        )}
      >
        {Math.round(value)}
        <span
          className={clsx(
            "ml-1 text-sm font-sans",
            dark ? "text-[rgba(254,255,239,0.55)]" : "text-[var(--ink-faint)]"
          )}
        >
          {goal ? `/ ${Math.round(goal)}${unit}` : unit}
        </span>
      </p>
      {pct !== null && (
        <div
          className={clsx(
            "mt-3 h-1.5 overflow-hidden rounded-full",
            dark ? "bg-white/15" : "bg-[var(--ink-tint)]"
          )}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${Math.max(4, pct)}%`, background: color }}
          />
        </div>
      )}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  unit,
  goal,
  color = "var(--leaf)",
  delay = 0,
}: {
  label: string;
  value: number | string;
  unit: string;
  goal?: number | null;
  color?: string;
  delay?: number;
}) {
  const numeric = typeof value === "number" ? value : 0;
  const pct = goal && goal > 0 ? Math.round((numeric / goal) * 100) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass card-hover flex items-center justify-between gap-3 rounded-[24px] p-5"
    >
      <div>
        <p className="text-sm text-[var(--ink-soft)]">{label}</p>
        <p className="display mt-1 text-3xl" style={{ color }}>
          {value}
          <span className="ml-1 font-sans text-base text-[var(--ink-faint)]">
            {unit}
          </span>
        </p>
        {pct !== null && (
          <span
            className="chip mt-2"
            style={{
              background: `color-mix(in srgb, ${color} 14%, transparent)`,
              color,
            }}
          >
            {pct}% of goal
          </span>
        )}
      </div>
      {goal ? (
        <div className="relative grid place-items-center">
          <ProgressRing value={numeric} max={goal} color={color} />
        </div>
      ) : null}
    </motion.div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger";
}) {
  const tones = {
    neutral: "bg-[var(--ink-tint)] text-[var(--ink-soft)]",
    success: "bg-[var(--leaf-tint)] text-[var(--leaf)]",
    warn: "bg-[var(--citrus-tint)] text-[var(--ink-soft)]",
    danger: "bg-[var(--coral-tint)] text-[var(--coral)]",
  };
  return (
    <span className={clsx("chip border border-transparent", tones[tone])}>
      {children}
    </span>
  );
}

export function StepRail({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="mb-5 flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li
            key={step}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              active
                ? "bg-[var(--leaf)] text-[var(--cream)]"
                : done
                  ? "bg-[var(--leaf-tint)] text-[var(--leaf)]"
                  : "bg-[var(--ink-tint)] text-[var(--ink-faint)]"
            )}
          >
            <span
              className={clsx(
                "grid h-5 w-5 place-items-center rounded-full text-[10px]",
                active || done ? "bg-white/20" : "bg-white/50"
              )}
            >
              {index + 1}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-[var(--line)] bg-white/30 px-6 py-10 text-center">
      <p className="text-sm text-[var(--ink-faint)]">{message}</p>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-2xl px-3 py-2 text-xs">
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: <strong>{Math.round(item.value)}</strong>
        </p>
      ))}
    </div>
  );
}
