"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Flame,
  ListChecks,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  FeaturePanel,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { api } from "@/lib/api";
import { emitDataChange } from "@/lib/live";

type Msg = { id: string; role: string; content: string };

const PROMPT_GROUPS = [
  {
    title: "Log meals",
    icon: Flame,
    prompts: [
      "Log lunch: grilled chicken 350 calories, 40g protein",
      "I ate oatmeal with banana for breakfast",
    ],
  },
  {
    title: "Goals",
    icon: Target,
    prompts: [
      "Set my goal to 2,000 calories and 140g protein",
      "What are my current goals?",
    ],
  },
  {
    title: "Insights",
    icon: ListChecks,
    prompts: ["Show my latest meals", "Summarize my week"],
  },
];

function TypingDots() {
  return (
    <div className="flex w-16 items-center justify-center gap-1 rounded-2xl bg-white/70 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--leaf)]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastActions, setLastActions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getChat()
      .then((res) => setMessages(res.items))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, lastActions]);

  async function submit(text: string) {
    if (!text.trim() || busy) return;
    setInput("");
    setBusy(true);
    setError("");
    setLastActions([]);
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "user", content: text },
    ]);
    try {
      const res = await api.sendChat(text);
      setMessages((m) => [...m, res.message]);
      setLastActions(res.actions.map((action) => action.message).filter(Boolean));
      if (res.dataChanged) emitDataChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Chat"
        subtitle="Log, edit, list, and delete meals; manage goals; or ask nutrition questions."
      />

      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <FeaturePanel delay={0.05}>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--cream)] text-[var(--leaf)]">
              <Bot size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(254,255,239,0.55)]">
                Assistant
              </p>
              <h2 className="display text-3xl">Nourish Chat</h2>
              <p className="mt-2 text-sm leading-relaxed text-[rgba(254,255,239,0.7)]">
                Ask in plain English — meals, goals, weekly summaries, and nutrition
                answers without leaving the conversation.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {PROMPT_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[rgba(254,255,239,0.55)]">
                    <Icon size={12} />
                    {group.title}
                  </p>
                  <div className="grid gap-2">
                    {group.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => submit(prompt)}
                        disabled={busy}
                        className="rounded-2xl bg-white/10 px-3 py-2.5 text-left text-sm text-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition hover:bg-white/16 disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </FeaturePanel>

        <div className="glass flex h-[70vh] flex-col rounded-[28px] p-4">
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-semibold text-[var(--ink-soft)]">Conversation</p>
            <StatusBadge tone={busy ? "warn" : "success"}>
              {busy ? "Thinking…" : "Ready"}
            </StatusBadge>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-1 py-1">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex max-w-[90%] gap-2 ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : ""
                  }`}
                >
                  <span
                    className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      m.role === "user"
                        ? "bg-[var(--leaf)] text-[var(--cream)]"
                        : "bg-[var(--leaf-tint)] text-[var(--leaf)]"
                    }`}
                  >
                    {m.role === "user" ? "You" : <Sparkles size={14} />}
                  </span>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "rounded-br-md bg-gradient-to-br from-[var(--leaf-deep)] to-[var(--leaf)] text-[var(--cream)]"
                        : "rounded-bl-md bg-white/75 text-[var(--ink)]"
                    }`}
                  >
                    {m.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {busy && <TypingDots />}

            {lastActions.length > 0 && (
              <div className="rounded-2xl border border-[var(--leaf-bright)]/25 bg-[var(--leaf-tint)] px-3 py-2">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--leaf)]">
                  Actions taken
                </p>
                <ul className="space-y-1 text-sm text-[var(--leaf)]">
                  {lastActions.map((action) => (
                    <li key={action}>• {action}</li>
                  ))}
                </ul>
              </div>
            )}

            {messages.length === 0 && !busy && (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--leaf-tint)] text-[var(--leaf)]">
                    <Sparkles size={20} />
                  </span>
                  <p className="display text-xl">Manage Nourish by chatting</p>
                  <p className="mt-1 text-sm text-[var(--ink-faint)]">
                    Pick a prompt on the left or type your own request.
                  </p>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && <p className="px-2 text-sm text-[var(--coral)]">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="composer-bar mt-3"
          >
            <input
              className="input"
              placeholder="Message Nourish…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              className="btn btn-primary shrink-0 rounded-full px-4"
              disabled={busy || !input.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
