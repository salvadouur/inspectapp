import Link from "next/link";
import { Button } from "@/components/ui/button";

function HouseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.5 5.5V4h2v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PageNav({ backHref, backLabel }: { backHref: string; backLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <Button render={<Link href={backHref} />} variant="secondary" size="sm">
        ← {backLabel}
      </Button>
      {backHref !== "/" && (
        <Button render={<Link href="/" />} size="icon" aria-label="Inicio">
          <HouseIcon />
        </Button>
      )}
    </div>
  );
}
