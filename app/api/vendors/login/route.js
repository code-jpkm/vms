import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getVendorByEmail } from '@/lib/db';
import { generateToken } from '@/lib/jwt';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ message: 'Email and password required' }, { status: 400 });

    const vendor = await getVendorByEmail(email);
    if (!vendor) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const ok = await bcrypt.compare(password, vendor.password_hash);
    if (!ok) return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });

    const token = generateToken({
      id: vendor.id,
      email: vendor.email,
      companyName: vendor.company_name,
      gst: vendor.gst_number,
    });

    return NextResponse.json({ token });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
