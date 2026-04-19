export interface SavedAnalysis {
  nickname: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
  scores: { wood: number; fire: number; soil: number; water: number; metal: number };
  recommended: string;
}

const KEY = "saved_analysis";

export function saveAnalysis(data: SavedAnalysis) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getSavedAnalysis(): SavedAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis) : null;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function getNickname(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAnalysis).nickname ?? "" : "";
  } catch {
    return "";
  }
}
