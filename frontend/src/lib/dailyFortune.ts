function todayKey(spiritId: string, mode: string) {
  return `fortune_v3_${spiritId}_${mode}_${new Date().toISOString().slice(0, 10)}`;
}

export function getCachedFortune(spiritId: string, mode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(todayKey(spiritId, mode));
}

export function cacheFortune(spiritId: string, mode: string, text: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(todayKey(spiritId, mode), text);
}
