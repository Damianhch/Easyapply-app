import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
export const dynamic = 'force-dynamic';

type ApplicationInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  resumeUrl?: string;
  metadata?: unknown;
  acceptedTerms?: boolean;
  acceptedTimestamp?: string;
  planTier?: string;
};

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = (await req.json().catch(() => null)) as ApplicationInput | null;
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const tokenEmail = (payload as any)?.email as string | undefined;
    const tokenSub = (payload as any)?.sub as string | undefined;
    const missing: string[] = [];
    if (!body.fullName) missing.push('fullName');
    if (!tokenEmail && !body.email) missing.push('email');
    if (!body.position) missing.push('position');
    if (!body.company) missing.push('company');
    if (missing.length) {
      return NextResponse.json({ error: 'Missing required fields', missing }, { status: 400 });
    }

    const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null;
    const created = await prisma.application.create({
      data: {
        wpUserId: tokenSub ?? null,
        userEmail: tokenEmail ?? body.email ?? null,
        userName: body.fullName,
        businessName: body.company,
        applicationText: `Position: ${body.position}`,
        status: 'PENDING',
        acceptedTerms: Boolean(body.acceptedTerms),
        acceptedTimestamp: body.acceptedTerms
          ? (body.acceptedTimestamp ? new Date(body.acceptedTimestamp) : new Date())
          : null,
        planTier: body.planTier ?? 'FREE',
        userPhone: body.phone ?? null,
        tosIp: clientIp,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: created.id.toString() });
  } catch (error: any) {
    console.error('POST /api/applications failed', error);
    return NextResponse.json({ error: 'Internal error', detail: String(error?.message ?? error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyJWT(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const userEmail = (payload as any)?.email as string | undefined;
    const wpUserId = (payload as any)?.sub as string | undefined;
    if (!userEmail && !wpUserId) {
      return NextResponse.json({ error: 'Token missing sub/email' }, { status: 401 });
    }

    const rows = await prisma.application.findMany({
      where: {
        OR: [
          userEmail ? { userEmail } : undefined,
          wpUserId ? { wpUserId } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { applicatioSubmitted: 'desc' },
      select: {
        id: true,
        wpUserId: true,
        userEmail: true,
        userName: true,
        businessName: true,
        applicationText: true,
        status: true,
        planTier: true,
        applicatioSubmitted: true,
      },
    });

    const items = rows.map(r => ({
      id: r.id.toString(),
      wpUserId: r.wpUserId,
      userEmail: r.userEmail,
      userName: r.userName,
      businessName: r.businessName,
      applicationText: r.applicationText,
      status: r.status,
      planTier: r.planTier,
      applicatioSubmitted: r.applicatioSubmitted,
    }));
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('GET /api/applications failed', error);
    return NextResponse.json({ error: 'Internal error', detail: String(error?.message ?? error) }, { status: 500 });
  }
}


