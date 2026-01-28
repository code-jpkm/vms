import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createVendorWithApplication } from '@/lib/db';
import { sendAdminNotification, sendWelcomeEmail } from '@/lib/email';
import { generateToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    const body = await req.json();

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
      if (!body?.[k]) return NextResponse.json({ message: `${k} is required` }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(body.password, 10);

    const { vendor } = await createVendorWithApplication({
      ...body,
      password_hash,
      status: 'pending',
    });

    // emails (best-effort)
    sendWelcomeEmail(vendor).catch(() => {});
    sendAdminNotification(vendor).catch(() => {});

    // auto login token for vendor
    const token = generateToken({
      id: vendor.id,
      email: vendor.email,
      companyName: vendor.company_name,
      gst: vendor.gst_number,
    });

    return NextResponse.json({ ok: true, vendor: { id: vendor.id, email: vendor.email }, token });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
