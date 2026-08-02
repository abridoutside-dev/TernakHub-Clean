export default function PageShell({ title }: { title: string }) {
  return (
    <div
      style={{
        minHeight: 'calc(100dvh - var(--top-app-bar-height) - var(--bottom-nav-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--color-text)' }}>
        {title}
      </h1>
    </div>
  );
}
