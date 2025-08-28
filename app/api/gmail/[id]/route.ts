import { NextResponse, NextRequest } from 'next/server';
import { getMessage } from '../../../../lib/gmail';

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  try {
    const data = await getMessage(context.params.id);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}


