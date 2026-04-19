export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  apiKey: process.env.GOOGLE_AI_KEY,
});

export type EmotionType = "sad" | "anxious" | "angry" | "tired" | "happy" | "lonely" | "neutral";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ emotion: "neutral" });
    }

    const result = await client.chat.completions.create({
      model: "gemini-2.5-flash",
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
