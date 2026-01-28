import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { listUsers } from '@/lib/db';

function getToken(req) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts[0]?.toLowerCase() === 'bearer' && parts[1]) return parts[1];
  return cookies().get('session')?.value || null;
}

export async function GET(req) {
  try {
    const token = getToken(req);
    const session = token ? verifySession(token) : null;
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
