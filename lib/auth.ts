import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export interface JWTPayload {
  sub: string; // userId
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    // Try HS256 first (WP_JWT_SECRET)
    if (process.env.WP_JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.WP_JWT_SECRET) as JWTPayload;
      return decoded;
    }
    
    // Try RS256 (WP_JWT_PUBLIC_KEY)
    if (process.env.WP_JWT_PUBLIC_KEY) {
      const decoded = jwt.verify(token, process.env.WP_JWT_PUBLIC_KEY, {
        algorithms: ['RS256']
      }) as JWTPayload;
      return decoded;
    }
    
    throw new Error('No JWT secret or public key configured');
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  const tokenCookie = request.cookies.get('jwt_token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  
  const payload = verifyJWT(token);
  return payload?.sub || null;
}
