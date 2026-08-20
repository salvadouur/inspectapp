import { cn } from "@/lib/utils";

const STEPS = [
  { full: "Configuración de Obra", short: "Obra" },
  { full: "Momento 1", short: "M1" },
  { full: "Momento 2", short: "M2" },
];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex min-w-0 items-center gap-1.5 text-sm">
      {STEPS.map((step, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={step.full} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div
              className={cn(
                "min-w-0 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap sm:px-3 sm:text-sm",
                done && "bg-success/15 text-success",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : n}.{" "}
              <span className="sm:hidden">{step.short}</span>
              <span className="hidden sm:inline">{step.full}</span>
            </div>
            {n < STEPS.length && <div className="h-px min-w-2 flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
