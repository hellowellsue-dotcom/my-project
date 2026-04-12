interface TypingIndicatorProps {
  characterImage: string;
  characterName: string;
}

export default function TypingIndicator({ characterImage, characterName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-purple-100">
        <img
          src={`/characters/${characterImage}`}
          alt={characterName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
