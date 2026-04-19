interface TypingIndicatorProps {
  spiritImage: string;
  spiritName: string;
}

export default function TypingIndicator({ spiritImage, spiritName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#FDE8DC] dark:bg-[#2D2744] mt-1">
        <img
          src={`/spirits/${spiritImage}`}
          alt={spiritName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="bg-white dark:bg-[#1C1830] border border-black/10 dark:border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#C4785A] rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-[#C4785A] rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-[#C4785A] rounded-full animate-bounce" />
      </div>
    </div>
  );
}
