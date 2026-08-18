export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-2xl bg-primary"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.54}
        height={size * 0.54}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 15 A8 8 0 0 1 20 15 Z" fill="#FFFFFF" />
        <rect x="2" y="14.5" width="20" height="3" rx="1.5" fill="#FFFFFF" />
        <rect x="11" y="4" width="2" height="3" rx="1" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

export function HeaderBar() {
  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl bg-primary px-6 py-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <svg width={26} height={26} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15 A8 8 0 0 1 20 15 Z" fill="#FFFFFF" />
          <rect x="2" y="14.5" width="20" height="3" rx="1.5" fill="#FFFFFF" />
          <rect x="11" y="4" width="2" height="3" rx="1" fill="#FFFFFF" />
        </svg>
      </div>
      <div>
        <div className="text-xl font-black tracking-wide text-white uppercase">INSPECTAPP</div>
        <div className="text-sm text-slate-300">Copiloto digital de inspección</div>
      </div>
    </div>
  );
}
