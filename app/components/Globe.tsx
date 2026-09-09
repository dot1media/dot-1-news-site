// Red spinning globe that replaces the "1" in the DOT 1 NEWS wordmark.
// `size` follows the surrounding text (em-based) so it scales with the heading.
export default function Globe({ size = "1em", title = "1" }: { size?: string | number; title?: string }) {
  return (
    <span aria-label={title} role="img" style={{ display: "inline-block", width: size, height: size, verticalAlign: "-0.14em", lineHeight: 0 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: "block", animation: "dot1-globe-spin 9s linear infinite", transformOrigin: "50% 50%" }}>
        <defs>
          <clipPath id="dot1-globe-clip"><circle cx="50" cy="50" r="46" /></clipPath>
          <radialGradient id="dot1-globe-shade" cx="38%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#e8433a" />
            <stop offset="55%" stopColor="#c81c1c" />
            <stop offset="100%" stopColor="#8f1010" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="url(#dot1-globe-shade)" />
        <g clipPath="url(#dot1-globe-clip)" fill="none" stroke="#fff" strokeWidth="2" opacity="0.9">
          {/* meridians */}
          <ellipse cx="50" cy="50" rx="46" ry="46" />
          <ellipse cx="50" cy="50" rx="30" ry="46" />
          <ellipse cx="50" cy="50" rx="14" ry="46" />
          <line x1="50" y1="4" x2="50" y2="96" />
          {/* parallels */}
          <line x1="6" y1="50" x2="94" y2="50" />
          <line x1="12" y1="30" x2="88" y2="30" />
          <line x1="12" y1="70" x2="88" y2="70" />
          <line x1="22" y1="16" x2="78" y2="16" />
          <line x1="22" y1="84" x2="78" y2="84" />
        </g>
        <circle cx="50" cy="50" r="46" fill="none" stroke="#7a0d0d" strokeWidth="2" />
      </svg>
    </span>
  );
}
