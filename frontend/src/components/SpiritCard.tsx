import { Spirit } from "@/lib/spirits";

interface SpiritCardProps {
  spirit: Spirit;
  isRecommended: boolean;
  isSelected: boolean;
  onClick: () => void;
  levelName?: string;
  personalityOverride?: string;
  imageOverride?: string;
}

export default function SpiritCard({ spirit, isRecommended, isSelected, onClick, levelName, personalityOverride, imageOverride }: SpiritCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center rounded-2xl p-4 w-full transition-all duration-200 active:scale-95 ${
        isSelected
          ? "bg-[#FDF0EA] dark:bg-[#1C1830] border-2 border-[#E8896A] shadow-md"
          : "bg-white dark:bg-[#13111E] border border-[#F0E0D8] dark:border-[#2D2744] hover:border-[#E8896A]/50 hover:shadow-sm"
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#E8896A] text-white text-[10px] font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
          ✦ 오늘의 추천
        </span>
      )}

      <div className="w-20 h-20 mb-2">
        <img
          src={`/spirits/${imageOverride ?? spirit.image}`}
          alt={spirit.name}
          className="w-full h-full object-contain drop-shadow-sm"
        />
      </div>

      <span className={`text-xs px-2 py-0.5 rounded-full mb-1 ${
        isSelected
          ? "bg-[#E8896A]/15 text-[#C4785A]"
          : "bg-[#F5EDE8] dark:bg-[#231D35] text-[#C4785A]/70"
      }`}>
        {spirit.ohang} {spirit.ohangKor}
      </span>

      <p className={`font-semibold text-sm ${isSelected ? "text-[#3D2B1F] dark:text-[#E8E4F0]" : "text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70"}`}>
        {spirit.name}
      </p>

      {levelName && (
        <span className="text-[9px] text-[#E8896A]/70 font-medium mt-0.5">{levelName}</span>
      )}

      <p className="text-[11px] text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 text-center mt-1 leading-snug">
        {(personalityOverride ?? spirit.personality).split(", ").map((line, i) => (
          <span key={i} className={`block ${i === 1 ? "font-semibold text-[#3D2B1F]/60 dark:text-[#E8E4F0]/60" : ""}`}>
            {line}
          </span>
        ))}
      </p>
    </button>
  );
}
