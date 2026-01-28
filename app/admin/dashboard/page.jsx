'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import {
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  KeyRound,
  Mail,
  History,
  ArrowRightLeft,
  X,
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function Stat({ title, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="text-sm font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

function StatusPill({ s }) {
  const cls =
    s === 'approved'
      ? 'bg-green-50 text-green-800 border-green-200'
      : s === 'rejected'
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-amber-50 text-amber-800 border-amber-200';
  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${cls}`}>
      {s}
    </span>
  );
}

function LeadPill({ s }) {
  const cls =
    s === 'completed'
      ? 'bg-green-50 text-green-800 border-green-200'
      : s === 'in_progress'
        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
        : s === 'assigned'
          ? 'bg-slate-100 text-slate-800 border-slate-200'
          : s === 'cancelled'
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-amber-50 text-amber-800 border-amber-200';
  return (
    <span className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${cls}`}>
      {s}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="text-sm font-bold text-slate-700 mb-2">{label}</div>
      {children}
    </label>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-[min(960px,92vw)]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="text-lg font-black text-slate-900">{title}</div>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-black hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') || 'dashboard';

  // ✅ FIX: token must be loaded first
  const [token, setToken] = useState(null);
  const [booted, setBooted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [vendors, setVendors] = useState([]);
  const [leads, setLeads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [approvedVendors, setApprovedVendors] = useState([]);

  // Vendor filters
  const [vendorStatus, setVendorStatus] = useState(params.get('status') || 'all');
  const [vendorQ, setVendorQ] = useState(params.get('q') || '');
  const [vendorCity, setVendorCity] = useState(params.get('city') || '');
  const [vendorState, setVendorState] = useState(params.get('state') || '');

  // Lead create
  const [creatingLead, setCreatingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    location: '',
    details: '',
    vendorId: '',
  });

  // Staff create
  const [creatingUser, setCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'staff',
  });
  const [createdCreds, setCreatedCreds] = useState(null);

  // Lead timeline modal
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineLead, setTimelineLead] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [reassignVendorId, setReassignVendorId] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  // ✅ FIX: always attach Bearer token (tokenOverride for boot phase)
  const authFetch = async (url, opts = {}, tokenOverride = null) => {
    const useToken = tokenOverride ?? token;

    const headers = new Headers(opts.headers || {});
    if (!headers.get('Content-Type') && opts.body) headers.set('Content-Type', 'application/json');

    if (useToken) headers.set('Authorization', `Bearer ${useToken}`);

    return fetch(url, {
      ...opts,
      headers,
      credentials: 'include',
    });
  };

  const buildVendorQuery = () => {
    const usp = new URLSearchParams();
    if (vendorStatus && vendorStatus !== 'all') usp.set('status', vendorStatus);
    if (vendorQ?.trim()) usp.set('q', vendorQ.trim());
    if (vendorCity?.trim()) usp.set('city', vendorCity.trim());
    if (vendorState?.trim()) usp.set('state', vendorState.trim());
    return usp.toString();
  };

  const hardLogoutToLogin = () => {
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } catch {}
    router.replace('/admin?next=/admin/dashboard');
  };

  const fetchApprovedVendors = async (t = null) => {
    try {
      const res = await authFetch('/api/admin/vendors/list?status=approved', { method: 'GET' }, t);
      const data = await res.json();
      if (res.ok) setApprovedVendors(data.vendors || []);
    } catch {
      // ignore
    }
  };

  const fetchAll = async ({ vendorsOnly = false } = {}, t = null) => {
    setError('');
    setLoading(true);
    try {
      const vendorQs = buildVendorQuery();
      const vUrl = `/api/admin/vendors/list${vendorQs ? `?${vendorQs}` : ''}`;

      const reqs = [
        authFetch(vUrl, { method: 'GET' }, t).then(async (r) => {
          const j = await r.json();
          if (!r.ok) {
            if (r.status === 401 || r.status === 403) throw new Error('__AUTH__');
            throw new Error(j.message || 'Failed to load vendors');
          }
          return j;
        }),
      ];

      if (!vendorsOnly) {
        reqs.push(
          authFetch('/api/admin/leads/list', { method: 'GET' }, t).then(async (r) => {
            const j = await r.json();
            if (!r.ok) {
              if (r.status === 401 || r.status === 403) throw new Error('__AUTH__');
              throw new Error(j.message || 'Failed to load leads');
            }
            return j;
          })
        );

        reqs.push(
          authFetch('/api/admin/users/list', { method: 'GET' }, t).then(async (r) => {
            const j = await r.json();
            if (!r.ok) {
              if (r.status === 401 || r.status === 403) throw new Error('__AUTH__');
              throw new Error(j.message || 'Failed to load users');
            }
            return j;
          })
        );
      }

      const [v, l, u] = await Promise.all(reqs);

      setVendors(v?.vendors || []);
      if (!vendorsOnly) {
        setLeads(l?.leads || []);
        setStaff(u?.users || []);
      }
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: boot loads token BEFORE any admin API calls
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const t = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

        if (!t) {
          hardLogoutToLogin();
          return;
        }

        if (!cancelled) setToken(t);

        // Now safe to fetch
        if (!cancelled) setBooted(true);
        await fetchAll({ vendorsOnly: false }, t);
        await fetchApprovedVendors(t);
      } catch {
        hardLogoutToLogin();
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters change, refetch vendors and keep URL in sync
  useEffect(() => {
    if (!booted) return;

    const usp = new URLSearchParams(Array.from(params.entries()));
    usp.set('tab', tab);

    if (vendorStatus && vendorStatus !== 'all') usp.set('status', vendorStatus);
    else usp.delete('status');

    if (vendorQ?.trim()) usp.set('q', vendorQ.trim());
    else usp.delete('q');

    if (vendorCity?.trim()) usp.set('city', vendorCity.trim());
    else usp.delete('city');

    if (vendorState?.trim()) usp.set('state', vendorState.trim());
    else usp.delete('state');

    router.replace(`/admin/dashboard?${usp.toString()}`);
    fetchAll({ vendorsOnly: true }, token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorStatus, vendorQ, vendorCity, vendorState, booted]);

  const stats = useMemo(() => {
    const pending = vendors.filter((x) => x.status === 'pending').length;
    const approved = vendors.filter((x) => x.status === 'approved').length;
    const rejected = vendors.filter((x) => x.status === 'rejected').length;

    const newLeads = leads.filter((x) => x.status === 'new').length;
    const assigned = leads.filter((x) => x.status === 'assigned').length;
    const inProg = leads.filter((x) => x.status === 'in_progress').length;
    const completed = leads.filter((x) => x.status === 'completed').length;

    const staffCount = staff.filter((u) => u.role === 'staff').length;
    const adminCount = staff.filter((u) => u.role === 'admin').length;

    return { pending, approved, rejected, newLeads, assigned, inProg, completed, staffCount, adminCount };
  }, [vendors, leads, staff]);

  const vendorChartData = useMemo(
    () => [
      { name: 'Approved', value: stats.approved },
      { name: 'Pending', value: stats.pending },
      { name: 'Rejected', value: stats.rejected },
    ],
    [stats]
  );

  const leadsChartData = useMemo(
    () => [
      { stage: 'New', count: stats.newLeads },
      { stage: 'Assigned', count: stats.assigned },
      { stage: 'In Progress', count: stats.inProg },
      { stage: 'Completed', count: stats.completed },
    ],
    [stats]
  );

  const updateVendor = async (vendorId, status) => {
    setError('');
    try {
      const res = await authFetch('/api/admin/vendors/update-status', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          status,
          adminNotes: status === 'approved' ? 'Approved by admin.' : null,
          rejectionReason: status === 'rejected' ? 'Rejected by admin.' : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('__AUTH__');
        throw new Error(data.message || 'Update failed');
      }
      await fetchAll({ vendorsOnly: false });
      await fetchApprovedVendors();
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'Update failed');
    }
  };

  const createLead = async (e) => {
    e.preventDefault();
    setError('');
    setCreatingLead(true);
    try {
      const res = await authFetch('/api/admin/leads/create', {
        method: 'POST',
        body: JSON.stringify({
          ...leadForm,
          vendorId: leadForm.vendorId ? Number(leadForm.vendorId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('__AUTH__');
        throw new Error(data.message || 'Lead create failed');
      }

      setLeadForm({ customerName: '', customerPhone: '', customerEmail: '', location: '', details: '', vendorId: '' });
      await fetchAll({ vendorsOnly: false });
      router.push('/admin/dashboard?tab=leads');
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'Lead create failed');
    } finally {
      setCreatingLead(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    setCreatedCreds(null);
    setCreatingUser(true);
    try {
      const res = await authFetch('/api/admin/users/create', {
        method: 'POST',
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('__AUTH__');
        throw new Error(data.message || 'User create failed');
      }

      setCreatedCreds({ email: data.user?.email || userForm.email, tempPassword: data.tempPassword });
      setUserForm({ name: '', email: '', role: 'staff' });
      await fetchAll({ vendorsOnly: false });
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'User create failed');
    } finally {
      setCreatingUser(false);
    }
  };

  const openTimeline = async (lead) => {
    setTimelineLead(lead);
    setTimelineEvents([]);
    setReassignVendorId('');
    setTimelineOpen(true);
    setTimelineLoading(true);
    try {
      const res = await authFetch(`/api/admin/leads/events?leadId=${lead.id}`, { method: 'GET' });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('__AUTH__');
        throw new Error(data.message || 'Failed to load timeline');
      }
      setTimelineEvents(data.events || []);
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'Failed to load timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  const reassignLead = async () => {
    if (!timelineLead?.id || !reassignVendorId) return;
    setError('');
    setReassignLoading(true);
    try {
      const res = await authFetch('/api/admin/leads/reassign', {
        method: 'POST',
        body: JSON.stringify({ leadId: timelineLead.id, vendorId: Number(reassignVendorId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('__AUTH__');
        throw new Error(data.message || 'Reassign failed');
      }

      await fetchAll({ vendorsOnly: false });
      await openTimeline({ ...timelineLead, vendor_id: Number(reassignVendorId) });
    } catch (e) {
      if (e?.message === '__AUTH__') {
        hardLogoutToLogin();
        return;
      }
      setError(e?.message || 'Reassign failed');
    } finally {
      setReassignLoading(false);
    }
  };

  const Active = tab === 'vendors' ? 'vendors' : tab === 'leads' ? 'leads' : tab === 'staff' ? 'staff' : 'dashboard';

  return (
    <AdminShell active={Active}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-2xl font-black text-slate-900">Admin Dashboard</div>
            <div className="text-sm text-slate-600">Filters • Staff creation • Lead allocation • Tracking</div>
          </div>
          <button
            onClick={() => fetchAll({ vendorsOnly: false })}
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

        {/* ✅ Timeline Modal */}
        <Modal
          open={timelineOpen}
          title={`Lead Timeline • ${timelineLead?.lead_number || ''}`}
          onClose={() => setTimelineOpen(false)}
        >
          {timelineLoading ? (
            <div className="flex items-center gap-3 text-slate-600 font-semibold">
              <div className="w-5 h-5 rounded-full border-b-2 border-slate-900 animate-spin" />
              Loading timeline...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lead summary */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-900">{timelineLead?.customer_name}</div>
                <div className="text-sm text-slate-600 mt-1">
                  {timelineLead?.location || '-'} • {timelineLead?.customer_phone || '-'} • {timelineLead?.customer_email || '-'}
                </div>
                <div className="mt-3">
                  <LeadPill s={timelineLead?.assignment_status || timelineLead?.status} />
                </div>
              </div>

              {/* ✅ Reassign */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer / Reassign Lead
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  Reassign creates a new assignment entry and logs event history. Vendor gets email.
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                  <Field label="Select Approved Vendor">
                    <select
                      value={reassignVendorId}
                      onChange={(e) => setReassignVendorId(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    >
                      <option value="">Choose vendor</option>
                      {approvedVendors.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.company_name} ({v.email})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <button
                    onClick={reassignLead}
                    disabled={reassignLoading || !reassignVendorId}
                    className="rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60"
                  >
                    {reassignLoading ? 'Transferring...' : 'Transfer'}
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <History className="w-4 h-4" />
                  Timeline
                </div>

                <div className="mt-4 space-y-3">
                  {timelineEvents.map((ev) => (
                    <div key={ev.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-black text-slate-500 uppercase">
                            {ev.actor_type} • {ev.event_type}
                          </div>
                          <div className="font-extrabold text-slate-900 mt-1">{ev.message || '-'}</div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {ev.created_at ? new Date(ev.created_at).toLocaleString() : '-'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!timelineEvents.length ? (
                    <div className="text-sm text-slate-500">No events found.</div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 text-slate-600 font-semibold">
              <div className="w-5 h-5 rounded-full border-b-2 border-slate-900 animate-spin" />
              Loading...
            </div>
          </div>
        ) : tab === 'vendors' ? (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col gap-4">
              <div>
                <div className="text-lg font-black text-slate-900">Vendors</div>
                <div className="text-sm text-slate-600">Search + filter + approve/reject (emails auto).</div>
              </div>

              {/* ✅ Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <Field label="Status Filter">
                  <select
                    value={vendorStatus}
                    onChange={(e) => setVendorStatus(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </Field>

                <Field label="Search">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={vendorQ}
                      onChange={(e) => setVendorQ(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      placeholder="company / email / phone / GST"
                    />
                  </div>
                </Field>

                <Field label="City">
                  <input
                    value={vendorCity}
                    onChange={(e) => setVendorCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="e.g. Mumbai"
                  />
                </Field>

                <Field label="State">
                  <input
                    value={vendorState}
                    onChange={(e) => setVendorState(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    placeholder="e.g. Maharashtra"
                  />
                </Field>

                <div className="md:col-span-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setVendorStatus('all');
                      setVendorQ('');
                      setVendorCity('');
                      setVendorState('');
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-black text-slate-800 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1100px] w-full">
                <thead className="bg-slate-50 border-t border-b border-slate-200">
                  <tr className="text-left text-xs font-black text-slate-600">
                    <th className="p-4">Company</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">City/State</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((v) => (
                    <tr key={v.id} className="border-b border-slate-100">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{v.company_name}</div>
                        <div className="text-xs text-slate-500">
                          GST: {v.gst_number} • PAN: {v.pan_number}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700">{v.contact_person_name}</td>
                      <td className="p-4 text-sm text-slate-700">{v.email}</td>
                      <td className="p-4 text-sm text-slate-700">{v.phone}</td>
                      <td className="p-4 text-sm text-slate-700">
                        {(v.city || '-') + ' / ' + (v.state || '-')}
                      </td>
                      <td className="p-4">
                        <StatusPill s={v.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => updateVendor(v.id, 'approved')}
                            disabled={v.status === 'approved'}
                            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-3 py-2 text-xs font-black disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => updateVendor(v.id, 'rejected')}
                            disabled={v.status === 'rejected'}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-3 py-2 text-xs font-black disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!vendors.length ? (
                    <tr>
                      <td className="p-6 text-sm text-slate-500" colSpan={7}>
                        No vendors found (try changing filters).
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
              <div className="text-sm text-slate-600">Track lead status + vendor allocation + timeline.</div>
            </div>

            <div className="overflow-auto">
              <table className="min-w-[1250px] w-full">
                <thead className="bg-slate-50 border-t border-b border-slate-200">
                  <tr className="text-left text-xs font-black text-slate-600">
                    <th className="p-4">Lead</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Vendor</th>
                    <th className="p-4">Assigned At</th>
                    <th className="p-4">History</th>
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
                      <td className="p-4 text-sm text-slate-700">{l.location || '-'}</td>
                      <td className="p-4">
                        <LeadPill s={l.assignment_status || l.status} />
                      </td>
                      <td className="p-4 text-sm text-slate-700">{l.vendor_company_name || '-'}</td>
                      <td className="p-4 text-sm text-slate-700">
                        {l.assigned_at ? new Date(l.assigned_at).toLocaleString() : '-'}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openTimeline(l)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-50"
                        >
                          <History className="w-4 h-4" />
                          Timeline
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!leads.length ? (
                    <tr>
                      <td className="p-6 text-sm text-slate-500" colSpan={7}>
                        No leads yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'staff' ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="text-lg font-black text-slate-900">Create Staff/Admin</div>
                <div className="text-sm text-slate-600">Creates account + emails temp password.</div>
              </div>

              <div className="border-t border-slate-200 p-6">
                {createdCreds ? (
                  <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <div className="font-black text-green-900">User created ✅</div>
                    <div className="text-sm text-green-800 mt-1">
                      Email: <b>{createdCreds.email}</b>
                      <br />
                      Temp Password: <b>{createdCreds.tempPassword}</b>
                    </div>
                  </div>
                ) : null}

                <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Name">
                    <input
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                      placeholder="Full name"
                    />
                  </Field>

                  <Field label="Email">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        required
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                        placeholder="staff@company.com"
                      />
                    </div>
                  </Field>

                  <Field label="Role">
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    >
                      <option value="staff">staff</option>
                      <option value="admin">admin</option>
                    </select>
                  </Field>

                  <div className="md:col-span-3">
                    <button
                      disabled={creatingUser}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4" />
                      {creatingUser ? 'Creating...' : 'Create User + Email Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat title="Vendors Pending" value={stats.pending} hint="Waiting for approval" />
              <Stat title="Vendors Approved" value={stats.approved} hint="Eligible for allocation" />
              <Stat title="Leads In Progress" value={stats.inProg} hint="Vendor working now" />
              <Stat title="Leads Completed" value={stats.completed} hint="Done deals" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="text-lg font-black text-slate-900">Vendor Status</div>
                <div className="text-sm text-slate-600 mb-4">Distribution of vendor approvals.</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie data={vendorChartData} dataKey="value" nameKey="name" outerRadius={95} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="text-lg font-black text-slate-900">Lead Pipeline</div>
                <div className="text-sm text-slate-600 mb-4">New → Assigned → In Progress → Completed</div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-900 text-white">
                <div className="text-xl font-black">Create Lead + Allocate Vendor</div>
                <div className="text-white/80 text-sm">Assigning sends vendor email + shows in vendor dashboard.</div>
              </div>

              <form onSubmit={createLead} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Customer Name">
                  <input
                    required
                    value={leadForm.customerName}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </Field>

                <Field label="Customer Phone">
                  <input
                    value={leadForm.customerPhone}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerPhone: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </Field>

                <Field label="Customer Email">
                  <input
                    type="email"
                    value={leadForm.customerEmail}
                    onChange={(e) => setLeadForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </Field>

                <Field label="Location">
                  <input
                    value={leadForm.location}
                    onChange={(e) => setLeadForm((p) => ({ ...p, location: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Lead Details">
                    <textarea
                      value={leadForm.details}
                      onChange={(e) => setLeadForm((p) => ({ ...p, details: e.target.value }))}
                      className="w-full min-h-[110px] rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Allocate Vendor (Approved only)">
                    <select
                      value={leadForm.vendorId}
                      onChange={(e) => setLeadForm((p) => ({ ...p, vendorId: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                    >
                      <option value="">No allocation (create only)</option>
                      {approvedVendors.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.company_name} ({v.email})
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-2">
                  <button
                    disabled={creatingLead}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    {creatingLead ? 'Creating...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
