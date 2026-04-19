export interface LevelInfo {
  level: number;
  name: string;
  min: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, min: 0,    name: "낯선 사이" },
  { level: 2, min: 100,  name: "알아가는 중" },
  { level: 3, min: 300,  name: "친한 사이" },
  { level: 4, min: 600,  name: "단짝 친구" },
  { level: 5, min: 1000, name: "영혼의 동반자" },
];

export function getAffinity(spiritId: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(`affinity_${spiritId}`) || 0);
}

export function incrementAffinity(spiritId: string, amount: number): number {
  const next = getAffinity(spiritId) + amount;
  localStorage.setItem(`affinity_${spiritId}`, String(next));
  return next;
}

export function getLevelInfo(points: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(points: number): LevelInfo | null {
  const current = getLevelInfo(points);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}

// 레벨업 감지: 포인트 추가 전/후 레벨이 달라지면 true
export function didLevelUp(before: number, after: number): boolean {
  return getLevelInfo(before).level !== getLevelInfo(after).level;
}
