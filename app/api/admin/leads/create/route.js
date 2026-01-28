import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { createLead, getVendorById, withClient } from '@/lib/db';
import { sendLeadAssignedEmail } from '@/lib/email';

function getToken(req) {
  const auth = req.headers.get('authorization') || '';
  const parts = auth.split(' ');
  if (parts[0]?.toLowerCase() === 'bearer' && parts[1]) return parts[1];
  return cookies().get('session')?.value || null;
}

export async function POST(req) {
  try {
    const token = getToken(req);
    const session = token ? verifySession(token) : null;
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    if (session.role !== 'admin' && session.role !== 'staff') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { customerName, customerPhone, customerEmail, location, details, vendorId } = await req.json();
    if (!customerName) return NextResponse.json({ message: 'customerName required' }, { status: 400 });

    const { lead, assignment } = await createLead({
      customerName,
      customerPhone,
      customerEmail,
      location,
      details,
      createdByUserId: session.id,
      vendorId: vendorId ? Number(vendorId) : null,
      assignedByUserId: session.id,
    });

    // ✅ Guarantee: if vendorId exists, vendor gets email
    if (vendorId) {
      const vendor = await getVendorById(Number(vendorId));

      // fetch full lead row to get lead_number etc (createLead already returns it, but safe)
      const leadRow = await withClient(async (client) => {
        const r = await client.query(`SELECT * FROM leads WHERE id = $1`, [lead.id]);
        return r.rows[0];
      });

      if (vendor?.email) {
        sendLeadAssignedEmail({
          vendor,
          lead: leadRow || lead,
          assignedBy: session.name || session.email,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, lead, assignment });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
