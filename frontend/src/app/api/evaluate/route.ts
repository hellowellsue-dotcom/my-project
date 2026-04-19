import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") return NextResponse.json({ sincere: false });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ sincere: false });

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
        max_tokens: 5,
        messages: [
          {
            role: "system",
            content: "You evaluate if a Korean message is sincere/heartfelt — sharing genuine personal feelings, struggles, fears, gratitude, or meaningful reflection. Reply with only 'yes' or 'no'.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json({ sincere: false });

    const data = await res.json() as { choices?: { message?: { content?: string } }[] };
    const answer = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";
    return NextResponse.json({ sincere: answer.startsWith("yes") });
  } catch {
    return NextResponse.json({ sincere: false });
  }
}
