"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

/** Entry gate: authenticated users go to the dashboard, everyone else logs in first. */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  return (
    <div className="grid min-h-screen place-items-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.span
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="display grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-[var(--leaf-deep)] to-[var(--leaf-bright)] text-3xl text-[var(--cream)] shadow-xl shadow-[rgba(53,73,28,0.3)]"
        >
          N
        </motion.span>
        <p className="display text-2xl">Nourish</p>
        <p className="text-sm text-[var(--ink-faint)]">Preparing your kitchen…</p>
      </motion.div>
    </div>
  );
}
