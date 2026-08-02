// ─── AuthLogo ─────────────────────────────────────────────────────────────────
// Official TernakHub brand mark for all authentication pages.
// Uses the official logo asset at /logo/ternakhub-logo.png.

export default function AuthLogo({ size = 64 }: { size?: number }) {
  return (
    <img
      src="/logo/ternakhub-logo.png"
      alt="TernakHub"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block' }}
      draggable={false}
    />
  );
}
