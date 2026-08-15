"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  ChartColumn,
  MessageSquare,
  Salad,
  Target,
  Upload,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Overview", icon: ChartColumn },
  { href: "/meals", label: "Meals", icon: Salad },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/scan", label: "AI Scan", icon: Camera },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/import", label: "Import", icon: Upload },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ShellSkeleton() {
  return (
    <div className="relative min-h-screen">
      <div className="food-bg" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="skeleton h-20 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-[24px]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="skeleton h-72 rounded-[28px]" />
          <div className="skeleton h-72 rounded-[28px]" />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <ShellSkeleton />;

  return (
    <div className="relative min-h-screen">
      <div className="food-bg" aria-hidden="true" />
      <div
        className="aurora h-[420px] w-[420px] bg-[rgba(155,184,76,0.3)]"
        style={{ top: "-140px", left: "-120px" }}
      />
      <div
        className="aurora h-[360px] w-[360px] bg-[rgba(221,163,43,0.22)]"
        style={{ top: "10%", right: "-140px", animationDelay: "3s" }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col gap-5 px-4 pb-28 pt-5 md:gap-6 md:px-8 md:pb-10 md:pt-6">
        <header className="hero-surface hero-surface--bar sticky top-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-4 py-3.5 shadow-[var(--shadow)] md:top-4 md:gap-4 md:px-5 md:py-4">
          <Link href="/dashboard" className="group relative z-10 flex items-center gap-3">
            <motion.span
              whileHover={{ rotate: -6, scale: 1.06 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="display grid h-11 w-11 place-items-center rounded-2xl bg-[var(--cream)] text-xl text-[var(--leaf)] shadow-lg shadow-[rgba(20,30,10,0.35)]"
            >
              N
            </motion.span>
            <div>
              <p className="display text-2xl leading-none">Nourish</p>
              <p className="text-sm text-[rgba(254,255,239,0.66)]">
                Hi, {user.name}
              </p>
            </div>
          </Link>

          <nav className="relative z-10 hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "relative rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--cream)]"
                      : "text-[rgba(254,255,239,0.68)] hover:text-[var(--cream)]"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <Icon size={15} />
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            <span
              title={user.email}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/18 text-sm font-bold text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
            >
              {initials(user.name)}
            </span>
            <button
              className="btn btn-ghost-light px-3"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Out</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <nav className="hero-surface hero-surface--bar fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-[24px] px-2 py-2 shadow-[var(--shadow-lg)] md:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "relative z-10 flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "text-[var(--cream)]"
                  : "text-[rgba(254,255,239,0.62)]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill-mobile"
                  className="absolute inset-0 rounded-2xl bg-white/18 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
