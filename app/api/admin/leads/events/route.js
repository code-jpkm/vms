import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { withClient } from '@/lib/db';

export async function GET(req) {
  try {
    const sessionCheck = requireSession(req);
    if (!sessionCheck.ok) return NextResponse.json({ message: sessionCheck.message }, { status: sessionCheck.status });

    const url = new URL(req.url);
    const leadId = Number(url.searchParams.get('leadId'));
    if (!leadId) return NextResponse.json({ message: 'leadId is required' }, { status: 400 });

    const events = await withClient(async (client) => {
      const r = await client.query(
        `SELECT id, lead_id, actor_type, actor_id, event_type, message, created_at
         FROM lead_events
         WHERE lead_id = $1
         ORDER BY created_at DESC`,
        [leadId]
      );
      return r.rows;
    });

    return NextResponse.json({ ok: true, events });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
