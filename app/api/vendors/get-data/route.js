import { NextResponse } from 'next/server';
import { getVendorById, getLatestApplicationForVendor, listDocumentsForVendor } from '@/lib/db';

export async function POST(req) {
  try {
    const { vendorId } = await req.json();
    if (!vendorId) return NextResponse.json({ message: 'vendorId required' }, { status: 400 });

    const vendor = await getVendorById(Number(vendorId));
    if (!vendor) return NextResponse.json({ message: 'Vendor not found' }, { status: 404 });

    const application = await getLatestApplicationForVendor(vendor.id);
    const documents = await listDocumentsForVendor(vendor.id);

    return NextResponse.json({ vendor, application, documents });
  } catch (e) {
    return NextResponse.json({ message: e.message || 'Server error' }, { status: 500 });
  }
}
