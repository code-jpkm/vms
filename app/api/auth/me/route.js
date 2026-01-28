import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';

export async function GET() {
  try {
    // ✅ In your Next version, cookies() is async
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const session = verifySession(token);

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // ✅ Your JWT payload is the session fields directly
    return NextResponse.json(
      {
        user: {
          id: session.id,
          email: session.email,
          name: session.name,
          role: session.role,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
