export const runtime = "edge";

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

export type EmotionType = "sad" | "anxious" | "angry" | "tired" | "happy" | "lonely" | "neutral";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ emotion: "neutral" });
    }

    const result = await client.chat.completions.create({
      model: "google/gemma-4-31b-it:free",
      stream: false,
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content:
            "Classify the primary emotion in this Korean message. Reply with exactly one word: sad, anxious, angry, tired, happy, lonely, or neutral.",
        },
        { role: "user", content: message },
      ],
    });

    const raw = result.choices[0]?.message?.content?.trim().toLowerCase() ?? "neutral";
    const valid: EmotionType[] = ["sad", "anxious", "angry", "tired", "happy", "lonely", "neutral"];
    const emotion: EmotionType = valid.find((e) => raw.includes(e)) ?? "neutral";

    return NextResponse.json({ emotion });
  } catch {
    return NextResponse.json({ emotion: "neutral" });
  }
}
