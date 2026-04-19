import { OhangType } from "./spirits";

function todayKey(spiritId: string) {
  return `gem_${spiritId}_${new Date().toISOString().slice(0, 10)}`;
}

export function hasGemToday(spiritId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(todayKey(spiritId)) === "1";
}

export function awardGem(spiritId: string): boolean {
  if (typeof window === "undefined") return false;
  if (hasGemToday(spiritId)) return false; // 이미 획득
  localStorage.setItem(todayKey(spiritId), "1");
  return true;
}

export function getTodayGems(): OhangType[] {
  if (typeof window === "undefined") return [];
  const all: OhangType[] = ["wood", "fire", "soil", "water", "metal"];
  return all.filter((id) => hasGemToday(id));
}

export const GEM_CONFIG: Record<OhangType, { bg: string; glow: string; ohang: string; korName: string; image: string | null }> = {
  wood:  { bg: "bg-[#4A7C4E]",  glow: "shadow-[0_0_12px_3px_rgba(74,124,78,0.6)]",   ohang: "木", korName: "나무", image: "tree_ball.png"  },
  fire:  { bg: "bg-[#C4532A]",  glow: "shadow-[0_0_12px_3px_rgba(196,83,42,0.6)]",   ohang: "火", korName: "불",   image: "fire_ball.png"  },
  soil:  { bg: "bg-[#A0784A]",  glow: "shadow-[0_0_12px_3px_rgba(160,120,74,0.6)]",  ohang: "土", korName: "흙",   image: "soil_ball.png"  },
  water: { bg: "bg-[#3A6B8A]",  glow: "shadow-[0_0_12px_3px_rgba(58,107,138,0.6)]",  ohang: "水", korName: "물",   image: "water_ball.png" },
  metal: { bg: "bg-[#8A8A6A]",  glow: "shadow-[0_0_12px_3px_rgba(138,138,106,0.6)]", ohang: "金", korName: "금",   image: "metal_ball.png" },
};
