import { Link } from 'react-router-dom';

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 46,
  padding: '0 22px',
  borderRadius: 12,
  fontWeight: 700,
  textDecoration: 'none',
};

export default function Landing() {
  return (
    <main style={{ minHeight: '100dvh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px max(20px, 5vw)' }}>
        <strong style={{ color: 'var(--color-primary)', fontSize: 22 }}>TernakHub</strong>
        <Link to="/login" style={{ ...linkStyle, minHeight: 40, padding: '0 16px', background: 'var(--color-primary)', color: '#fff' }}>Masuk</Link>
      </header>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '72px max(20px, 5vw) 96px', display: 'grid', gap: 36, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--color-primary)', fontWeight: 700, marginBottom: 14 }}>Platform operasional peternakan</div>
          <h1 style={{ fontSize: 'clamp(38px, 7vw, 72px)', lineHeight: 1.05, margin: '0 0 20px' }}>Kelola ternak. Tumbuh lebih terarah.</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--color-muted)', maxWidth: 600 }}>Satu ruang kerja untuk data ternak, pakan, kesehatan, reproduksi, dan aktivitas bisnis Anda.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 28 }}>
            <Link to="/login" style={{ ...linkStyle, background: 'var(--color-primary)', color: '#fff' }}>Masuk ke TernakHub</Link>
            <Link to="/register" style={{ ...linkStyle, border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>Daftar gratis</Link>
          </div>
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: 24, padding: 28, boxShadow: 'var(--shadow-md, 0 12px 40px rgba(0,0,0,.08))' }}>
          <div style={{ fontSize: 56, marginBottom: 18 }}>🐄</div>
          <h2 style={{ margin: '0 0 10px' }}>Semua keputusan, lebih dekat dengan datanya.</h2>
          <p style={{ color: 'var(--color-muted)', lineHeight: 1.6, margin: 0 }}>Temukan aset, layanan, berita, dan insight yang membantu bisnis peternakan berjalan lebih baik.</p>
        </div>
      </section>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 max(20px, 5vw) 72px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Link to="/marketplace" style={{ ...linkStyle, background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>Jelajahi Marketplace</Link>
        <Link to="/news-event" style={{ ...linkStyle, background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>Baca News & Event</Link>
      </section>
    </main>
  );
}