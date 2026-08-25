"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SALUDO: Message = {
  role: "assistant",
  content: "¡Hola! Soy el asistente de INSPECTAPP. Preguntame cómo usar cualquier pantalla de la app.",
};

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([SALUDO]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function handleSend() {
    const texto = input.trim();
    if (!texto || loading) return;

    const nuevos: Message[] = [...messages, { role: "user", content: texto }];
    setMessages(nuevos);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nuevos.filter((m) => m !== SALUDO) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMessages((list) => [...list, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((list) => [
        ...list,
        { role: "assistant", content: "No pude responder ahora. Probá de nuevo en un momento." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open && (
        <div className="mb-3 flex h-[70svh] max-h-[480px] w-[min(90vw,360px)] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <p className="text-sm font-semibold">Ayuda de INSPECTAPP</p>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="text-lg leading-none opacity-80 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Escribiendo…</div>}
          </div>

          <div className="flex gap-2 border-t p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribí tu duda..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="button" size="icon" onClick={handleSend} disabled={loading || !input.trim()} aria-label="Enviar">
              ➤
            </Button>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
        className="ml-auto flex size-14 rounded-full text-2xl shadow-lg"
      >
        {open ? "✕" : "💬"}
      </Button>
    </div>
  );
}
