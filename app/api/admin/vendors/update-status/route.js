import { NextResponse } from 'next/server';
import { updateVendorStatus, getVendorById } from '@/lib/db';
import { requireSession, requireRole } from '@/lib/auth';
import { sendStatusUpdateEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const auth = requireSession(req);
    if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
    if (!requireRole(auth.session, ['admin']))
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const { vendorId, status, adminNotes, rejectionReason } = await req.json();
    if (!vendorId || !status) return NextResponse.json({ message: 'vendorId and status required' }, { status: 400 });

    const result = await updateVendorStatus({
      vendorId: Number(vendorId),
      status,
      adminNotes: adminNotes || null,
      rejectionReason: rejectionReason || null,
    });

    const vendor = await getVendorById(Number(vendorId));

    // notify vendor email
    const msg =
      status === 'approved'
        ? 'Congratulations! Your application is approved. You can now receive and manage leads.'
        : status === 'rejected'
          ? rejectionReason || 'Your application was rejected.'
          : 'Your application is under review.';

    sendStatusUpdateEmail(vendor, status, msg).catch(() => {});

    return NextResponse.json({ ok: true, vendor: result.vendor });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
