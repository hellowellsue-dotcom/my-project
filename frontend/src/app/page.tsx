"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { spirits } from "@/lib/spirits";
import { saveAnalysis, getSavedAnalysis, SavedAnalysis } from "@/lib/storage";
import { getMode, setMode, AppMode } from "@/lib/mode";
import { getDarkSpirit } from "@/lib/darkSpirits";

const DARK_GREETINGS = [
  "또 왔군.",
  "오늘도 해결 못 한 게 있지?",
  "뭘 또 망쳤어?",
  "여기까지 온 거 보니 오늘도 만만치 않았나 보네.",
  "아직도 같은 문제야?",
  "무슨 핑계 찾으러 왔어?",
  "와봤자 달라지는 건 없어. 그래도 왔지.",
  "이번엔 또 뭐가 문제야?",
  "왔으면 솔직하게 말해.",
  "또 도망치러 온 거야, 아니면 직면하러 온 거야?",
];

const TAGLINES = [
  "오늘 하루를 더욱 완벽하게 만들어줄게!",
  "오늘의 기운, 내가 채워줄게",
  "매일이 달라질 거야, 조금씩",
  "지금 이 순간이 시작이야",
  "오늘의 나를 가장 빛나게 해줄게",
  "부족한 기운을 채우면 하루가 달라져",
  "오늘은 분명 특별한 하루가 될 거야",
  "작은 대화 하나가 하루를 바꿔",
  "오늘의 기운이 너를 기다리고 있어",
  "나랑 얘기하면 분명 달라질 거야",
  "네 안의 기운을 깨워줄게",
  "오늘도 한 걸음 더 나아가자",
  "지금 딱 필요한 기운, 내가 알아",
  "오행의 균형이 하루를 완성해",
  "오늘 하루의 빈 자리를 채워줄게",
  "조금 더 나다운 하루로 만들어줄게",
  "지금부터 달라져봐",
  "오늘의 에너지, 같이 찾아봐",
  "네 기운의 균형을 맞춰줄게",
  "대화 한 번으로 하루가 달라질 수 있어",
  "오늘의 부족함이 내일의 힘이 될 거야",
  "작은 시작이 큰 변화를 만들어",
  "오늘도 빛나는 하루, 같이 만들자",
  "지금 이 선택이 오늘 하루를 바꿔",
  "오행의 기운이 너와 함께할 거야",
  "오늘 하루를 완성하는 건 나야",
  "매일 조금씩 채워가는 기운이 쌓여",
  "나랑 시작하면 오늘이 달라져",
  "오늘도 채워가는 하루, 함께해",
  "지금 딱 필요한 기운이 여기 있어",
];

export default function Home() {
  const router = useRouter();
  const [saved, setSaved] = useState<SavedAnalysis | null>(null);
  const [mode, setModeState] = useState<AppMode>("dark");
  const [showNewForm, setShowNewForm] = useState(false);

  // 폼 상태
  const [nickname, setNickname] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [unknownTime, setUnknownTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tagline = useMemo(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)], []);
  const darkGreeting = useMemo(() => DARK_GREETINGS[Math.floor(Math.random() * DARK_GREETINGS.length)], []);

  useEffect(() => {
    const data = getSavedAnalysis();
    if (data) {
      setSaved(data);
    } else {
      setShowNewForm(true);
    }
    setModeState(getMode());
  }, []);

  async function handleAnalyze() {
    if (!nickname.trim()) { setError("닉네임을 입력해줘"); return; }
    if (!year || !month || !day) { setError("생년월일을 모두 선택해줘"); return; }
    setError("");
    setLoading(true);

    try {
      const hourVal   = unknownTime ? null : (hour   !== "" ? Number(hour)   : null);
      const minuteVal = unknownTime ? null : (minute !== "" ? Number(minute) : null);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: Number(year), month: Number(month), day: Number(day), hour: hourVal, minute: minuteVal }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const { scores, recommended } = data;

      saveAnalysis({
        nickname: nickname.trim(),
        year: Number(year), month: Number(month), day: Number(day),
        hour: hourVal, minute: minuteVal,
        scores, recommended,
      });

      const params = new URLSearchParams({
        wood: String(scores.wood), fire: String(scores.fire),
        soil: String(scores.soil), water: String(scores.water),
        metal: String(scores.metal), recommended,
      });
      router.push(`/result?${params}`);
    } catch {
      setError("잠시 후 다시 시도해줘");
      setLoading(false);
    }
  }

  function handleViewSaved() {
    if (!saved) return;
    const { scores, recommended } = saved;
    const params = new URLSearchParams({
      wood: String(scores.wood), fire: String(scores.fire),
      soil: String(scores.soil), water: String(scores.water),
      metal: String(scores.metal), recommended,
    });
    router.push(`/result?${params}`);
  }

  const years  = Array.from({ length: 71 }, (_, i) => 2010 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days   = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours  = Array.from({ length: 24 }, (_, i) => i);

  const isFormMode = showNewForm || !saved;

  return (
    <div className="flex flex-col min-h-screen max-w-[430px] mx-auto bg-white dark:bg-[#0D0D14]">

      {/* 모드 토글 */}
      <div className="flex justify-end px-5 pt-5">
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

      {/* 헤더 타이틀 */}
      <div className="flex flex-col items-center pt-6 pb-4 px-6">
        <p className="text-[10px] text-[#E8896A] dark:text-[#A78BFA] tracking-[0.2em] uppercase mb-2">오행 기운 분석</p>
        <h1 className="text-[26px] font-bold text-[#3D2B1F] dark:text-[#E8E4F0] text-center leading-tight mb-2">
          나를 채워주는<br />다섯 정령
        </h1>
        <p className="text-[13px] text-[#3D2B1F]/45 dark:text-[#E8E4F0]/45 text-center leading-relaxed">
          생년월일로 오늘 내게 부족한 기운을 찾고<br />정령과 대화하며 채워봐
        </p>
      </div>

      {/* 정령 이미지 미리보기 — 2단 배치 */}
      <div className="flex flex-col items-center gap-2 px-6 mb-6">
        <div className="flex justify-center gap-6">
          {spirits.slice(0, 2).map((spirit, i) => (
            <div key={spirit.id} className="flex flex-col items-center">
              <img
                src={`/spirits/${mode === "dark" ? getDarkSpirit(spirit.id).image : spirit.image}`}
                alt={spirit.name}
                className="w-24 h-24 object-contain spirit-breathe"
                style={{ animationDelay: `${i * 0.6}s` }} />
              <span className="text-[13px] font-semibold text-[#3D2B1F]/50 dark:text-[#E8E4F0]/50 mt-1">{spirit.name}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-5">
          {spirits.slice(2).map((spirit, i) => (
            <div key={spirit.id} className="flex flex-col items-center">
              <img
                src={`/spirits/${mode === "dark" ? getDarkSpirit(spirit.id).image : spirit.image}`}
                alt={spirit.name}
                className="w-24 h-24 object-contain spirit-breathe"
                style={{ animationDelay: `${(i + 2) * 0.6}s` }} />
              <span className="text-[13px] font-semibold text-[#3D2B1F]/50 dark:text-[#E8E4F0]/50 mt-1">{spirit.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 저장된 사주 있을 때 — 요약 카드 */}
      {!isFormMode && saved && (
        <div className="px-6">
          <div className="bg-[#FDF8F6] dark:bg-[#13111E] border border-[#F0E0D8] dark:border-[#2D2744] rounded-2xl p-5">
            <p className="text-[13px] font-bold text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70 text-center mb-1">
              {mode === "dark" ? `${darkGreeting} ${saved.nickname}.` : `안녕, ${saved.nickname}!`}
            </p>
            <p className="text-[12px] text-[#3D2B1F]/50 dark:text-[#E8E4F0]/50 text-center mb-4">
              {saved.year}년 {saved.month}월 {saved.day}일생
              {saved.hour !== null
                ? ` · ${String(saved.hour).padStart(2,"0")}시 ${String(saved.minute ?? 0).padStart(2,"0")}분`
                : " · 시간 미기재"}
            </p>
            <button
              onClick={handleViewSaved}
              className="w-full bg-[#E8896A] hover:bg-[#D4785A] dark:bg-[#7C5DBF] dark:hover:bg-[#6B4FA8] text-white font-semibold py-3 rounded-2xl transition-colors text-sm"
            >
              내 오행 분석 보기
            </button>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="w-full mt-3 text-[12px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 hover:text-[#3D2B1F]/60 dark:hover:text-[#E8E4F0]/60 transition-colors py-2"
          >
            새로운 생년월일로 분석하기
          </button>
        </div>
      )}

      {/* 입력 폼 */}
      {isFormMode && (
        <div className="px-6">
          <div className="bg-[#FDF8F6] dark:bg-[#13111E] border border-[#F0E0D8] dark:border-[#2D2744] rounded-2xl p-5">

            {/* 닉네임 */}
            <p className="text-[15px] font-bold text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70 mb-1">닉네임을 알려줘</p>
            <p className="text-[11px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-2">실명이 아니어도 괜찮아</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              maxLength={20}
              className="w-full rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-4 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] placeholder-[#3D2B1F]/30 dark:placeholder-[#E8E4F0]/30 focus:outline-none focus:border-[#E8896A] focus:ring-1 focus:ring-[#E8896A]/20 mb-4"
            />

            {/* 생년월일 */}
            <p className="text-[15px] font-bold text-[#3D2B1F]/70 dark:text-[#E8E4F0]/70 mb-1">생년월일을 알려줘</p>
            <p className="text-[12px] text-[#E8896A] dark:text-[#A78BFA] mb-3">{tagline}</p>
            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="text-[10px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-1 block">연도</label>
                <select value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-2 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA]">
                  <option value="">년</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="w-[72px]">
                <label className="text-[10px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-1 block">월</label>
                <select value={month} onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-2 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA]">
                  <option value="">월</option>
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="w-[72px]">
                <label className="text-[10px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 mb-1 block">일</label>
                <select value={day} onChange={(e) => setDay(e.target.value)}
                  className="w-full rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-2 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA]">
                  <option value="">일</option>
                  {days.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* 태어난 시간 (선택) */}
            <div className="border-t border-[#F0E0D8] dark:border-[#2D2744] pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-[#3D2B1F]/50 dark:text-[#E8E4F0]/50 font-medium">
                  태어난 시간 <span className="text-[#3D2B1F]/30 dark:text-[#E8E4F0]/30 font-normal">(선택 · 사주 정확도 향상)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unknownTime}
                    onChange={(e) => { setUnknownTime(e.target.checked); setHour(""); setMinute(""); }}
                    className="w-3.5 h-3.5 accent-[#E8896A] dark:accent-[#A78BFA]"
                  />
                  <span className="text-[11px] text-[#3D2B1F]/40 dark:text-[#E8E4F0]/40">모름</span>
                </label>
              </div>
              <div className="flex gap-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  disabled={unknownTime}
                  className="flex-1 rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-2 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">시</option>
                  {hours.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}시</option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  disabled={unknownTime}
                  className="flex-1 rounded-xl border border-[#F0E0D8] dark:border-[#2D2744] bg-white dark:bg-[#13111E] px-2 py-2.5 text-sm text-[#3D2B1F] dark:text-[#E8E4F0] focus:outline-none focus:border-[#E8896A] dark:focus:border-[#A78BFA] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">분</option>
                  {[0,10,20,30,40,50].map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}분</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-[11px] text-[#E8896A] dark:text-[#A78BFA] text-center mt-3">{error}</p>}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !nickname.trim() || !year || !month || !day}
            className="w-full mt-4 bg-[#E8896A] hover:bg-[#D4785A] dark:bg-[#7C5DBF] dark:hover:bg-[#6B4FA8] disabled:bg-[#F0E0D8] dark:disabled:bg-[#2D2744] disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm"
          >
            {loading ? "기운 분석 중..." : "내 기운 분석하기"}
          </button>

          {saved && (
            <button onClick={() => setShowNewForm(false)}
              className="w-full mt-2 text-[12px] text-[#3D2B1F]/35 dark:text-[#E8E4F0]/35 hover:text-[#3D2B1F]/60 dark:hover:text-[#E8E4F0]/60 transition-colors py-2">
              취소
            </button>
          )}
        </div>
      )}

      <div className="pb-10" />
    </div>
  );
}
