import { NextResponse } from 'next/server';
import {updateVendorStatus, getVendorById } from '../../../../../lib/db';
import { requireSession, requireRole } from '@/lib/auth';
import { sendStatusUpdateEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const auth = requireSession(req);
    if (!auth.ok) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    if (!requireRole(auth.session, ['admin'])) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const vendorId = Number(body.vendorId);
    const status = body.status;
    const adminNotes = body.adminNotes ?? null;
    const rejectionReason = body.rejectionReason ?? null;

    if (!Number.isInteger(vendorId) || vendorId <= 0) {
      return NextResponse.json({ message: 'vendorId must be a positive integer' }, { status: 400 });
    }

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const result = await updateVendorStatus({
      vendorId,
      status,
      adminNotes,
      rejectionReason,
      adminUserId: Number.isInteger(Number(auth.session?.userId)) ? Number(auth.session.userId) : null,
    });

    const vendor = await getVendorById(vendorId);

    const msg =
      status === 'approved'
        ? 'Congratulations! Your application is approved. You can now receive and manage leads.'
        : status === 'rejected'
          ? (rejectionReason || 'Your application was rejected.')
          : 'Your application is under review.';

    // Don’t block response if email fails
    if (vendor) sendStatusUpdateEmail(vendor, status, msg).catch(() => {});

    return NextResponse.json({ ok: true, vendor: result.vendor, application: result.application });
  } catch (e) {
    return NextResponse.json({ message: e?.message || 'Server error' }, { status: 500 });
  }
}
