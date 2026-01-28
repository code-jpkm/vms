'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffShell from '@/components/StaffShell';
import { Building2, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';

const inputBase =
  'w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15 bg-white';

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm font-black text-slate-700 mb-2">{label}</div>
      {children}
    </label>
  );
}

export default function StaffNewVendorPage() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    company_name: '',
    gst_number: '',
    pan_number: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    contact_person_name: '',
  });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const canSubmit = useMemo(() => {
    return (
      form.email &&
      form.password &&
      form.company_name &&
      form.gst_number &&
      form.pan_number &&
      form.account_holder_name &&
      form.account_number &&
      form.ifsc_code &&
      form.bank_name &&
      form.address &&
      form.city &&
      form.state &&
      form.zip_code &&
      form.phone &&
      form.contact_person_name
    );
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setOk('');
    setLoading(true);
    try {
      const res = await fetch('/api/staff/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      setOk(`Vendor created successfully (ID: ${data.vendorId}). Admin got notification email.`);
      setForm({
        email: '',
        password: '',
        company_name: '',
        gst_number: '',
        pan_number: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        bank_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        contact_person_name: '',
      });

      // move to staff dashboard vendors tab
      setTimeout(() => router.push('/staff/dashboard?tab=vendors'), 900);
    } catch (e) {
      setErr(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaffShell active="vendors">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-black">Onboard Vendor (Staff)</div>
                <div className="text-white/80 text-sm">
                  Register vendor during visit. Admin is notified automatically.
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {ok ? (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-700 mt-0.5" />
                <div className="text-sm font-bold text-green-800">{ok}</div>
              </div>
            ) : null}

            {err ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-red-700 mt-0.5" />
                <div className="text-sm font-bold text-red-800">{err}</div>
              </div>
            ) : null}

            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Vendor Email">
                <input name="email" value={form.email} onChange={onChange} className={inputBase} type="email" required />
              </Field>

              <Field label="Temporary Password (Vendor)">
                <input name="password" value={form.password} onChange={onChange} className={inputBase} type="text" required />
              </Field>

              <Field label="Company Name">
                <input name="company_name" value={form.company_name} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Contact Person Name">
                <input name="contact_person_name" value={form.contact_person_name} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Phone">
                <input name="phone" value={form.phone} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="GST Number">
                <input name="gst_number" value={form.gst_number} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="PAN Number">
                <input name="pan_number" value={form.pan_number} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Bank Name">
                <input name="bank_name" value={form.bank_name} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Account Holder Name">
                <input name="account_holder_name" value={form.account_holder_name} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Account Number">
                <input name="account_number" value={form.account_number} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="IFSC Code">
                <input name="ifsc_code" value={form.ifsc_code} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Address" >
                <input name="address" value={form.address} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="City">
                <input name="city" value={form.city} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="State">
                <input name="state" value={form.state} onChange={onChange} className={inputBase} required />
              </Field>

              <Field label="Zip Code">
                <input name="zip_code" value={form.zip_code} onChange={onChange} className={inputBase} required />
              </Field>

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                <button
                  disabled={!canSubmit || loading}
                  className="rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Submitting...' : 'Create Vendor'}
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/staff/dashboard?tab=vendors')}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-800 hover:bg-slate-50"
                >
                  Back to Vendors
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Note: Vendor will be created as <b>pending</b>. Admin approves/rejects and vendor gets status mail.
        </div>
      </div>
    </StaffShell>
  );
}
