"use client";
import React, { useMemo, useState } from 'react';
import { authFetch } from '../../lib/net/authFetch';

export default function InlineApply() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ fullName?: string; email?: string; q1?: string; q2?: string; q3?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; status?: number; message?: string } | null>(null);

  const hasJWT = useMemo(() => {
    try { return !!(window.localStorage && window.localStorage.getItem('wp_jwt')); } catch { return false; }
  }, []);

  function next() { setStep(s => Math.min(s + 1, 3)); setResult(null); }
  function prev() { setStep(s => Math.max(s - 1, 0)); setResult(null); }

  async function submit() {
    setSubmitting(true); setResult(null);
    try {
      const token = (window.localStorage && window.localStorage.getItem('wp_jwt')) || '';
      const body = {
        fullName: answers.fullName || '',
        email: answers.email || '',
        position: answers.q1 || '',
        company: answers.q2 || '',
      };
      const res = await authFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, status: res.status, message: (data && (data.error || data.message)) || 'Request failed' });
      } else {
        setResult({ ok: true, status: res.status, message: 'Created' });
        try {
          // Ask parent to redirect on success (works when embedded)
          window.parent && window.parent.postMessage({ type: 'EA_REDIRECT', url: 'https://easyapply.asoldi.com/bestilling/' }, '*');
        } catch {}
      }
    } catch (e: any) {
      setResult({ ok: false, message: String(e?.message || e) });
    } finally { setSubmitting(false); }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', fontFamily: 'ui-sans-serif, system-ui' }}>
      {step === 0 && (
        <section>
          <h2 style={{ marginBottom: 12 }}>Your name</h2>
          <input
            type="text"
            placeholder="Full name"
            value={answers.fullName || ''}
            onChange={e => setAnswers(a => ({ ...a, fullName: e.target.value }))}
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <div style={{ marginTop: 12 }}>
            <button onClick={next}>Next</button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 style={{ marginBottom: 12 }}>Email</h2>
          <input
            type="email"
            placeholder="you@example.com"
            value={answers.email || ''}
            onChange={e => setAnswers(a => ({ ...a, email: e.target.value }))}
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={prev}>Back</button>
            <button onClick={next}>Next</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 style={{ marginBottom: 12 }}>What role are you applying for?</h2>
          <input
            type="text"
            placeholder="e.g. Frontend Engineer"
            value={answers.q1 || ''}
            onChange={e => setAnswers(a => ({ ...a, q1: e.target.value }))}
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={prev}>Back</button>
            <button onClick={next}>Next</button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 style={{ marginBottom: 12 }}>Company name?</h2>
          <input
            type="text"
            placeholder="e.g. ACME"
            value={answers.q2 || ''}
            onChange={e => setAnswers(a => ({ ...a, q2: e.target.value }))}
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={prev}>Back</button>
            <button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button>
          </div>
          {!hasJWT && (
            <p style={{ marginTop: 10, color: '#b45309' }}>
              No JWT detected in this iframe. If you see 401, submit from WordPress via the Forminator bridge (sends the token),
              or set one temporarily in console: <code>localStorage.setItem('wp_jwt','&lt;TOKEN&gt;')</code> on this origin.
            </p>
          )}
          {result && (
            <div style={{ marginTop: 12, padding: 10, background: result.ok ? '#ecfdf5' : '#fef2f2', border: '1px solid #ddd' }}>
              <strong>{result.ok ? 'Success' : 'Error'}</strong>
              {typeof result.status !== 'undefined' && <span> (status {result.status})</span>}
              {result.message && <div style={{ marginTop: 6 }}>{result.message}</div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}


