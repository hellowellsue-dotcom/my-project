function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export interface StreakInfo {
  count: number;
  isNewDay: boolean; // 오늘 처음 방문이면 true
}

export function updateStreak(): StreakInfo {
  if (typeof window === "undefined") return { count: 0, isNewDay: false };

  const today = todayStr();
  const yesterday = yesterdayStr();
  const lastVisit = localStorage.getItem("streak_last");
  const prevCount = Number(localStorage.getItem("streak_count") || 0);

  if (lastVisit === today) {
    return { count: prevCount, isNewDay: false };
  }

  const count = lastVisit === yesterday ? prevCount + 1 : 1;
  localStorage.setItem("streak_last", today);
  localStorage.setItem("streak_count", String(count));
  return { count, isNewDay: true };
}

export function getStreak(): number {
  if (typeof window === "undefined") return 0;
  const lastVisit = localStorage.getItem("streak_last");
  const today = todayStr();
  const yesterday = yesterdayStr();
  if (lastVisit !== today && lastVisit !== yesterday) return 0;
  return Number(localStorage.getItem("streak_count") || 0);
}

export const STREAK_MILESTONES: Record<number, string> = {
  3:  "3일 연속! 기운이 쌓이기 시작했어 🌱",
  7:  "일주일 개근! 오행의 흐름이 잡혀가고 있어 ✦",
  14: "2주 연속! 정령들이 너를 기억하기 시작했어 💫",
  30: "한 달 개근! 오행의 균형을 완전히 이뤘어 🌟",
};
