"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSpiritById } from "@/lib/spirits";
import ChatBubble, { Message } from "@/components/ChatBubble";
import TypingIndicator from "@/components/TypingIndicator";
import { getTodayGauge, incrementGauge, GAUGE_BASE, GAUGE_BONUS } from "@/lib/gauge";
import { getRandomFullMessage } from "@/lib/spiritMessages";
import { EmotionType, EMOTION_CONFIG } from "@/lib/emotion";
import { getNickname } from "@/lib/storage";
import { awardGem, GEM_CONFIG } from "@/lib/gems";
import { getAffinity, incrementAffinity, getLevelInfo, didLevelUp } from "@/lib/affinity";
import { getMode } from "@/lib/mode";
import { getDarkSpirit } from "@/lib/darkSpirits";

const TYPING_SPEED_MS = 50;

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const spiritId = params?.id as string;
  const spirit = getSpiritById(spiritId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [talkingFrame, setTalkingFrame] = useState(0); // talking 프레임 인덱스
  const [gauge, setGauge] = useState(0);
  const [fullMessage, setFullMessage] = useState("");
  const [emotion, setEmotion] = useState<EmotionType>("neutral");
  const [gemToast, setGemToast] = useState(false);
  const [levelUpToast, setLevelUpToast] = useState("");
  const [affinityLevel, setAffinityLevel] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef("");
  const displayedRef = useRef("");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreamingDoneRef = useRef(false);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUserMessageRef = useRef("");

  useEffect(() => {
    if (spirit) {
      const mode = getMode();
      const greeting = mode === "dark" ? getDarkSpirit(spirit.id).greeting : spirit.greeting;
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [spirit?.id]);

  useEffect(() => {
    const g = getTodayGauge(spiritId);
    setGauge(g);
    if (g >= 100) setFullMessage(getRandomFullMessage(spiritId));
    setAffinityLevel(getLevelInfo(getAffinity(spiritId)).level);
  }, [spiritId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContent, isLoading]);

  // talking 프레임 순환 (감정 그룹 우선, 없으면 default)
  const isTalkingNow = isLoading || !!displayedContent;
  useEffect(() => {
    const frames = spirit?.talkingFrames?.[emotion] ?? spirit?.talkingFrames?.["default"] ?? [];
    if (!frames.length) return;

    if (isTalkingNow) {
      let idx = 0;
      setTalkingFrame(0);
      frameTimerRef.current = setInterval(() => {
        idx = (idx + 1) % frames.length;
        setTalkingFrame(idx);
      }, 250);
    } else {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      setTalkingFrame(0);
    }

    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    };
  }, [isTalkingNow, spirit?.id, emotion]);

  const tickTyping = useCallback(() => {
    const buffer = bufferRef.current;
    const displayed = displayedRef.current;

    if (displayed.length < buffer.length) {
      const next = buffer.slice(0, displayed.length + 1);
      displayedRef.current = next;
      setDisplayedContent(next);
      typingTimerRef.current = setTimeout(tickTyping, TYPING_SPEED_MS);
    } else if (isStreamingDoneRef.current) {
      setMessages((prev) => [...prev, { role: "assistant", content: buffer }]);
      setDisplayedContent("");
      bufferRef.current = "";
      displayedRef.current = "";
      isStreamingDoneRef.current = false;
      setIsLoading(false);

      // 기본 게이지 + 친밀도 증가
      const baseGauge = incrementGauge(spiritId, GAUGE_BASE);
      setGauge(baseGauge);
      if (baseGauge >= 100 && !fullMessage) setFullMessage(getRandomFullMessage(spiritId));
      if (baseGauge >= 100 && awardGem(spiritId)) {
        setGemToast(true);
        setTimeout(() => setGemToast(false), 3000);
      }

      const prevAff = getAffinity(spiritId);
      const nextAff = incrementAffinity(spiritId, GAUGE_BASE);
      if (didLevelUp(prevAff, nextAff)) {
        const newLevel = getLevelInfo(nextAff);
        setAffinityLevel(newLevel.level);
        setLevelUpToast(`Lv.${newLevel.level} ${newLevel.name}`);
        setTimeout(() => setLevelUpToast(""), 3500);
      }

      // 진솔함 평가 + 감정 감지 (비동기 — UI 블로킹 없음)
      const userMsg = lastUserMessageRef.current;
      if (userMsg) {
        fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg }),
        })
          .then((r) => r.json())
          .then(({ sincere }: { sincere: boolean }) => {
            if (sincere) {
              const bonusGauge = incrementGauge(spiritId, GAUGE_BONUS);
              setGauge(bonusGauge);
              if (bonusGauge >= 100) setFullMessage((prev) => prev || getRandomFullMessage(spiritId));

              const prevAff = getAffinity(spiritId);
              const nextAff = incrementAffinity(spiritId, GAUGE_BONUS);
              if (didLevelUp(prevAff, nextAff)) {
                const newLevel = getLevelInfo(nextAff);
                setAffinityLevel(newLevel.level);
                setLevelUpToast(`Lv.${newLevel.level} ${newLevel.name}`);
                setTimeout(() => setLevelUpToast(""), 3500);
              }
            }
          })
          .catch(() => {});

        fetch("/api/emotion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMsg }),
        })
          .then((r) => r.json())
          .then(({ emotion: detected }: { emotion: EmotionType }) => {
            setEmotion(detected);
          })
          .catch(() => {});
      }
    } else {
      typingTimerRef.current = setTimeout(tickTyping, TYPING_SPEED_MS);
    }
  }, [spiritId, setGauge, fullMessage]);

  if (!spirit) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-[#3D2B1F]/50 text-sm">정령을 찾을 수 없어.</p>
      </div>
    );
  }

  async function handleSaveChatImage() {
    if (!spirit) return;
    const isDark = getMode() === "dark";
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
    // ** 마커 제거 (캔버스에는 plain text)
    const plainMsg = lastAssistantMsg.replace(/\*\*([^*]+)\*\*/g, "$1");

    const canvas = document.createElement("canvas");
    canvas.width = 430;
    canvas.height = 560;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캐릭터 이미지 미리 로드
    const charImg = new window.Image();
    charImg.crossOrigin = "anonymous";
    charImg.src = `/spirits/${baseImage}`;
    await new Promise<void>((resolve) => {
      charImg.onload = () => resolve();
      charImg.onerror = () => resolve(); // 실패해도 나머지 그리기
    });

    // 배경
    if (isDark) {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#0D0D14");
      bg.addColorStop(1, "#1C1830");
      ctx.fillStyle = bg;
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bg.addColorStop(0, "#FDF8F6");
      bg.addColorStop(1, "#FDF0EA");
      ctx.fillStyle = bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 캐릭터 이미지 — 우측 상단
    const charSize = 180;
    const charX = canvas.width - charSize - 12;
    const charY = -10;
    if (charImg.complete && charImg.naturalWidth > 0) {
      ctx.globalAlpha = isDark ? 0.9 : 1;
      ctx.drawImage(charImg, charX, charY, charSize, charSize);
      ctx.globalAlpha = 1;
    }

    // 장식 원 (캐릭터 뒤)
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 70, 100, 0, Math.PI * 2);
    ctx.fillStyle = isDark ? "rgba(167,139,250,0.08)" : "rgba(232,137,106,0.08)";
    ctx.fill();

    // 상단 레이블
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillStyle = isDark ? "#A78BFA" : "#E8896A";
    ctx.fillText("오행 기운 분석", 32, 52);
    ctx.letterSpacing = "0px";

    // 정령 이름
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.fillStyle = isDark ? "#E8E4F0" : "#3D2B1F";
    ctx.fillText(`${spirit.ohang} ${spirit.name}`, 32, 92);

    // 서브타이틀
    ctx.font = "13px system-ui, sans-serif";
    ctx.fillStyle = isDark ? "rgba(232,228,240,0.45)" : "rgba(61,43,31,0.45)";
    ctx.fillText(`${spirit.ohangKor} · ${spirit.personality.split(", ")[0]}`, 32, 116);

    // 구분선
    ctx.beginPath();
    ctx.moveTo(32, 140);
    ctx.lineTo(canvas.width - 32, 140);
    ctx.strokeStyle = isDark ? "#2D2744" : "#F0E0D8";
    ctx.lineWidth = 1;
    ctx.stroke();

    // 인용 마크
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillStyle = isDark ? "rgba(167,139,250,0.25)" : "rgba(232,137,106,0.20)";
    ctx.fillText('"', 32, 186);

    // 마지막 정령 대사 — 줄 바꿈
    const maxWidth = canvas.width - 80;
    const lineHeight = 26;
    const words = plainMsg.replace(/\n/g, " ").split(" ");
    const lines: string[] = [];
    let currentLine = "";
    ctx.font = "15px system-ui, sans-serif";
    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
      if (lines.length >= 8) break;
    }
    if (currentLine && lines.length < 8) lines.push(currentLine);

    ctx.fillStyle = isDark ? "rgba(232,228,240,0.85)" : "rgba(61,43,31,0.80)";
    const textStartY = 200;
    lines.forEach((line, i) => {
      ctx.fillText(line, 44, textStartY + i * lineHeight);
    });

    // 하단 브랜딩
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillStyle = isDark ? "rgba(167,139,250,0.60)" : "rgba(232,137,106,0.70)";
    ctx.fillText("나를 채워주는 다섯 정령", 32, canvas.height - 32);

    const link = document.createElement("a");
    link.download = `${spirit.name}_대화.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !spirit) return;

    // 테스트 코드
    if (trimmed === "팬더요1453") {
      setInput("");
      const testGauge = incrementGauge(spiritId, 100);
      setGauge(testGauge);
      setFullMessage(getRandomFullMessage(spiritId));
      if (awardGem(spiritId)) {
        setGemToast(true);
        setTimeout(() => setGemToast(false), 3000);
      }
      return;
    }

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    lastUserMessageRef.current = trimmed;
    setEmotion("neutral");
    setInput("");
    setIsLoading(true);

    // 사용자가 말할 때 게이지 소폭 상승
    const userGauge = incrementGauge(spiritId, 3);
    setGauge(userGauge);
    if (userGauge >= 100 && !fullMessage) setFullMessage(getRandomFullMessage(spiritId));
    setDisplayedContent("");
    bufferRef.current = "";
    displayedRef.current = "";
    isStreamingDoneRef.current = false;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spiritId: spirit.id, messages: updatedMessages, nickname: getNickname(), mode: getMode() }),
      });

      if (!response.ok) throw new Error("응답 오류");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (!delta) continue;
              bufferRef.current += delta;
              if (isFirstChunk) {
                isFirstChunk = false;
                typingTimerRef.current = setTimeout(tickTyping, TYPING_SPEED_MS);
              }
            } catch { /* ignore */ }
          }
        }
      }

      isStreamingDoneRef.current = true;
    } catch {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setDisplayedContent("");
      bufferRef.current = "";
      displayedRef.current = "";
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "잠시 후 다시 얘기해줘." },
      ]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const isTalking = isTalkingNow;
  const isTyping = isLoading && !displayedContent;

  // 현재 보여줄 이미지: 감정별 프레임 → default 프레임 → (다크/일반) 기본 이미지
  const talkingFrameList = spirit.talkingFrames?.[emotion] ?? spirit.talkingFrames?.["default"] ?? [];
  const baseImage = getMode() === "dark" ? getDarkSpirit(spirit.id).image : spirit.image;
  const currentImage =
    isTalking && talkingFrameList.length
      ? talkingFrameList[talkingFrame]
      : baseImage;

  const gemCfg = GEM_CONFIG[spiritId as keyof typeof GEM_CONFIG];

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-white dark:bg-[#0D0D14]">

      {/* 레벨업 토스트 */}
      {levelUpToast && (
        <div className="fixed top-1/2 left-1/2 z-50 gem-toast pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-3xl px-8 py-5 shadow-2xl">
            <p className="text-3xl">✨</p>
            <p className="text-[13px] text-[#3D2B1F]/50 dark:text-[#E8E4F0]/50">친밀도 레벨 업!</p>
            <p className="text-[17px] font-bold text-[#3D2B1F] dark:text-[#E8E4F0]">{levelUpToast}</p>
          </div>
        </div>
      )}

      {/* 구슬 획득 토스트 — 화면 중앙 */}
      {gemToast && gemCfg && (
        <div className="fixed top-1/2 left-1/2 z-50 gem-toast pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-3xl px-8 py-6 shadow-2xl">
            {gemCfg.image ? (
              <img src={`/gems/${gemCfg.image}`} alt={gemCfg.korName} className="w-20 h-20 object-contain" />
            ) : (
              <div className={`w-20 h-20 rounded-full ${gemCfg.bg} ${gemCfg.glow}`} />
            )}
            <p className="text-[15px] font-bold text-[#3D2B1F] dark:text-[#E8E4F0]">
              {gemCfg.korName}({gemCfg.ohang}) 구슬 획득 완료!
            </p>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 hover:text-[#3D2B1F] dark:hover:text-[#E8E4F0] transition-colors"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 정령 캐릭터 — 크게, 중앙 */}
      <div className="flex flex-col items-center pt-2 pb-4 bg-white dark:bg-[#0D0D14]">
        <div className="w-32 h-32 mb-3">
          <img
            src={`/spirits/${currentImage}`}
            alt={spirit.name}
            className={`w-full h-full object-contain drop-shadow-md ${
              isTalking && !talkingFrameList.length ? "spirit-talking" : "spirit-breathe"
            }`}
          />
        </div>
        {/* 이름 명패 */}
        <div className="flex items-center gap-1.5 bg-[#FDF0EA] dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-full px-4 py-1">
          <span className="text-[#C4785A] dark:text-[#A78BFA]/80 text-xs">{spirit.ohang}</span>
          <span className="text-[#3D2B1F] dark:text-[#E8E4F0] font-semibold text-sm">{spirit.name}</span>
          <span className="text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 text-xs">· {spirit.ohangKor}</span>
          <span className="text-[#3D2B1F]/25 dark:text-[#E8E4F0]/25 text-xs">|</span>
          <span className="text-[#E8896A] dark:text-[#A78BFA] text-[10px] font-semibold">Lv.{affinityLevel}</span>
        </div>

        {/* 감정 배지 */}
        {(() => {
          const cfg = EMOTION_CONFIG[emotion];
          return cfg ? (
            <div className={`mt-2 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-500 ${cfg.color}`}>
              {cfg.label}
            </div>
          ) : (
            <div className="mt-2 h-6" />
          );
        })()}

        {/* 오늘의 기운 게이지 */}
        <div className="w-full px-6 mt-3">
          {gauge >= 100 && fullMessage ? (
            <p className="text-[11px] text-[#E8896A] dark:text-[#A78BFA] text-center leading-snug px-2">
              ✦ {fullMessage}
            </p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35">
                  오늘의 기운
                </span>
                <span className="text-[10px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35">{gauge}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#F5EDE8] dark:bg-[#231D35] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${gauge}%`,
                    background: getMode() === "dark"
                      ? "linear-gradient(to right, #7C5DBF, #A78BFA, #C4B0FA)"
                      : "linear-gradient(to right, #E8896A, #F4A87A, #F9C8A0)",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#F5EDE8] dark:bg-[#2D2744] mx-4" />

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FDFAF8] dark:bg-[#13111E]">
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            message={message}
            spiritImage={baseImage}
            spiritName={spirit.name}
          />
        ))}

        {isTyping && (
          <TypingIndicator spiritImage={baseImage} spiritName={spirit.name} />
        )}

        {displayedContent && (
          <ChatBubble
            message={{ role: "assistant", content: displayedContent }}
            spiritImage={baseImage}
            spiritName={spirit.name}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="relative px-4 py-3 border-t border-[#F5EDE8] dark:border-[#2D2744] bg-white dark:bg-[#0D0D14]">
        {/* 플로팅 이미지 저장 버튼 — 전송버튼 위 */}
        <button
          onClick={handleSaveChatImage}
          className="absolute -top-12 right-4 w-9 h-9 rounded-full bg-white dark:bg-[#1C1830] border border-[#F0E0D8] dark:border-[#2D2744] shadow-sm flex items-center justify-center text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 hover:text-[#E8896A] dark:hover:text-[#A78BFA] hover:border-[#E8896A]/40 dark:hover:border-[#A78BFA]/40 transition-all active:scale-90"
          aria-label="이미지 저장"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-[#F0E0D8] dark:border-[#2D2744] bg-[#FDF8F6] dark:bg-[#13111E] px-4 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] placeholder-[#3D2B1F]/30 dark:placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA] focus:ring-1 focus:ring-[#E8896A]/20 dark:focus:ring-[#A78BFA]/20 max-h-28 overflow-y-auto"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-[#E8896A] hover:bg-[#D4785A] dark:bg-[#7C5DBF] dark:hover:bg-[#6B4FA8] disabled:bg-[#F0E0D8] dark:disabled:bg-[#231D35] disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="전송"
          >
            <svg className="w-4 h-4 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-[#3D2B1F]/25 dark:text-[#E8E4F0]/25 mt-1.5 text-center">
          Enter 전송 · Shift+Enter 줄바꿈
        </p>
      </div>
    </div>
  );
}
