"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  MessageSquare,
  Salad,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const HIGHLIGHTS = [
  { icon: Salad, title: "Log every meal", body: "Breakfast to dinner, with date and meal filters." },
  { icon: TrendingUp, title: "See the trend", body: "Weekly calories, macros, and goal comparison." },
  { icon: Camera, title: "Scan a photo", body: "AI reads nutrition labels and plates for you." },
  { icon: MessageSquare, title: "Just ask", body: "Log meals and get summaries by chatting." },
];

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  function switchMode(next: "login" | "register") {
    setMode(next);
    setError("");
    setHint("");
    if (next === "register") setSuccess("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setHint("");
    setSuccess("");
    try {
      if (mode === "login") {
        await login(email, password);
        router.push("/dashboard");
        return;
      }

      await register(name, email, password);
      setSuccess("Account created successfully. Log in with your email and password.");
      setMode("login");
      setName("");
      setPassword("");
      setHint("Use the same email you just signed up with.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
        setHint("No account yet? Switch to Sign up to create one.");
      } else if (err instanceof ApiError && err.status === 409) {
        setError("That email is already registered.");
        setHint("Switch to Log in to access your account.");
        setMode("login");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Check your details — password must be at least 6 characters.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="hero-surface hidden px-12 py-14 lg:flex lg:flex-col lg:justify-between">
        <motion.div
          className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-[rgba(221,163,43,0.32)] blur-[90px]"
          animate={{ y: [0, 28, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[rgba(155,184,76,0.45)] blur-[90px]"
          animate={{ y: [0, -24, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <div className="pointer-events-none absolute -right-24 top-[22%] h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 top-[28%] h-44 w-44 rounded-full border border-white/10" />
        <motion.span
          className="pointer-events-none absolute right-24 top-[34%] h-3 w-3 rounded-full bg-[#dda32b] shadow-[0_0_24px_rgba(221,163,43,0.85)]"
          animate={{ scale: [1, 1.5, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <span className="display grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-xl backdrop-blur">
            N
          </span>
          <span className="text-sm uppercase tracking-[0.28em] text-white/70">
            Personal nutrition
          </span>
        </motion.div>

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="display text-7xl leading-[0.95] xl:text-8xl"
          >
            Nourish
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-white/75"
          >
            Track what you eat, hit your macros, and let AI handle the tedious
            part of logging.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {["AI-powered", "Private by design", "Live insights"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/75 backdrop-blur"
              >
                {item}
              </span>
            ))}
          </motion.div>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.12]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[#cbe09a] transition group-hover:bg-white/15">
                    <Icon size={16} />
                  </span>
                  <p className="mt-2 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/60">
                    {item.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-12">
        <div className="aurora h-[380px] w-[380px] bg-[rgba(155,184,76,0.24)]" style={{ top: "-120px", right: "-100px" }} />
        <div className="aurora h-[320px] w-[320px] bg-[rgba(221,163,43,0.2)]" style={{ bottom: "-100px", left: "-80px", animationDelay: "4s" }} />

        <motion.form
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={onSubmit}
          className="glass relative z-10 w-full max-w-md overflow-hidden rounded-[32px] p-8 shadow-[var(--shadow-lg)]"
        >
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--leaf-bright)] to-transparent opacity-70" />
          {/* Compact branding for viewports where the side panel is hidden */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="display grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[var(--leaf-deep)] to-[var(--leaf-bright)] text-xl text-[var(--cream)] shadow-lg shadow-[rgba(53,73,28,0.3)]">
              N
            </span>
            <div>
              <p className="display text-2xl leading-none">Nourish</p>
              <p className="text-xs text-[var(--ink-faint)]">
                Personal calorie tracker
              </p>
            </div>
          </div>

          <div className="mb-7 flex gap-1 rounded-full bg-[var(--ink-tint)] p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`relative flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  mode === m ? "text-[var(--cream)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {mode === m && (
                  <motion.span
                    layoutId="auth-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--leaf-deep)] to-[var(--leaf-bright)] shadow-md shadow-[rgba(53,73,28,0.28)]"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">
                  {m === "login" ? "Log in" : "Sign up"}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 10 : -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--leaf)]">
                {mode === "login" ? "Continue your journey" : "A healthier routine starts here"}
              </p>
              <h2 className="display text-4xl">
                {mode === "login" ? "Welcome back" : "Start tracking"}
              </h2>
              <p className="mt-2 text-sm text-[var(--ink-soft)]">
                {mode === "login"
                  ? "Log in to pick up where you left off."
                  : "Create an account — your data stays private to you."}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 space-y-3">
            <AnimatePresence initial={false}>
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={User}
                    label="Your name"
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Field
              icon={Mail}
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              icon={Lock}
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={setPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ink-faint)] transition hover:bg-[var(--ink-tint)] hover:text-[var(--ink)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </div>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex gap-3 rounded-2xl border border-[rgba(125,154,79,0.34)] bg-[var(--leaf-tint)] px-4 py-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--leaf)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--leaf)]">{success}</p>
                    {hint && (
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">{hint}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-[var(--coral-line)] bg-[var(--coral-tint)] px-4 py-3">
                  <p className="text-sm font-medium text-[var(--coral)]">{error}</p>
                  {hint && (
                    <p className="mt-1 text-xs text-[var(--ink-soft)]">{hint}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="btn btn-primary group mt-6 w-full py-3.5" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                {mode === "login" ? "Logging you in…" : "Creating account…"}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {mode === "login" ? "Log in" : "Create account"}
                <ArrowRight
                  size={16}
                  className="ml-1 transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            className="mx-auto mt-5 block text-center text-xs text-[var(--ink-faint)] transition hover:text-[var(--leaf)]"
          >
            {mode === "login" ? (
              <>
                New here? <strong className="font-semibold text-[var(--leaf)]">Create an account</strong>
              </>
            ) : (
              <>
                Already have an account? <strong className="font-semibold text-[var(--leaf)]">Log in</strong>
              </>
            )}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-[var(--line)] pt-5 text-[11px] text-[var(--ink-faint)]">
            <ShieldCheck size={14} className="text-[var(--leaf)]" />
            Encrypted sign-in · Your nutrition data stays private
          </div>
        </motion.form>
      </section>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  right,
  value,
  onChange,
  ...props
}: {
  icon: typeof Mail;
  label: string;
  right?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--ink-soft)]">
        {label}
      </span>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--ink-faint)]"
        />
        <input
          {...props}
          className={`input input-icon ${right ? "input-action" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {right && (
          <span className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2">
            {right}
          </span>
        )}
      </div>
    </label>
  );
}
