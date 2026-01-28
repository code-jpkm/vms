import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { withClient } from '@/lib/db';

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
    if (session.role !== 'admin' && session.role !== 'staff') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // pending/approved/rejected
    const q = searchParams.get('q'); // company/email/phone/gst/pan
    const city = searchParams.get('city');
    const state = searchParams.get('state');

    const vendors = await withClient(async (client) => {
      const params = [];
      const where = [];

      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        params.push(status);
        where.push(`v.status = $${params.length}`);
      }
      if (city) {
        params.push(city);
        where.push(`LOWER(v.city) = LOWER($${params.length})`);
      }
      if (state) {
        params.push(state);
        where.push(`LOWER(v.state) = LOWER($${params.length})`);
      }
      if (q) {
        params.push(`%${q}%`);
        where.push(
          `(v.company_name ILIKE $${params.length}
            OR v.email ILIKE $${params.length}
            OR v.phone ILIKE $${params.length}
            OR v.gst_number ILIKE $${params.length}
            OR v.pan_number ILIKE $${params.length})`
        );
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const r = await client.query(
        `SELECT v.id, v.email, v.company_name, v.contact_person_name, v.phone, v.gst_number, v.pan_number,
                v.city, v.state, v.status, v.created_at
         FROM vendors v
         ${whereSql}
         ORDER BY v.created_at DESC`,
        params
      );
      return r.rows;
    });

    return NextResponse.json({ vendors });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
