"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { spirits, getSpiritById, OhangType } from "@/lib/spirits";
import { OhangScores } from "@/lib/ohang";
import SpiritCard from "@/components/SpiritCard";
import { getTodayGems, GEM_CONFIG } from "@/lib/gems";
import { generateShareImage } from "@/lib/shareImage";
import { getCachedFortune, cacheFortune } from "@/lib/dailyFortune";
import { updateStreak, STREAK_MILESTONES } from "@/lib/streak";
import { getAffinity, getLevelInfo } from "@/lib/affinity";
import { getMode, setMode, AppMode } from "@/lib/mode";
import { getDarkSpirit } from "@/lib/darkSpirits";

const OHANG_LABELS: { key: OhangType; korName: string; ohang: string; stroke: string }[] = [
  { key: "wood",  korName: "나무", ohang: "木", stroke: "#4A7C4E" },
  { key: "fire",  korName: "불",   ohang: "火", stroke: "#C4532A" },
  { key: "soil",  korName: "흙",   ohang: "土", stroke: "#A0784A" },
  { key: "water", korName: "물",   ohang: "水", stroke: "#3A6B8A" },
  { key: "metal", korName: "금",   ohang: "金", stroke: "#8A8A6A" },
];

function renderBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
      : part
  );
}

function getParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return "이";
  return (code - 0xAC00) % 28 === 0 ? "가" : "이";
}

// 와/과 (받침 없으면 와, 있으면 과)
function getWaParticle(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return "와";
  return (code - 0xAC00) % 28 === 0 ? "와" : "과";
}

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [animated, setAnimated] = useState(false);
  const [collectedGems, setCollectedGems] = useState<OhangType[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [fortune, setFortune] = useState<string | null>(null);
  const [fortuneLoading, setFortuneLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [milestoneMsg, setMilestoneMsg] = useState("");
  const [mode, setModeState] = useState<AppMode>(() =>
    typeof window !== "undefined" ? getMode() : "dark"
  );

  const scores: OhangScores = {
    wood:  Number(params?.get("wood"))  || 0,
    fire:  Number(params?.get("fire"))  || 0,
    soil:  Number(params?.get("soil"))  || 0,
    water: Number(params?.get("water")) || 0,
    metal: Number(params?.get("metal")) || 0,
  };
  const recommended = ((params?.get("recommended")) as OhangType) || "water";
  const recommendedSpirit = getSpiritById(recommended);
  const [selected, setSelected] = useState<OhangType>(recommended);
  const selectedSpirit = getSpiritById(selected);

  // 최대값 기준으로 바 너비 계산 (최소 1 보장)
  const maxScore = Math.max(...Object.values(scores), 1);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    setCollectedGems(getTodayGems());

    const { count, isNewDay } = updateStreak();
    setStreak(count);
    if (isNewDay && STREAK_MILESTONES[count]) {
      setMilestoneMsg(STREAK_MILESTONES[count]);
      setTimeout(() => setMilestoneMsg(""), 4000);
    }

    setModeState(getMode());

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cached = getCachedFortune(recommended, mode);
    if (cached && !cached.startsWith("[오류]")) { setFortune(cached); return; }
    setFortuneLoading(true);
    fetch("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spiritId: recommended, mode }),
    })
      .then((r) => r.json())
      .then((data: { fortune?: string; error?: string }) => {
        if (data.fortune) { cacheFortune(recommended, mode, data.fortune); setFortune(data.fortune); }
        else if (data.error) setFortune(`[오류] ${data.error}`);
      })
      .catch((err: unknown) => { setFortune(`[오류] ${err instanceof Error ? err.message : String(err)}`); })
      .finally(() => setFortuneLoading(false));
  }, [recommended, mode]);

  if (!recommendedSpirit) {
    router.push("/");
    return null;
  }

  async function handleShareLink() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "내 오행 분석 결과", url }); return; } catch { /* fallthrough */ }
    }
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function handleSaveImage() {
    generateShareImage(
      scores, recommended,
      recommendedSpirit!.name, recommendedSpirit!.personality,
      recommendedSpirit!.ohangKor, recommendedSpirit!.ohang,
      getParticle(recommendedSpirit!.name),
    );
  }

  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto bg-white dark:bg-[#0D0D14]">

      {/* 마일스톤 토스트 */}
      {milestoneMsg && (
        <div className="fixed top-1/2 left-1/2 z-50 gem-toast pointer-events-none">
          <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-3xl px-8 py-5 shadow-2xl">
            <p className="text-3xl">🔥</p>
            <p className="text-[15px] font-bold text-[#3D2B1F] dark:text-[#E8E4F0] text-center">{milestoneMsg}</p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 hover:text-[#3D2B1F] dark:hover:text-[#E8E4F0] transition-colors"
          aria-label="뒤로가기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <div className="flex items-center gap-1 bg-[#FDF0EA] border border-[#F0D8CC] rounded-full px-3 py-1">
              <span className="text-sm">🔥</span>
              <span className="text-[11px] font-semibold text-[#C4785A]">{streak}일 연속</span>
            </div>
          )}
          <div className="flex items-center bg-[#F5EDE8] rounded-full p-0.5">
            <button
              onClick={() => { setMode("dark"); setModeState("dark"); document.documentElement.classList.add("dark"); }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${mode === "dark" ? "bg-[#2A1F3D] text-white shadow-sm" : "text-[#3D2B1F]/40"}`}
            >
              🌙 팩폭
            </button>
            <button
              onClick={() => { setMode("light"); setModeState("light"); document.documentElement.classList.remove("dark"); }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${mode === "light" ? "bg-white text-[#3D2B1F] shadow-sm" : "text-[#3D2B1F]/40"}`}
            >
              🌿 따뜻
            </button>
          </div>
        </div>
      </div>

      {/* ── 섹션: 내 사주 오행 분포 ── */}
      <div className="px-6 pt-2 pb-4">
        <p className="text-base font-bold text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70 mb-0.5">내 사주 오행 분포</p>
        <p className="text-[11px] text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 mb-4">
          생년월일로 계산한 <span className="text-[#E8896A] dark:text-[#A78BFA] font-semibold">오늘의</span> 너의 고유한 기운이야
        </p>
        <div className="flex justify-between">
          {OHANG_LABELS.map(({ key, korName, ohang, stroke }) => {
            const score = scores[key];
            const isLacking = key === recommended;
            const r = 24;
            const circ = 2 * Math.PI * r;
            const pct = animated ? score / maxScore : 0;
            const offset = circ * (1 - pct);
            const accentColor = mode === "dark" ? "#A78BFA" : "#E8896A";
            const trackColor = mode === "dark" ? "#2D2744" : "#F5EDE8";
            const textColor = mode === "dark" ? "#E8E4F0" : "#3D2B1F";
            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
                  <circle
                    cx="30" cy="30" r={r}
                    fill="none"
                    stroke={isLacking ? accentColor : stroke}
                    strokeWidth="6"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                    opacity={isLacking ? 1 : 0.5}
                    style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                  />
                  <text x="30" y="34" textAnchor="middle" fontSize="13"
                    fill={isLacking ? accentColor : textColor}
                    fontWeight={isLacking ? "700" : "400"}
                    opacity={isLacking ? 1 : 0.5}>
                    {score}
                  </text>
                </svg>
                <span className={`text-[10px] font-semibold ${isLacking ? "text-[#E8896A] dark:text-[#A78BFA]" : "text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40"}`}>
                  {ohang}
                </span>
                <span className={`text-[9px] ${isLacking ? "text-[#E8896A]/70 dark:text-[#A78BFA]/70" : "text-[#3D2B1F]/30 dark:text-[#E8E4F0]/30"}`}>
                  {korName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#F5EDE8] dark:bg-[#2D2744] mx-4" />

      {/* ── 섹션: 오늘의 한마디 ── */}
      <div className="px-6 py-4">
        <p className="text-base font-bold text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70 mb-0.5">
          {mode === "dark" ? "오늘의 팩폭" : "오늘의 한마디"}
        </p>
        <p className="text-[11px] text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 mb-3">
          {mode === "dark"
            ? <>{recommendedSpirit.name}{getParticle(recommendedSpirit.name)} 직언 한마디 해줄게</>
            : <>{recommendedSpirit.name}{getParticle(recommendedSpirit.name)} 오늘 너에게 전하는 말</>}
        </p>
        {fortuneLoading ? (
          <div className="flex gap-1.5 items-center py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8896A]/40 dark:bg-[#A78BFA]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8896A]/40 dark:bg-[#A78BFA]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8896A]/40 dark:bg-[#A78BFA]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : fortune ? (
          <div className="bg-[#FDF0EA] dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-2xl px-4 py-3">
            <p className="text-[11px] text-[#E8896A] dark:text-[#A78BFA] font-semibold mb-1.5">{recommendedSpirit.ohang} {recommendedSpirit.name}</p>
            <p className="text-sm text-[#3D2B1F]/75 dark:text-[#E8E4F0]/75 leading-relaxed">{renderBold(fortune)}</p>
          </div>
        ) : null}
      </div>

      <div className="h-px bg-[#F5EDE8] dark:bg-[#2D2744] mx-4" />

      {/* ── 섹션: 추천 배너 ── */}
      <div className="mx-4 my-4 bg-[#FDF0EA] dark:bg-[#1C1830] border border-[#F0D8CC] dark:border-[#2D2744] rounded-2xl px-5 py-4 text-center">
        <p className="text-[11px] text-[#C4785A]/70 dark:text-[#A78BFA]/70 mb-1">
          {mode === "dark"
            ? `${recommendedSpirit.ohangKor}(${recommendedSpirit.ohang}) 기운이 제일 약한 게 보여`
            : `네 사주에서 ${recommendedSpirit.ohangKor}(${recommendedSpirit.ohang}) 기운이 가장 적어`}
        </p>
        <p className="text-[#3D2B1F] dark:text-[#E8E4F0] font-bold text-lg">
          {mode === "dark"
            ? <>{recommendedSpirit.name}{getParticle(recommendedSpirit.name)} 너한테 할 말 있어</>
            : <>{recommendedSpirit.name}{getParticle(recommendedSpirit.name)} 오늘 채워주러 왔어</>}
        </p>
        <p className="text-xs text-[#3D2B1F]/45 dark:text-[#E8E4F0]/45 mt-1">
          {mode === "dark" ? getDarkSpirit(recommended).personality : recommendedSpirit.personality}
        </p>
      </div>

      <div className="h-px bg-[#F5EDE8] dark:bg-[#2D2744] mx-4" />

      {/* ── 섹션: 직접 고를 수도 있어 ── */}
      <div className="px-4 py-4">
        <p className="text-sm font-bold text-[#3D2B1F]/60 dark:text-[#E8E4F0]/60 mb-1">직접 고를 수도 있어</p>
        <p className="text-[11px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-3">
          다섯 정령의 기운을 모두 채우면 오행이 완벽한 조화를 이루는 하루가 돼 ✦
        </p>
        <div className="grid grid-cols-2 gap-3">
          {spirits.map((spirit) => {
            const lvl = getLevelInfo(getAffinity(spirit.id));
            const darkSpirit = getDarkSpirit(spirit.id as OhangType);
            return (
              <SpiritCard
                key={spirit.id}
                spirit={spirit}
                isRecommended={spirit.id === recommended}
                isSelected={spirit.id === selected}
                onClick={() => setSelected(spirit.id as OhangType)}
                levelName={lvl.level > 1 ? `Lv.${lvl.level} ${lvl.name}` : undefined}
                personalityOverride={mode === "dark" ? darkSpirit.personality : undefined}
                imageOverride={mode === "dark" ? darkSpirit.image : undefined}
              />
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[#F5EDE8] dark:bg-[#2D2744] mx-4" />

      {/* ── 섹션: 오늘 모은 구슬 ── */}
      <div className="px-6 py-4">
        <p className="text-sm font-bold text-[#3D2B1F]/60 dark:text-[#E8E4F0]/60 mb-1">오늘 모은 구슬</p>
        <p className="text-[11px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-3">
          {collectedGems.length === 5
            ? "오늘 오행이 완벽하게 조화를 이뤘어 ✦"
            : "다섯 정령의 기운을 모두 채워봐"}
        </p>
        <div className="flex justify-between">
          {(["wood","fire","soil","water","metal"] as OhangType[]).map((id) => {
            const cfg = GEM_CONFIG[id];
            const collected = collectedGems.includes(id);
            return (
              <div key={id} className="flex flex-col items-center gap-1">
                {cfg.image ? (
                  <img src={`/gems/${cfg.image}`} alt={cfg.korName}
                    className={`w-11 h-11 object-contain transition-all duration-500 ${collected ? "opacity-100" : "opacity-15 grayscale"}`} />
                ) : (
                  <div className={`w-10 h-10 rounded-full transition-all duration-500 ${
                    collected ? `${cfg.bg} ${cfg.glow}` : "bg-[#F0E8E4] border border-[#E8DDD8]"}`} />
                )}
                <span className="text-[9px] font-bold text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40">{cfg.korName}({cfg.ohang})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 공유 버튼 */}
      <div className="px-4 pt-2 pb-3 flex gap-2">
        <button
          onClick={handleShareLink}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] hover:bg-[#FDF0EA] dark:hover:bg-[#1C1830] text-[#3D2B1F]/60 dark:text-[#E8E4F0]/60 hover:text-[#C4785A] dark:hover:text-[#A78BFA] font-medium py-2.5 rounded-2xl transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {linkCopied ? "복사 완료!" : "링크 공유"}
        </button>
        <button
          onClick={handleSaveImage}
          className="flex-1 flex items-center justify-center gap-1.5 border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] hover:bg-[#FDF0EA] dark:hover:bg-[#1C1830] text-[#3D2B1F]/60 dark:text-[#E8E4F0]/60 hover:text-[#C4785A] dark:hover:text-[#A78BFA] font-medium py-2.5 rounded-2xl transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          이미지 저장
        </button>
      </div>

      {/* 선택 정령 대화 버튼 */}
      <div className="px-4 pb-8">
        <button
          onClick={() => router.push(`/chat/${selected}`)}
          className="w-full bg-[#E8896A] hover:bg-[#D4785A] dark:bg-[#7C5DBF] dark:hover:bg-[#6B4FA8] text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
        >
          {selectedSpirit?.name}{selectedSpirit ? getWaParticle(selectedSpirit.name) : "와"} 대화 시작하기
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0D0D14]">
        <p className="text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40 text-sm">분석 중...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
