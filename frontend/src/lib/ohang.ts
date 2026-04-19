import { OhangType } from "./spirits";

export interface OhangScores {
  wood: number;
  fire: number;
  soil: number;
  water: number;
  metal: number;
}

export interface AnalyzeResult {
  scores: OhangScores;
  recommended: OhangType;
  lacking: OhangType[]; // 점수 낮은 순 (추천 우선순위)
}

/**
 * 숫자 끝자리 → 오행 매핑
 * 0, 1 → 金 (metal)
 * 2, 3 → 水 (water)
 * 4, 5 → 木 (wood)
 * 6, 7 → 火 (fire)
 * 8, 9 → 土 (soil)
 */
function digitToOhang(digit: number): OhangType {
  if (digit <= 1) return "metal";
  if (digit <= 3) return "water";
  if (digit <= 5) return "wood";
  if (digit <= 7) return "fire";
  return "soil";
}

/**
 * 생년월일의 각 자릿수를 오행으로 매핑해 점수 합산.
 * YYYY(4자리) + MM(2자리) + DD(2자리) = 총 8자릿수 기준.
 * 각 오행은 0~8점 범위.
 */
export function analyzeOhang(year: number, month: number, day: number, hour?: number | null, minute?: number | null): AnalyzeResult {
  const scores: OhangScores = { wood: 0, fire: 0, soil: 0, water: 0, metal: 0 };

  // YYYYMMDD + HH(선택) 각 자릿수 추출
  const digits = [
    Math.floor(year / 1000) % 10,
    Math.floor(year / 100) % 10,
    Math.floor(year / 10) % 10,
    year % 10,
    Math.floor(month / 10) % 10,
    month % 10,
    Math.floor(day / 10) % 10,
    day % 10,
  ];
  if (hour !== null && hour !== undefined) {
    digits.push(Math.floor(hour / 10) % 10, hour % 10);
  }
  if (minute !== null && minute !== undefined) {
    digits.push(Math.floor(minute / 10) % 10, minute % 10);
  }

  for (const digit of digits) {
    scores[digitToOhang(digit)] += 1;
  }

  // 점수 낮은 순으로 정렬 (부족한 기운 순서)
  const sorted = (Object.entries(scores) as [OhangType, number][])
    .sort((a, b) => a[1] - b[1]);

  const lacking = sorted.map(([ohang]) => ohang);
  const recommended = lacking[0];

  return { scores, recommended, lacking };
}
