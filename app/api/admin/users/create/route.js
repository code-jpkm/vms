import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';
import { createUser, getUserByEmail } from '@/lib/db';
import { sendNewUserCredentialsEmail } from '@/lib/email';

function getToken(req) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts[0]?.toLowerCase() === 'bearer' && parts[1]) return parts[1];
  return cookies().get('session')?.value || null;
}

function makeTempPassword() {
  return `Tmp@${Math.random().toString(36).slice(2, 8)}${Math.floor(100 + Math.random() * 900)}`;
}

export async function POST(req) {
  try {
    const token = getToken(req);
    const session = token ? verifySession(token) : null;
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { email, name, role } = await req.json();
    if (!email || !name || !role) {
      return NextResponse.json({ message: 'email, name, role required' }, { status: 400 });
    }
    if (!['admin', 'staff'].includes(role)) {
      return NextResponse.json({ message: 'role must be admin or staff' }, { status: 400 });
    }

    const exists = await getUserByEmail(email);
    if (exists) return NextResponse.json({ message: 'User already exists' }, { status: 409 });

    const tempPassword = makeTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await createUser({ email, passwordHash, name, role });

    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = role === 'admin' ? `${base}/admin` : `${base}/staff`;

    sendNewUserCredentialsEmail({
      to: email,
      name,
      role,
      tempPassword,
      loginUrl,
    }).catch(() => {});

    // ✅ IMPORTANT: return tempPassword so your UI can display it too
    return NextResponse.json({ ok: true, user, tempPassword });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
