import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { withClient, getVendorById } from '@/lib/db';
import { sendLeadAssignedEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const sessionCheck = requireSession(req);
    if (!sessionCheck.ok) return NextResponse.json({ message: sessionCheck.message }, { status: sessionCheck.status });

    const session = sessionCheck.session;
    if (!['admin', 'staff'].includes(session.role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { leadId, vendorId } = await req.json();
    if (!leadId || !vendorId) return NextResponse.json({ message: 'leadId and vendorId required' }, { status: 400 });

    const result = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        // Fetch lead
        const leadRes = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadRes.rows.length === 0) throw new Error('Lead not found');
        const lead = leadRes.rows[0];

        // Cancel current active assignment (keep history)
        await client.query(
          `UPDATE lead_assignments
           SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
           WHERE lead_id = $1
             AND status NOT IN ('completed','cancelled')`,
          [leadId]
        );

        // Create new assignment
        const asgRes = await client.query(
          `INSERT INTO lead_assignments (lead_id, vendor_id, assigned_by_user_id, status)
           VALUES ($1,$2,$3,'assigned')
           RETURNING *`,
          [leadId, vendorId, session.userId || null]
        );
        const assignment = asgRes.rows[0];

        // Set lead status
        await client.query(
          `UPDATE leads
           SET status = 'assigned', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [leadId]
        );

        // Add event
        await client.query(
          `INSERT INTO lead_events (lead_id, actor_type, actor_id, event_type, message)
           VALUES ($1,$2,$3,'reassigned',$4)`,
          [
            leadId,
            session.role,
            session.userId || null,
            `Lead reassigned to vendor #${vendorId} by ${session.role}`,
          ]
        );

        await client.query('COMMIT');
        return { lead, assignment };
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    // Send email to new vendor
    const vendor = await getVendorById(vendorId);
    if (vendor) {
      sendLeadAssignedEmail({
        vendor,
        lead: result.lead,
        assignedBy: `${session.role}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, lead: result.lead, assignment: result.assignment });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
