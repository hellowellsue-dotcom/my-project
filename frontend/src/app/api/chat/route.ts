import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getCharacterById } from "@/lib/characters";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Character Chat",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { characterId, messages } = await req.json();

    if (!characterId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const character = getCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const stream = await client.chat.completions.create({
      model: "google/gemini-2.5-flash-preview:thinking",
      stream: true,
      messages: [
        { role: "system", content: character.systemPrompt },
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
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
