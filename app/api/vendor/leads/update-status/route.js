import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { updateLeadAssignmentStatus } from '@/lib/db';

export async function POST(req) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { assignmentId, status } = await req.json();
    if (!assignmentId || !status) return NextResponse.json({ message: 'assignmentId and status required' }, { status: 400 });

    const assignment = await updateLeadAssignmentStatus({
      vendorId: Number(payload.id),
      assignmentId: Number(assignmentId),
      status,
    });

    return NextResponse.json({ ok: true, assignment });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
