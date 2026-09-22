import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat-system-prompt";

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar GEMINI_API_KEY en el servidor." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const messages: unknown = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Faltan mensajes." }, { status: 400 });
  }

  const safeMessages: ChatMessage[] = messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (safeMessages.length === 0) {
    return NextResponse.json({ error: "Faltan mensajes." }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: safeMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      config: {
        systemInstruction: CHAT_SYSTEM_PROMPT,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text;

    return NextResponse.json({ reply: text || "No pude generar una respuesta, probá de nuevo." });
  } catch (err) {
    console.error("Error llamando a Gemini:", err);
    return NextResponse.json({ error: "No se pudo contactar al asistente. Probá de nuevo." }, { status: 502 });
  }
}
