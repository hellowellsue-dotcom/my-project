export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBubbleProps {
  message: Message;
  spiritImage: string;
  spiritName: string;
}

/** HTML 태그 제거 */
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

/** **text** → <strong>text</strong> */
function renderBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderContent(content: string): React.ReactNode {
  const clean = stripHtml(content);
  return clean.split("\n").map((line, i, arr) => (
    <span key={i}>
      {renderBold(line)}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function ChatBubble({ message, spiritImage, spiritName }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#FDE8DC] dark:bg-[#2D2744] mt-1">
          <img
            src={`/spirits/${spiritImage}`}
            alt={spiritName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div
        className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed border ${
          isUser
            ? "bg-[#E8896A] text-white rounded-tr-sm border-transparent"
            : "bg-white dark:bg-[#1C1830] text-[#1A1009] dark:text-[#E8E4F0] rounded-tl-sm border-black/10 dark:border-white/10"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
