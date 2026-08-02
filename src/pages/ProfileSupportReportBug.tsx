// ─── Support — Report Bug (PROFILE-010) ──────────────────────────────────────
// Form pelaporan bug. Submission disimpan oleh data layer.

import { useState } from 'react';
import { submitBugReport, BUG_KATEGORI_LIST, type BugKategori } from '../data/profileSupportData';

export default function ProfileSupportReportBug() {
  const [judul,      setJudul]      = useState('');
  const [kategori,   setKategori]   = useState<BugKategori | ''>('');
  const [deskripsi,  setDeskripsi]  = useState('');
  const [screenshot, setScreenshot] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState('');

  function handleSubmit() {
    if (!judul.trim()) { setError('Judul wajib diisi.'); return; }
    if (!kategori)     { setError('Pilih kategori bug.'); return; }
    if (!deskripsi.trim()) { setError('Deskripsi wajib diisi.'); return; }

    submitBugReport({
      judul:      judul.trim(),
      kategori:   kategori as BugKategori,
      deskripsi:  deskripsi.trim(),
      screenshot,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ padding: '40px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
          Laporan Terkirim!
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65, marginBottom: 24 }}>
          Terima kasih telah melaporkan bug ini. Tim kami akan meninjau dan menindaklanjuti laporan Anda.
        </div>
        <button onClick={() => {
          setJudul(''); setKategori(''); setDeskripsi(''); setScreenshot(false); setSubmitted(false); setError('');
        }} style={{
          padding: '12px 28px', borderRadius: 10,
          background: '#1b7a43', color: '#fff', border: 'none',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Laporkan Bug Lain
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', boxSizing: 'border-box',
    border: '1px solid var(--color-border)', borderRadius: 10,
    fontSize: 13, outline: 'none', background: 'var(--color-surface)',
    color: 'var(--color-text)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
    marginBottom: 6, display: 'block', letterSpacing: 0.3,
  };

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: 640, margin: '0 auto' }}>

      <div style={{
        background: '#fef3c7', border: '1px solid #fde68a',
        borderRadius: 12, padding: '12px 16px',
        marginBottom: 20, fontSize: 13, color: '#92400e', lineHeight: 1.5,
      }}>
        🐛 Laporan bug membantu kami meningkatkan kualitas TernakHub. Mohon deskripsikan masalah sejelas mungkin.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Judul */}
        <div>
          <label style={labelStyle}>JUDUL BUG <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="text"
            placeholder="Contoh: Tombol simpan tidak berfungsi di halaman ternak"
            value={judul}
            onChange={e => { setJudul(e.target.value); setError(''); }}
            maxLength={120}
            style={inputStyle}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
            {judul.length}/120
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label style={labelStyle}>KATEGORI <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={kategori}
            onChange={e => { setKategori(e.target.value as BugKategori); setError(''); }}
            style={{ ...inputStyle, appearance: 'none' }}
          >
            <option value="">— Pilih kategori —</option>
            {BUG_KATEGORI_LIST.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Deskripsi */}
        <div>
          <label style={labelStyle}>DESKRIPSI MASALAH <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            placeholder="Jelaskan masalah yang Anda alami: langkah-langkah untuk mereproduksi bug, apa yang seharusnya terjadi, dan apa yang sebenarnya terjadi."
            value={deskripsi}
            onChange={e => { setDeskripsi(e.target.value); setError(''); }}
            rows={5}
            maxLength={1000}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
            {deskripsi.length}/1000
          </div>
        </div>

        {/* Screenshot toggle */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                📸 Sertakan Screenshot
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                Opsional. Tandai jika Anda memiliki screenshot untuk dibagikan kepada tim support.
              </div>
            </div>
            <button
              onClick={() => setScreenshot(s => !s)}
              style={{
                width: 44, height: 26, borderRadius: 13,
                background: screenshot ? '#1b7a43' : '#d1d5db',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background .2s', flexShrink: 0,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: '#fff',
                position: 'absolute', top: 3,
                left: screenshot ? 21 : 3,
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,.2)',
              }} />
            </button>
          </div>
          {screenshot && (
            <div style={{
              marginTop: 10,
              background: '#f3f4f6', borderRadius: 8, padding: '10px 12px',
              fontSize: 12, color: 'var(--color-muted)', textAlign: 'center',
              border: '1px dashed var(--color-border)',
            }}>
              📎 Screenshot tersedia untuk ditambahkan pada tindak lanjut laporan.
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#b91c1c', fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', padding: '14px',
            background: '#dc2626', color: '#fff', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          🐛 Kirim Laporan Bug
        </button>
      </div>
    </div>
  );
}
