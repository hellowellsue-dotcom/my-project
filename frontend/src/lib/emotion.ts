export type EmotionType = "sad" | "anxious" | "angry" | "tired" | "happy" | "lonely" | "neutral";

export const EMOTION_CONFIG: Record<EmotionType, { label: string; color: string } | null> = {
  sad:     { label: "많이 힘들구나",       color: "bg-[#D0E8F5] text-[#3A6B8A]" },
  anxious: { label: "걱정이 많네",         color: "bg-[#EDE0F5] text-[#7A5A9A]" },
  angry:   { label: "답답한 마음이 느껴져", color: "bg-[#F5E0DC] text-[#9A4A3A]" },
  tired:   { label: "많이 지쳐있구나",     color: "bg-[#E8E8E8] text-[#5A5A5A]" },
  happy:   { label: "기분이 좋아 보여",    color: "bg-[#FFF0C0] text-[#8A6A10]" },
  lonely:  { label: "혼자인 느낌이구나",   color: "bg-[#DCF0F5] text-[#3A7A8A]" },
  neutral: null,
};
