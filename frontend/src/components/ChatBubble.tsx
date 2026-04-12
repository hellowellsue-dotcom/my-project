interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBubbleProps {
  message: Message;
  characterImage: string;
  characterName: string;
}

export default function ChatBubble({ message, characterImage, characterName }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden bg-purple-100">
          <img
            src={`/characters/${characterImage}`}
            alt={characterName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-purple-500 text-white rounded-tr-sm"
            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export type { Message };
