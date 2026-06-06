import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Brain, Target, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQuestions } from "@/lib/interview.functions";
import {
  ROLE_META,
  type Difficulty,
  type Role,
  saveSession,
  clearSession,
} from "@/lib/session-store";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PlacementPrep AI — Practice technical interviews with instant feedback" },
      {
        name: "description",
        content:
          "Realistic AI-driven mock interviews for engineering students. Get per-answer scores, strengths, gaps, and model answers in seconds.",
      },
      { property: "og:title", content: "PlacementPrep AI — AI Interview Simulator" },
      {
        property: "og:description",
        content: "Crack your campus placement with AI-powered mock interviews and instant feedback.",
      },
    ],
  }),
  component: LandingPage,
});

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Foundations & basics" },
  { value: "intermediate", label: "Intermediate", hint: "Most placement drives" },
  { value: "advanced", label: "Advanced", hint: "Product-based companies" },
];

function LandingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");

  const generate = useServerFn(generateQuestions);
  const mutation = useMutation({
    mutationFn: generate,
    onSuccess: (data, vars) => {
      const input = vars?.data as { role: Role; difficulty: Difficulty; count: number };
      saveSession({
        role: input.role,
        difficulty: input.difficulty,
        startedAt: Date.now(),
        questions: data.questions,
        answers: [],
        completed: false,
      });
      navigate({ to: "/interview" });
    },

    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      if (msg.includes("429")) toast.error("Rate limit reached — please try again in a moment.");
      else if (msg.includes("402"))
        toast.error("AI credits exhausted. Add credits to keep practicing.");
      else toast.error("Couldn't generate questions. Try again.");
    },
  });

  const start = () => {
    if (!role) return;
    clearSession();
    mutation.mutate({ data: { role, difficulty, count: 6 } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur sticky top-0 z-20 bg-background/80">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold tracking-tight">PlacementPrep</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">
            AI Interview Simulator
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Built for B.Tech & MCA placements
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Crack your interview with <span className="text-gradient">AI feedback</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick a role, answer realistic questions, and get an instant score with strengths, gaps,
            and the ideal answer — like having a senior engineer in your room.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            {[
              { Icon: Brain, t: "Role-specific Qs", d: "Tailored to your track" },
              { Icon: Target, t: "Per-answer scoring", d: "0–10 with rubric" },
              { Icon: Sparkles, t: "Model answers", d: "Learn the ideal" },
            ].map(({ Icon, t, d }) => (
              <div
                key={t}
                className="rounded-xl border border-border bg-card/60 backdrop-blur p-4 flex gap-3"
              >
                <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{t}</div>
                  <div className="text-xs text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selector */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card shadow-card p-6 md:p-10">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-semibold">Choose your track</h2>
            <span className="text-xs text-muted-foreground">Step 1 of 2</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.keys(ROLE_META) as Role[]).map((r) => {
              const meta = ROLE_META[r];
              const active = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`group text-left rounded-2xl border p-5 transition-all ${
                    active
                      ? "border-primary bg-card-gradient shadow-glow scale-[1.01]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-card"
                  }`}
                >
                  <div className="text-3xl mb-3">{meta.emoji}</div>
                  <div className="font-semibold">{meta.title}</div>
                  <p className="text-sm text-muted-foreground mt-1">{meta.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {meta.sample.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] rounded-full bg-secondary text-secondary-foreground px-2 py-0.5"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-lg font-semibold">Difficulty</h3>
              <span className="text-xs text-muted-foreground">Step 2 of 2</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`rounded-xl border p-3 text-center transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium text-sm">{d.label}</div>
                    <div className="text-[11px] text-muted-foreground">{d.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              6 questions · ~10 minutes · instant AI feedback
            </p>
            <Button
              size="lg"
              disabled={!role || mutation.isPending}
              onClick={start}
              className="bg-hero-gradient text-primary-foreground hover:opacity-95 shadow-glow"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing your interview…
                </>
              ) : (
                <>
                  Start interview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Your answers stay in this session only — nothing is stored.
        </p>
      </section>
    </div>
  );
}
