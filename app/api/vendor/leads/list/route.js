import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { listVendorLeads } from '@/lib/db';

export async function GET(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const leads = await listVendorLeads(Number(payload.id));
    return NextResponse.json({ leads });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
