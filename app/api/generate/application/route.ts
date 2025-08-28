import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

type BodyInput = {
  applicationId?: string;
  inputs?: Record<string, unknown>;
};

function generateCoverLetter(app: {
  fullName: string; position: string; company: string;
}) {
  return `Dear ${app.company},\n\nMy name is ${app.fullName}. I am excited to apply for the ${app.position} position at ${app.company}.\n\nBest regards,\n${app.fullName}`;
}

export async function POST(req: Request) {
  const json = (await req.json().catch(() => null)) as BodyInput | null;
  if (!json || !json.applicationId) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  // Load the application and write a placeholder coverLetter back to DB
  const app = await prisma.application.findUnique({
    where: { id: BigInt(json.applicationId) },
    select: { userName: true, businessName: true, applicationText: true },
  }).catch(() => null);

  const fullName = app?.userName || 'Applicant';
  const company = app?.businessName || 'Company';
  const position = (app?.applicationText || 'Position').replace(/^Position:\s*/i, '') || 'Position';

  const coverLetter = generateCoverLetter({ fullName, position, company });

  // Persist to DB (store in individualApplicat or cvText as placeholder storage)
  await prisma.application.update({
    where: { id: BigInt(json.applicationId) },
    data: { individualApplicat: coverLetter },
  }).catch(() => undefined);

  return NextResponse.json({ coverLetter });
}


