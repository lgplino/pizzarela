export function PizzaIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="28" fill="#F4A261" stroke="#C17817" strokeWidth="3" />
      <circle cx="32" cy="32" r="22" fill="#E6392B" />
      <circle cx="22" cy="24" r="3.5" fill="#F4A261" />
      <circle cx="38" cy="22" r="2.5" fill="#2D6A4F" />
      <circle cx="28" cy="36" r="3" fill="#F4A261" />
      <circle cx="42" cy="34" r="2.8" fill="#F4A261" />
      <circle cx="34" cy="42" r="2.2" fill="#2D6A4F" />
      <circle cx="20" cy="40" r="2" fill="#2D6A4F" />
    </svg>
  );
}

export function PizzaSliceIcon({ className = "h-5 w-5", color = "#E6392B" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 6 L42 40 H6 Z" fill="#F4A261" stroke="#C17817" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 12 L36 36 H12 Z" fill={color} />
      <circle cx="22" cy="24" r="2" fill="#F4A261" />
      <circle cx="28" cy="30" r="1.6" fill="#2D6A4F" />
      <circle cx="20" cy="32" r="1.4" fill="#F4A261" />
    </svg>
  );
}

export function BasilIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M16 28 C16 28 8 20 8 13 C8 9 11 6 16 4 C21 6 24 9 24 13 C24 20 16 28 16 28 Z"
        fill="#2D6A4F"
      />
      <path d="M16 28 V10" stroke="#1B4332" strokeWidth="1.5" />
    </svg>
  );
}

export function OvenIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="6" y="10" width="36" height="30" rx="4" fill="#5C4033" stroke="#3D2914" strokeWidth="2" />
      <path d="M12 28 Q24 14 36 28" fill="#E6392B" opacity="0.85" />
      <path d="M14 28 Q24 18 34 28" fill="#F4A261" opacity="0.7" />
      <circle cx="24" cy="34" r="2" fill="#F4A261" />
    </svg>
  );
}

export function CheckeredBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #E6392B 25%, transparent 25%),
          linear-gradient(-45deg, #E6392B 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #E6392B 75%),
          linear-gradient(-45deg, transparent 75%, #E6392B 75%)
        `,
        backgroundSize: "28px 28px",
        backgroundPosition: "0 0, 0 14px, 14px -14px, -14px 0",
      }}
      aria-hidden
    />
  );
}
