// ─── Support — Send Feedback (PROFILE-010) ────────────────────────────────────
// Form feedback: rating, kategori, pesan. Tidak dikirim ke backend.

import { useState } from 'react';
import { submitFeedback, FEEDBACK_KATEGORI_LIST, type FeedbackKategori } from '../data/profileSupportData';

const STAR_LABELS: Record<number, string> = {
  1: 'Sangat Buruk 😞',
  2: 'Buruk 😕',
  3: 'Cukup 😐',
  4: 'Bagus 🙂',
  5: 'Luar Biasa 🤩',
};

export default function ProfileSupportFeedback() {
  const [rating,    setRating]    = useState<number>(0);
  const [kategori,  setKategori]  = useState<FeedbackKategori | ''>('');
  const [pesan,     setPesan]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  function handleSubmit() {
    if (!rating)    { setError('Berikan penilaian bintang terlebih dahulu.'); return; }
    if (!kategori)  { setError('Pilih kategori feedback.'); return; }
    if (!pesan.trim()) { setError('Tulis pesan feedback Anda.'); return; }

    submitFeedback({
      rating:   rating as 1 | 2 | 3 | 4 | 5,
      kategori: kategori as FeedbackKategori,
      pesan:    pesan.trim(),
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ padding: '40px 16px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>💜</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
          Terima Kasih!
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.65, marginBottom: 24 }}>
          Feedback Anda sangat berharga bagi kami untuk terus meningkatkan TernakHub. Kami mendengarkan setiap masukan dengan serius.
        </div>
        <button onClick={() => {
          setRating(0); setKategori(''); setPesan(''); setSubmitted(false); setError('');
        }} style={{
          padding: '12px 28px', borderRadius: 10,
          background: '#7c3aed', color: '#fff', border: 'none',
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          Kirim Feedback Lain
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
        background: '#ede9fe', border: '1px solid #ddd6fe',
        borderRadius: 12, padding: '12px 16px',
        marginBottom: 20, fontSize: 13, color: '#5b21b6', lineHeight: 1.5,
      }}>
        💬 Pendapat Anda membantu kami membangun TernakHub yang lebih baik. Semua feedback dibaca oleh tim kami.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Rating bintang */}
        <div>
          <label style={labelStyle}>PENILAIAN KESELURUHAN <span style={{ color: '#dc2626' }}>*</span></label>
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '18px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => { setRating(s); setError(''); }}
                  style={{
                    fontSize: s <= rating ? 36 : 30,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: s <= rating ? '#f59e0b' : '#d1d5db',
                    transition: 'all .15s',
                    transform: s <= rating ? 'scale(1.1)' : 'scale(1)',
                    lineHeight: 1,
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1b7a43' }}>
                {STAR_LABELS[rating]}
              </div>
            )}
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label style={labelStyle}>KATEGORI <span style={{ color: '#dc2626' }}>*</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FEEDBACK_KATEGORI_LIST.map(k => (
              <button
                key={k}
                onClick={() => { setKategori(k); setError(''); }}
                style={{
                  padding: '8px 14px', borderRadius: 20,
                  background: kategori === k ? '#7c3aed' : 'var(--color-surface)',
                  color: kategori === k ? '#fff' : 'var(--color-muted)',
                  border: `1px solid ${kategori === k ? '#7c3aed' : 'var(--color-border)'}`,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Pesan */}
        <div>
          <label style={labelStyle}>PESAN <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            placeholder="Bagikan pengalaman, saran fitur, atau hal yang ingin Anda lihat di TernakHub..."
            value={pesan}
            onChange={e => { setPesan(e.target.value); setError(''); }}
            rows={5}
            maxLength={800}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-muted)', marginTop: 3 }}>
            {pesan.length}/800
          </div>
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
            background: '#7c3aed', color: '#fff', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          💬 Kirim Feedback
        </button>
      </div>
    </div>
  );
}
