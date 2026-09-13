type IconProps = {
  className?: string;
};

export function ThemeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4.5" width="12" height="15" rx="1.1" fill="#ffe56a" />
      <path d="M14.2 4.5 18 8.3v.1h-3.1c-.4 0-.7-.3-.7-.7Z" fill="#f3d24a" />
      <path d="M14.2 4.5v3.2c0 .4.3.7.7.7H18" fill="none" stroke="#c9a63d" strokeWidth="0.85" />
      <path d="M8.4 12h7.2M8.4 15.2h5.1" fill="none" stroke="#2a2618" strokeWidth="1.05" strokeLinecap="round" />
    </svg>
  );
}

export function OrganizeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.2" y="7.2" width="4.8" height="7.6" rx="0.7" fill="currentColor" />
      <rect x="9.6" y="7.2" width="4.8" height="7.6" rx="0.7" fill="currentColor" />
      <rect x="16" y="7.2" width="4.8" height="7.6" rx="0.7" fill="currentColor" />
      <path d="M3.2 17.6h17.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Start from a structure (R38): beats along a line, like the strip. */
export function StructureIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.2 12h17.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4" y="7.4" width="3.2" height="9.2" rx="0.7" fill="currentColor" />
      <rect x="10.4" y="7.4" width="3.2" height="9.2" rx="0.7" fill="currentColor" />
      <rect x="16.8" y="7.4" width="3.2" height="9.2" rx="0.7" fill="currentColor" />
    </svg>
  );
}

export function GroupIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.2"
        y="4.8"
        width="17.6"
        height="14.4"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeDasharray="2.3 1.7"
      />
      <rect x="6.2" y="8.3" width="5" height="7.2" rx="0.65" fill="currentColor" />
      <rect x="12.8" y="8.3" width="5" height="7.2" rx="0.65" fill="currentColor" />
    </svg>
  );
}

export function ScatterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.4" y="3.6" width="5.2" height="7.4" rx="0.7" fill="currentColor" transform="rotate(-18 5 7.3)" />
      <rect x="15.2" y="3.2" width="5.2" height="7.4" rx="0.7" fill="currentColor" transform="rotate(17 17.8 6.9)" />
      <rect x="8.6" y="13" width="5.2" height="7.4" rx="0.7" fill="currentColor" transform="rotate(-8 11.2 16.7)" />
    </svg>
  );
}

// Stand back and see the whole wall: corner brackets pulling outward around
// the cards.
export function FitIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.4 8.6V4.6a1.2 1.2 0 0 1 1.2-1.2h4M20.6 8.6V4.6a1.2 1.2 0 0 0-1.2-1.2h-4M3.4 15.4v4a1.2 1.2 0 0 0 1.2 1.2h4M20.6 15.4v4a1.2 1.2 0 0 1-1.2 1.2h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="8.2" y="9.2" width="3.3" height="5.6" rx="0.6" fill="currentColor" />
      <rect x="12.5" y="9.2" width="3.3" height="5.6" rx="0.6" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({
  className,
  direction,
}: IconProps & { direction: "left" | "right" | "up" | "down" }) {
  const rotate = { left: 180, right: 0, up: -90, down: 90 }[direction];
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M9 6.5 15 12 9 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UndoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.5 7.5 5.5 11l4 3.5M6 11h8.2a4.3 4.3 0 0 1 0 8.6H11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RedoIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m14.5 7.5 4 3.5-4 3.5M18 11H9.8a4.3 4.3 0 0 0 0 8.6H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
