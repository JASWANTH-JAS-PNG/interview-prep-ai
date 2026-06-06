import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, CheckCircle2, Loader2, SkipForward, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { evaluateAnswer } from "@/lib/interview.functions";
import {
  loadSession,
  ROLE_META,
  saveSession,
  type Evaluation,
  type InterviewSession,
} from "@/lib/session-store";
import { toast } from "sonner";

export const Route = createFileRoute("/interview")({
  head: () => ({ meta: [{ title: "Interview · PlacementPrep AI" }] }),
  component: InterviewPage,
});

function InterviewPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [lastEval, setLastEval] = useState<Evaluation | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.questions.length === 0) {
      navigate({ to: "/" });
      return;
    }
    setSession(s);
  }, [navigate]);

  const evalFn = useServerFn(evaluateAnswer);
  const mutation = useMutation({
    mutationFn: evalFn,
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429")) toast.error("Rate limit reached — please wait a moment.");
      else if (msg.includes("402")) toast.error("AI credits exhausted.");
      else toast.error("Couldn't evaluate that answer. Try again.");
    },
  });

  if (!session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const idx = session.answers.length;
  const total = session.questions.length;
  const done = idx >= total;
  const current = session.questions[idx];
  const meta = ROLE_META[session.role];

  const commit = (evaluation: Evaluation, userAnswer: string, skipped: boolean) => {
    const updated: InterviewSession = {
      ...session,
      answers: [
        ...session.answers,
        { question: current, answer: userAnswer, skipped, evaluation },
      ],
    };
    if (updated.answers.length === total) updated.completed = true;
    setSession(updated);
    saveSession(updated);
    setLastEval(evaluation);
  };

  const submit = async () => {
    if (!answer.trim()) {
      toast.error("Write something or skip the question.");
      return;
    }
    const res = await mutation.mutateAsync({
      data: {
        role: session.role,
        difficulty: session.difficulty,
        question: current.question,
        keywords: current.keywords,
        answer,
      },
    });
    commit(res, answer, false);
  };

  const skip = () => {
    commit(
      {
        score: 0,
        strengths: [],
        improvements: ["Question was skipped."],
        modelAnswer: "",
        coverage: current.keywords.map((k) => ({ keyword: k, covered: false })),
      },
      "",
      true,
    );
  };

  const next = () => {
    setAnswer("");
    setLastEval(null);
  };

  const finish = () => navigate({ to: "/results" });

  const progressPct = (idx / total) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border/60 sticky top-0 z-10 bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center gap-4">
          <div className="text-2xl">{meta.emoji}</div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-medium">{meta.title}</div>
              <div className="text-xs text-muted-foreground">
                Question {Math.min(idx + 1, total)} of {total}
              </div>
            </div>
            <Progress value={progressPct} className="h-1.5 mt-1.5" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {done ? (
          <div className="rounded-3xl border border-border bg-card-gradient p-10 text-center shadow-card">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-2xl font-semibold mt-4">Interview complete</h2>
            <p className="text-muted-foreground mt-2">Let's see how you did.</p>
            <Button onClick={finish} size="lg" className="mt-6 bg-hero-gradient text-primary-foreground shadow-glow">
              See results <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : !lastEval ? (
          <div className="rounded-3xl border border-border bg-card shadow-card p-6 md:p-8">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                {current.category}
              </span>
              <span className="text-muted-foreground capitalize">{session.difficulty}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold mt-4 leading-snug">
              {current.question}
            </h2>

            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here. Be specific — explain the why, not just the what."
              className="mt-6 min-h-[200px] resize-y text-base"
              disabled={mutation.isPending}
            />

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={skip}
                disabled={mutation.isPending}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <SkipForward className="h-4 w-4" /> Skip (0 score)
              </button>
              <Button
                onClick={submit}
                disabled={mutation.isPending}
                size="lg"
                className="bg-hero-gradient text-primary-foreground shadow-glow w-full sm:w-auto"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Evaluating…
                  </>
                ) : (
                  <>Submit answer</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <FeedbackCard
            evaluation={lastEval}
            question={current.question}
            onNext={next}
            isLast={idx + 1 === total}
            onFinish={finish}
          />
        )}
      </main>
    </div>
  );
}

function FeedbackCard({
  evaluation,
  question,
  onNext,
  isLast,
  onFinish,
}: {
  evaluation: Evaluation;
  question: string;
  onNext: () => void;
  isLast: boolean;
  onFinish: () => void;
}) {
  const band =
    evaluation.score >= 9
      ? { label: "Excellent", color: "text-success", bg: "bg-success/10" }
      : evaluation.score >= 7
        ? { label: "Good", color: "text-success", bg: "bg-success/10" }
        : evaluation.score >= 5
          ? { label: "Average", color: "text-warning", bg: "bg-warning/15" }
          : { label: "Needs work", color: "text-destructive", bg: "bg-destructive/10" };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-6 md:p-8 bg-card-gradient">
          <div className="text-xs text-muted-foreground mb-2">Your question</div>
          <p className="font-medium">{question}</p>
        </div>

        <div className="p-6 md:p-8 border-t border-border">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Score</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold font-display">{evaluation.score}</span>
                <span className="text-muted-foreground">/ 10</span>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${band.bg} ${band.color}`}
            >
              {band.label}
            </span>
          </div>
        </div>

        {evaluation.coverage.length > 0 && (
          <div className="p-6 md:p-8 border-t border-border">
            <div className="text-sm font-semibold mb-3">Concept coverage</div>
            <div className="flex flex-wrap gap-2">
              {evaluation.coverage.map((c) => (
                <span
                  key={c.keyword}
                  className={`text-xs rounded-full px-2.5 py-1 inline-flex items-center gap-1 ${
                    c.covered
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {c.covered ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {c.keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 border-t border-border">
          <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
            <div className="text-sm font-semibold text-success mb-2">Strengths</div>
            {evaluation.strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No strengths identified.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {evaluation.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-6 md:p-8">
            <div className="text-sm font-semibold text-warning mb-2">Improvements</div>
            <ul className="space-y-2 text-sm">
              {evaluation.improvements.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <ArrowRight className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {evaluation.modelAnswer && (
          <div className="p-6 md:p-8 border-t border-border bg-secondary/40">
            <div className="text-sm font-semibold mb-2">Model answer</div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{evaluation.modelAnswer}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {isLast ? (
          <Button onClick={onFinish} size="lg" className="bg-hero-gradient text-primary-foreground shadow-glow">
            Finish & see results <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={onNext} size="lg" className="bg-hero-gradient text-primary-foreground shadow-glow">
            Next question <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
