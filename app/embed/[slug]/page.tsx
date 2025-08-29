'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getSection } from '../../../components/SectionRegistry';
import { notFound } from 'next/navigation';
import { set as setToken, get as getToken } from '../../../lib/auth/tokenStore';
import { authFetch } from '../../../lib/net/authFetch';

export const dynamic = 'force-dynamic';

export default function EmbedPage(props: any) {
  const params = (props as any)?.params ?? {};
  const section = getSection(params.slug);
  if (!section) return notFound();

  const [parentOrigin, setParentOrigin] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState<boolean>(!!getToken());
  const originRef = useRef<string | null>(null);
  const debug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /[?&]ea_debug=1\b/i.test(window.location.search);
  }, []);

  useEffect(() => {
    function onMessage(evt: MessageEvent) {
      const data: any = evt.data || {};
      if (debug) try { console.log('[EA IFRAME] msg', evt.origin, data && data.type); } catch {}
      if (data && data.type === 'EA_PARENT_READY' && typeof data.origin === 'string') {
        originRef.current = data.origin;
        setParentOrigin(data.origin);
      } else if (data && data.type === 'EA_JWT') {
        if (!originRef.current) originRef.current = evt.origin;
        if (!originRef.current || evt.origin.indexOf(window.location.origin) === 0 || evt.origin === originRef.current) {
          setToken(typeof data.jwt === 'string' ? data.jwt : null);
          setTokenReady(!!data.jwt);
          if (debug) try { console.log('[EA IFRAME] token set:', !!data.jwt); } catch {}
        }
      }
    }
    window.addEventListener('message', onMessage);
    // request the token on mount
    try { window.parent && window.parent.postMessage({ type: 'EA_REQUEST_JWT' }, '*'); } catch {}
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Example: demo call to verify the token is used (no UI change)
  useEffect(() => {
    if (!tokenReady) return;
    authFetch('/api/health').catch(() => {});
  }, [tokenReady]);

  useEffect(() => {
    // report initial height
    function sendHeight() {
      const h = document.body.scrollHeight;
      try { window.parent && window.parent.postMessage({ type: 'EA_RESIZE', height: h }, '*'); } catch {}
    }
    sendHeight();
    const ro = new ResizeObserver(sendHeight); ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ padding: 0, margin: 0, background: '#fff', color: '#111', fontFamily: 'ui-sans-serif, system-ui' }}>
      <pre style={{ display: typeof window !== 'undefined' && /ea_debug=1/i.test(window.location.search) ? 'block' : 'none', background:'#f1f5f9', padding:8, overflow:'auto' }}>
        {`parentOrigin=${parentOrigin || 'null'}\ntokenReady=${tokenReady}`}
      </pre>
      {!tokenReady && (
        <div style={{ padding: 12, marginBottom: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
          Please log in on the main site to continue.
        </div>
      )}
      {section}
    </div>
  );
}


