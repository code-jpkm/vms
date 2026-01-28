import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sha256 } from '@/lib/security';
import {
  findValidPasswordResetByHash,
  updateUserPasswordHash,
  markPasswordResetUsed,
} from '@/lib/db';

export async function POST(req) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return NextResponse.json({ message: 'token and newPassword required' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const tokenHash = sha256(token);
    const row = await findValidPasswordResetByHash(tokenHash);
    if (!row) return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPasswordHash(row.user_id, passwordHash);
    await markPasswordResetUsed(row.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
