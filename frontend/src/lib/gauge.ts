export const GAUGE_BASE = 5;   // 일반 대화
export const GAUGE_BONUS = 15; // 진솔한 대화 보너스

function todayKey(spiritId: string) {
  return `gauge_${spiritId}_${new Date().toISOString().slice(0, 10)}`;
}

export function getTodayGauge(spiritId: string): number {
  if (typeof window === "undefined") return 0;
  return Math.min(100, Number(localStorage.getItem(todayKey(spiritId))) || 0);
}

export function incrementGauge(spiritId: string, amount: number): number {
  if (typeof window === "undefined") return 0;
  const next = Math.min(100, getTodayGauge(spiritId) + amount);
  localStorage.setItem(todayKey(spiritId), String(next));
  return next;
}
