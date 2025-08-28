import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyJWT } from '@/lib/auth';

type ApplicationInput = {
  fullName?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  resumeUrl?: string;
  metadata?: unknown;
};

function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyJWT(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as ApplicationInput | null;
  if (!body || !body.fullName || !body.email || !body.position || !body.company) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Map incoming fields to Application columns aligned with Database-structure.html
  const created = await prisma.application.create({
    data: {
      userEmail: body.email,
      userName: body.fullName,
      businessName: body.company,
      applicationText: `Position: ${body.position}`,
      status: 'PENDING',
      acceptedTerms: false,
      planTier: 'FREE',
      userPhone: body.phone ?? null,
    },
    select: { id: true },
  });

  // JSON cannot serialize BigInt; return as string
  return NextResponse.json({ id: created.id.toString() });
}

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyJWT(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  // Prefer filtering by email from token when available
  const userEmail = (payload as any).email as string | undefined;
  if (!userEmail) {
    return NextResponse.json({ error: 'Token missing email' }, { status: 401 });
  }

  const rows = await prisma.application.findMany({
    where: { userEmail },
    orderBy: { applicatioSubmitted: 'desc' },
    select: {
      id: true,
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
    userEmail: r.userEmail,
    userName: r.userName,
    businessName: r.businessName,
    applicationText: r.applicationText,
    status: r.status,
    planTier: r.planTier,
    applicatioSubmitted: r.applicatioSubmitted,
  }));
  return NextResponse.json({ items });
}


