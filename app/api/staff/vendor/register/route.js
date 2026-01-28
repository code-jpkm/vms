import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/auth';
import { withClient } from '@/lib/db';
import { sendAdminNotification, sendWelcomeEmail } from '@/lib/email';

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
    if (session.role !== 'staff' && session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Minimal required fields (you can add more)
    const required = [
      'email',
      'password',
      'company_name',
      'gst_number',
      'pan_number',
      'account_holder_name',
      'account_number',
      'ifsc_code',
      'bank_name',
      'address',
      'city',
      'state',
      'zip_code',
      'phone',
      'contact_person_name',
    ];
    for (const k of required) {
      if (!body[k]) return NextResponse.json({ message: `Missing ${k}` }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const vendor = await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        const vRes = await client.query(
          `INSERT INTO vendors
           (email, password_hash, company_name, gst_number, pan_number, account_holder_name, account_number,
            ifsc_code, bank_name, address, city, state, zip_code, phone, contact_person_name, status)
           VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')
           RETURNING *`,
          [
            body.email,
            passwordHash,
            body.company_name,
            body.gst_number,
            body.pan_number,
            body.account_holder_name,
            body.account_number,
            body.ifsc_code,
            body.bank_name,
            body.address,
            body.city,
            body.state,
            body.zip_code,
            body.phone,
            body.contact_person_name,
          ]
        );

        const vendorRow = vRes.rows[0];

        // create an application row (like your earlier design)
        const appNumber = `APP-${Date.now()}`;
        await client.query(
          `INSERT INTO applications (vendor_id, application_number, status, submission_date)
           VALUES ($1,$2,'submitted',CURRENT_TIMESTAMP)`,
          [vendorRow.id, appNumber]
        );

        await client.query(
          `INSERT INTO audit_logs (vendor_id, user_id, action, details)
           VALUES ($1,$2,'staff_vendor_registered',$3)`,
          [vendorRow.id, session.id, JSON.stringify({ by: session.email })]
        );

        await client.query('COMMIT');
        return vendorRow;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    });

    // emails (admin notified, vendor welcome)
    sendAdminNotification(vendor).catch(() => {});
    sendWelcomeEmail(vendor).catch(() => {});

    return NextResponse.json({ ok: true, vendorId: vendor.id });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
