// ─── PageContent — Shared page-level content container ────────────────────────
//
// Matches Dashboard's outer wrapper exactly:
//   padding: 20px 16px 8px  (top breathing room + side gutters + bottom gap)
//   maxWidth: 960            (comfortable reading width on large screens)
//   margin: 0 auto           (centred)
//   display: flex / column   (sections stack vertically with uniform gap)
//
// Usage:
//   import PageContent from '../components/PageContent';
//   <PageContent>…</PageContent>
//
// Props:
//   gap   — vertical gap between direct children (default: 28, matches Dashboard)
//   style — escape hatch for page-specific overrides (e.g. position: relative)

import type { ReactNode, CSSProperties } from 'react';

interface PageContentProps {
  children: ReactNode;
  /** Vertical gap between direct children. Defaults to 28 (Dashboard standard). */
  gap?: number;
  /** Escape hatch — merged last so it can override any base style if needed. */
  style?: CSSProperties;
  /** Optional class name for shell-wide overrides. */
  className?: string;
}

export default function PageContent({ children, gap = 28, style, className }: PageContentProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '20px 16px calc(24px + var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        maxWidth: 960,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap,
        overflowX: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
