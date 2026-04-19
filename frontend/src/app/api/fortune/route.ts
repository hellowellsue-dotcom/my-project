import { NextRequest, NextResponse } from "next/server";
import { getSpiritById } from "@/lib/spirits";
import { getDarkSpirit } from "@/lib/darkSpirits";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API 키 없음" }, { status: 500 });

  try {
    const { spiritId, mode } = await req.json();
    if (!spiritId) return NextResponse.json({ error: "spiritId 필요" }, { status: 400 });

    const spirit = getSpiritById(spiritId);
    if (!spirit) return NextResponse.json({ error: "정령 없음" }, { status: 404 });

    const isDark = mode === "dark";
    const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    const systemPrompt = "반드시 한국어로만 대답해. 영어 사용 절대 금지.\n\n" +
      (isDark ? getDarkSpirit(spirit.id).systemPrompt : spirit.systemPrompt);

    const userPrompt = isDark
      ? `오늘(${today}) ${spirit.ohangKor}(${spirit.ohang}) 기운이 부족한 사람에게 팩폭 한마디를 해줘.\n- 딱 2~3문장\n- 근거 있는 직언, 냉소적이지만 틀린 말은 없어야 해\n- 오늘 당장 할 수 있는 불편한 행동 1가지 포함\n- 평소 말투 그대로, 과도한 위로 절대 금지`
      : `오늘(${today}) ${spirit.ohangKor}(${spirit.ohang}) 기운이 부족한 사람에게 짧은 한마디를 해줘.\n- 딱 2~3문장\n- 오늘 바로 해볼 수 있는 아주 작은 행동 1가지 포함\n- 평소 말투 그대로`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://charcter-chat.vercel.app",
        "X-Title": "Five Spirits",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 120,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const fortune = data.choices?.[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ fortune });
  } catch (err) {
    const message = err instanceof Error ? err.message : "서버 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
