import { NextResponse } from 'next/server';
import { getUserByEmail, createPasswordResetToken } from '@/lib/db';
import { randomToken, sha256 } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const { email, forRole } = await req.json(); // forRole: "admin" | "staff" (optional UI hint)
    if (!email) return NextResponse.json({ message: 'Email required' }, { status: 400 });

    const user = await getUserByEmail(email);

    // Always return ok (avoid leaking accounts)
    if (!user) return NextResponse.json({ ok: true }, { status: 200 });

    // Optional: ensure role matches the screen (admin forgot page)
    if (forRole && user.role !== forRole) return NextResponse.json({ ok: true }, { status: 200 });

    const raw = randomToken();
    const tokenHash = sha256(raw);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    await createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

    const base =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const resetUrl =
      user.role === 'admin'
        ? `${base}/admin/reset-password?token=${raw}`
        : `${base}/staff/reset-password?token=${raw}`;

    sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl }).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
