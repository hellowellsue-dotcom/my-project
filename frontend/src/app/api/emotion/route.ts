import { NextRequest, NextResponse } from "next/server";

export type EmotionType = "sad" | "anxious" | "angry" | "tired" | "happy" | "lonely" | "neutral";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") return NextResponse.json({ emotion: "neutral" });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ emotion: "neutral" });

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
        max_tokens: 10,
        messages: [
          {
            role: "system",
            content: "Classify the primary emotion in this Korean message. Reply with exactly one word: sad, anxious, angry, tired, happy, lonely, or neutral.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ emotion: "neutral" });

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "neutral";
    const valid: EmotionType[] = ["sad", "anxious", "angry", "tired", "happy", "lonely", "neutral"];
    const emotion: EmotionType = valid.find((e) => raw.includes(e)) ?? "neutral";
    return NextResponse.json({ emotion });
  } catch {
    return NextResponse.json({ emotion: "neutral" });
  }
}
