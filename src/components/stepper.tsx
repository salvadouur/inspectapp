import { cn } from "@/lib/utils";

const STEPS = ["Obra", "M1", "M2"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mb-6 flex min-w-0 items-center gap-1.5 text-sm">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <div
              className={cn(
                "min-w-0 shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap sm:text-sm",
                done && "bg-success/15 text-success",
                active && "bg-primary text-primary-foreground",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? "✓" : label}
            </div>
            {n < STEPS.length && <div className="h-px min-w-2 flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}
