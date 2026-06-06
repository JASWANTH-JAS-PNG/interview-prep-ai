// Client-side session storage for the in-progress interview.
// No auth yet (Phase 2). State lives in sessionStorage so a refresh keeps it.

export type Role = "frontend" | "backend" | "data-science";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Question = {
  question: string;
  category: "Conceptual" | "Coding" | "System Design" | "Behavioural";
  keywords: string[];
};

export type Evaluation = {
  score: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  coverage: { keyword: string; covered: boolean }[];
};

export type AnswerEntry = {
  question: Question;
  answer: string;
  skipped: boolean;
  evaluation: Evaluation;
};

export type InterviewSession = {
  role: Role;
  difficulty: Difficulty;
  startedAt: number;
  questions: Question[];
  answers: AnswerEntry[];
  completed: boolean;
};

const KEY = "pp_session_v1";

export function saveSession(s: InterviewSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): InterviewSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InterviewSession;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export const ROLE_META: Record<Role, { title: string; tagline: string; sample: string[]; emoji: string }> = {
  frontend: {
    title: "Frontend Engineer",
    tagline: "React, JavaScript, the browser, and pixel-perfect UI.",
    sample: ["React hooks & rendering", "Web performance", "CSS layout", "Accessibility"],
    emoji: "🎨",
  },
  backend: {
    title: "Backend Engineer",
    tagline: "APIs, databases, auth, scalability, system design.",
    sample: ["REST vs GraphQL", "SQL & indexes", "JWT & sessions", "Caching"],
    emoji: "⚙️",
  },
  "data-science": {
    title: "Data Science / ML",
    tagline: "Statistics, ML algorithms, Python, and intuition.",
    sample: ["Bias-variance", "Bagging vs boosting", "Class imbalance", "Feature engineering"],
    emoji: "📊",
  },
};
