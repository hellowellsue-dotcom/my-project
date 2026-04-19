import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ sincere: false });
    }

    const result = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      stream: false,
      max_tokens: 5,
      messages: [
        {
          role: "system",
          content:
            "You evaluate if a Korean message is sincere/heartfelt — sharing genuine personal feelings, struggles, fears, gratitude, or meaningful reflection. Reply with only 'yes' or 'no'.",
        },
        { role: "user", content: message },
      ],
    });

    const answer = result.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    return NextResponse.json({ sincere: answer.startsWith("yes") });
  } catch {
    return NextResponse.json({ sincere: false });
  }
}
