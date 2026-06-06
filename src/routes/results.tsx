import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, loadSession, ROLE_META, type InterviewSession } from "@/lib/session-store";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Results · PlacementPrep AI" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.answers.length === 0) {
      navigate({ to: "/" });
      return;
    }
    setSession(s);
  }, [navigate]);

  if (!session) return null;

  const total = session.answers.reduce((a, b) => a + b.evaluation.score, 0);
  const max = session.answers.length * 10;
  const pct = Math.round((total / max) * 100);
  const meta = ROLE_META[session.role];

  const band =
    pct >= 80
      ? { label: "Interview Ready", color: "text-success", bg: "bg-success/10", emoji: "🚀" }
      : pct >= 55
        ? { label: "Good — keep polishing", color: "text-warning", bg: "bg-warning/15", emoji: "✨" }
        : { label: "Needs Work", color: "text-destructive", bg: "bg-destructive/10", emoji: "💪" };

  const restart = () => {
    clearSession();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 sticky top-0 z-10 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-hero-gradient grid place-items-center shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold tracking-tight">PlacementPrep</span>
          </Link>
          <Button variant="outline" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4 mr-2" /> New session
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        {/* Headline card */}
        <div className="rounded-3xl border border-border bg-card-gradient shadow-card p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-4">{band.emoji}</div>
            <div className="text-sm text-muted-foreground">
              {meta.title} · <span className="capitalize">{session.difficulty}</span>
            </div>
            <div className="mt-4 flex items-baseline justify-center gap-2">
              <span className="text-7xl md:text-8xl font-bold font-display text-gradient">
                {pct}
              </span>
              <span className="text-2xl text-muted-foreground">/ 100</span>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium mt-5 ${band.bg} ${band.color}`}
            >
              <Award className="h-4 w-4" />
              {band.label}
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              {total} of {max} points across {session.answers.length} questions
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="rounded-3xl border border-border bg-card shadow-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold">Question breakdown</h2>
          </div>
          <div className="divide-y divide-border">
            {session.answers.map((a, i) => {
              const s = a.evaluation.score;
              const color =
                s >= 7 ? "text-success" : s >= 5 ? "text-warning" : "text-destructive";
              return (
                <div key={i} className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 h-12 w-12 rounded-xl bg-secondary grid place-items-center font-display font-bold ${color}`}
                    >
                      {s}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                          {a.question.category}
                        </span>
                        {a.skipped && (
                          <span className="rounded-full bg-muted px-2 py-0.5">Skipped</span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-snug">{a.question.question}</p>
                      {a.evaluation.improvements.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {a.evaluation.improvements[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={restart}
            className="bg-hero-gradient text-primary-foreground shadow-glow"
          >
            Practice another round <RotateCcw className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </main>
    </div>
  );
}
