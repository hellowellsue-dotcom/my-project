export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSpiritById } from "@/lib/spirits";
import { getDarkSpirit } from "@/lib/darkSpirits";
import { AppMode } from "@/lib/mode";

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
    const { spiritId, messages, nickname, mode } = await req.json();
    const isDark = (mode as AppMode) !== "light";

    if (!spiritId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const spirit = getSpiritById(spiritId);
    if (!spirit) {
      return NextResponse.json({ error: "정령을 찾을 수 없습니다." }, { status: 404 });
    }

    const stream = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      stream: true,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: (() => {
            const prompt = isDark ? getDarkSpirit(spirit.id).systemPrompt : spirit.systemPrompt;
            const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
            const dateLine = `오늘 날짜: ${today}.`;
            const nickLine = nickname ? `사용자 닉네임: ${nickname}. 대화에서 자연스럽게 이름을 불러줘. 이름을 다시 묻지 마.` : "";
            return [dateLine, nickLine, prompt].filter(Boolean).join("\n\n");
          })(),
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
