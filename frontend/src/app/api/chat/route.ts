import { NextRequest, NextResponse } from "next/server";
import { getSpiritById } from "@/lib/spirits";
import { getDarkSpirit } from "@/lib/darkSpirits";

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "API 키 없음 (환경변수 미설정)" }, { status: 500 });
  }

  try {
    const { spiritId, messages, nickname, mode } = await req.json();
    const isDark = mode !== "light";

    if (!spiritId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const spirit = getSpiritById(spiritId);
    if (!spirit) {
      return NextResponse.json({ error: "정령을 찾을 수 없습니다." }, { status: 404 });
    }

    const prompt = isDark ? getDarkSpirit(spirit.id).systemPrompt : spirit.systemPrompt;
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    const dateLine = `오늘 날짜: ${today}.`;
    const nickLine = nickname ? `사용자 닉네임: ${nickname}. 대화에서 자연스럽게 이름을 불러줘. 이름을 다시 묻지 마.` : "";
    const systemContent = [dateLine, nickLine, prompt].filter(Boolean).join("\n\n");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "Five Spirits",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash:free",
        stream: false,
        max_tokens: 1024,
        messages: [
          { role: "system", content: systemContent },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
