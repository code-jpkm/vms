'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StaffShell from '@/components/StaffShell';
import { RefreshCw, Plus } from 'lucide-react';

function Stat({ title, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="text-sm font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'dashboard';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [vendors, setVendors] = useState([]);
  const [leads, setLeads] = useState([]);

  const [creating, setCreating] = useState(false);
  const [leadForm, setLeadForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    location: '',
    details: '',
    vendorId: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const fetchAll = async () => {
    setError('');
    setLoading(true);
    try {
      const [vRes, lRes] = await Promise.all([
        fetch('/api/admin/vendors/list', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/leads/list', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const v = await vRes.json();
      const l = await lRes.json();

      if (!vRes.ok) throw new Error(v.message || 'Failed to load vendors');
      if (!lRes.ok) throw new Error(l.message || 'Failed to load leads');

      setVendors(v.vendors || []);
      setLeads(l.leads || []);
    } catch (e) {
      setError(e.message || 'Something went wrong');
      router.push('/staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const approved = vendors.filter((x) => x.status === 'approved').length;
    const pending = vendors.filter((x) => x.status === 'pending').length;
    const assigned = leads.filter((x) => x.status === 'assigned').length;
    const inProg = leads.filter((x) => x.status === 'in_progress').length;
    return { approved, pending, assigned, inProg };
  }, [vendors, leads]);

  const createLead = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/admin/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...leadForm,
          vendorId: leadForm.vendorId ? Number(leadForm.vendorId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lead create failed');

      setLeadForm({ customerName: '', customerPhone: '', customerEmail: '', location: '', details: '', vendorId: '' });
      await fetchAll();
      router.push('/staff/dashboard?tab=leads');
    } catch (e) {
      setError(e.message || 'Lead create failed');
    } finally {
      setCreating(false);
    }
  };

  const Active = tab === 'vendors' ? 'vendors' : tab === 'leads' ? 'leads' : 'dashboard';

  return (
    <StaffShell active={Active}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-2xl font-black text-slate-900">Staff Dashboard</div>
            <div className="text-sm text-slate-600">Register vendors (visit) • Create leads • Allocate vendors</div>
          </div>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 font-black text-slate-800 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-600 font-semibold">
              <div className="w-5 h-5 rounded-full border-b-2 border-slate-900 animate-spin" />
              Loading...
            </div>
          </div>
        ) : tab === 'vendors' ? (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="text-lg font-black text-slate-900">Vendors</div>
              <div className="text-sm text-slate-600">
                Staff can view vendors. Approvals are admin-only.
              </div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-[900px] w-full">
                <thead className="bg-slate-50 border-t border-b border-slate-200">
                  <tr className="text-left text-xs font-black text-slate-600">
                    <th className="p-4">Company</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{v.company_name}</div>
                        <div className="text-xs text-slate-500">GST: {v.gst_number}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">{v.email}</td>
                      <td className="p-4 text-sm text-slate-700">{v.phone}</td>
                      <td className="p-4 text-sm font-bold text-slate-700">{v.status}</td>
                    </tr>
                  ))}
                  {!vendors.length ? (
                    <tr>
                      <td className="p-6 text-sm text-slate-500" colSpan={4}>
                        No vendors found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'leads' ? (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="text-lg font-black text-slate-900">Leads</div>
              <div className="text-sm text-slate-600">Track leads and allocations.</div>
            </div>
            <div className="overflow-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-slate-50 border-t border-b border-slate-200">
                  <tr className="text-left text-xs font-black text-slate-600">
                    <th className="p-4">Lead</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{l.lead_number}</div>
                        <div className="text-xs text-slate-500">{new Date(l.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">
                        <div className="font-bold">{l.customer_name}</div>
                        <div className="text-xs text-slate-500">{l.customer_phone || '-'}</div>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700">{l.assignment_status || l.status}</td>
                      <td className="p-4 text-sm text-slate-700">{l.vendor_company_name || '-'}</td>
                    </tr>
                  ))}
                  {!leads.length ? (
                    <tr>
                      <td className="p-6 text-sm text-slate-500" colSpan={4}>
                        No leads yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat title="Approved Vendors" value={stats.approved} hint="Can receive leads" />
              <Stat title="Pending Vendors" value={stats.pending} hint="Waiting for admin approval" />
              <Stat title="Assigned Leads" value={stats.assigned} hint="Allocated to vendors" />
              <Stat title="Leads In Progress" value={stats.inProg} hint="Vendor working now" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-emerald-900 to-slate-900 text-white">
                <div className="text-xl font-black">Create Lead + Allocate Vendor</div>
                <div className="text-white/80 text-sm">
                  Vendor gets email + lead appears on vendor dashboard.
                </div>
              </div>

              <form onSubmit={createLead} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <div className="text-sm font-bold text-slate-700 mb-2">Customer Name</div>
                  <input
                    required
                    value={leadForm.customerName}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-bold text-slate-700 mb-2">Customer Phone</div>
                  <input
                    value={leadForm.customerPhone}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-bold text-slate-700 mb-2">Customer Email</div>
                  <input
                    type="email"
                    value={leadForm.customerEmail}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-bold text-slate-700 mb-2">Location</div>
                  <input
                    value={leadForm.location}
                    onChange={(e) => setLeadForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-sm font-bold text-slate-700 mb-2">Lead Details</div>
                  <textarea
                    value={leadForm.details}
                    onChange={(e) => setLeadForm((p) => ({ ...p, details: e.target.value }))}
                    className="w-full min-h-[110px] rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </label>

                <label className="block md:col-span-2">
                  <div className="text-sm font-bold text-slate-700 mb-2">Allocate Vendor (Approved)</div>
                  <select
                    value={leadForm.vendorId}
                    onChange={(e) => setLeadForm((p) => ({ ...p, vendorId: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  >
                    <option value="">No allocation (create only)</option>
                    {vendors
                      .filter((v) => v.status === 'approved')
                      .map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.company_name} ({v.email})
                        </option>
                      ))}
                  </select>
                </label>

                <div className="md:col-span-2">
                  <button
                    disabled={creating}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    {creating ? 'Creating...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </StaffShell>
  );
}
