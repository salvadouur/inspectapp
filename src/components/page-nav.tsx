import Link from "next/link";

export function PageNav({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between text-sm">
      <Link href={backHref} className="font-medium text-primary underline underline-offset-4">
        ← {backLabel}
      </Link>
      {backHref !== "/" && (
        <Link href="/" className="text-muted-foreground underline underline-offset-4">
          🏠 Inicio
        </Link>
      )}
    </div>
  );
}
