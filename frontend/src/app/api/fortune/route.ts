export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSpiritById } from "@/lib/spirits";
import { getDarkSpirit } from "@/lib/darkSpirits";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Five Spirits",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { spiritId, mode } = await req.json();
    if (!spiritId) return NextResponse.json({ error: "spiritId 필요" }, { status: 400 });

    const spirit = getSpiritById(spiritId);
    if (!spirit) return NextResponse.json({ error: "정령 없음" }, { status: 404 });

    const isDark = mode === "dark";
    const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
    const systemPrompt = isDark ? getDarkSpirit(spirit.id).systemPrompt : spirit.systemPrompt;

    const userPrompt = isDark
      ? `오늘(${today}) ${spirit.ohangKor}(${spirit.ohang}) 기운이 부족한 사람에게 팩폭 한마디를 해줘.\n- 딱 2~3문장\n- 근거 있는 직언, 냉소적이지만 틀린 말은 없어야 해\n- 오늘 당장 할 수 있는 불편한 행동 1가지 포함\n- 평소 말투 그대로, 과도한 위로 절대 금지`
      : `오늘(${today}) ${spirit.ohangKor}(${spirit.ohang}) 기운이 부족한 사람에게 짧은 한마디를 해줘.\n- 딱 2~3문장\n- 오늘 바로 해볼 수 있는 아주 작은 행동 1가지 포함\n- 평소 말투 그대로`;

    const completion = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 120,
    });

    const fortune = completion.choices[0]?.message?.content?.trim() ?? "";
    return NextResponse.json({ fortune });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
