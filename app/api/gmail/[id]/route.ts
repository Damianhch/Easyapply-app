import { NextResponse, NextRequest } from 'next/server';
import { getMessage } from '../../../../lib/gmail';

export async function GET(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split('/');
    const id = segments[segments.length - 1];
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const data = await getMessage(id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


