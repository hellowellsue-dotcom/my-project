"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCharacterById } from "@/lib/characters";
import ChatBubble, { Message } from "@/components/ChatBubble";
import TypingIndicator from "@/components/TypingIndicator";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const character = getCharacterById(characterId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isLoading]);

  useEffect(() => {
    if (character) {
      setMessages([
        {
          role: "assistant",
          content: getGreeting(character.name),
        },
      ]);
    }
  }, [character]);

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">캐릭터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  function getGreeting(name: string): string {
    const greetings: Record<string, string> = {
      루시: "안녕하세요! 저는 루시예요 🐱✨ 오늘 하루 어떠세요?",
      아이리스: "안녕하세요. 저는 아이리스입니다. 어떤 이야기를 나눠볼까요?",
      미로: "어서 오세요! 저는 미로예요 😄 오늘도 재미있게 지내봐요!",
      에바: "...안녕하세요. 저는 에바입니다. 어떤 생각을 품고 오셨나요?",
      진: "안녕하세요 😊 저는 진이에요. 편하게 이야기해 주세요.",
    };
    return greetings[name] || `안녕하세요! 저는 ${name}이에요.`;
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !character) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("API 오류가 발생했습니다.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                accumulated += delta;
                setStreamingContent(accumulated);
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송해요, 오류가 발생했어요. 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button
          onClick={() => router.push("/")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex-shrink-0">
          <img
            src={`/characters/${character.image}`}
            alt={character.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-bold text-gray-800">{character.name}</h1>
          <p className="text-xs text-gray-400">{character.interests.join(" · ")}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            message={message}
            characterImage={character.image}
            characterName={character.name}
          />
        ))}

        {isLoading && !streamingContent && (
          <TypingIndicator
            characterImage={character.image}
            characterName={character.name}
          />
        )}

        {streamingContent && (
          <ChatBubble
            message={{ role: "assistant", content: streamingContent }}
            characterImage={character.image}
            characterName={character.name}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-300 max-h-32 overflow-y-auto bg-gray-50"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="전송"
          >
            <svg className="w-5 h-5 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">Enter로 전송 · Shift+Enter로 줄바꿈</p>
      </div>
    </div>
  );
}
