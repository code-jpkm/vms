import { NextResponse } from 'next/server';
import { listLeadsAdmin } from '@/lib/db';
import { requireSession, requireRole } from '@/lib/auth';

export async function GET(req) {
  try {
    const auth = requireSession(req);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!requireRole(auth.session, ['admin', 'staff']))
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const leads = await listLeadsAdmin();
    return NextResponse.json({ leads });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
