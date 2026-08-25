import Anthropic from "@anthropic-ai/sdk";
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: CHAT_SYSTEM_PROMPT,
      messages: safeMessages,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return NextResponse.json({ reply: text || "No pude generar una respuesta, probá de nuevo." });
  } catch {
    return NextResponse.json({ error: "No se pudo contactar al asistente. Probá de nuevo." }, { status: 502 });
  }
}
