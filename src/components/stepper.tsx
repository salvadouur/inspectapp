import { cn } from "@/lib/utils";

const STEPS = ["Configuración de Obra", "Momento 1", "Momento 2"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex items-center gap-2 text-sm">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "shrink-0 rounded-full px-3 py-1 font-medium whitespace-nowrap",
                done && "bg-success/15 text-success",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : step}. {label}
            </div>
            {step < STEPS.length && <div className="h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
