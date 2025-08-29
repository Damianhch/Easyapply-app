let token: string | null = null;

export function set(t: string | null) {
  token = t || null;
}

export function get(): string | null {
  return token;
}

export function isReady(): boolean {
  return token !== null && token !== undefined && token !== '';
}


