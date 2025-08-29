import { get as getToken } from '../auth/tokenStore';

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  // set JSON content-type if looks like JSON
  if (init.body && typeof init.body === 'string') {
    try { JSON.parse(init.body); if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json'); } catch {}
  }
  return fetch(url, { ...init, headers });
}


