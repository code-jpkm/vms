'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, CheckCircle, Clock, XCircle } from 'lucide-react';

/** Safe JWT payload decode (no signature verify; just avoids crashes). */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function LeadsSection({ token }) {
  const [leads, setLeads] = useState([]);
  const [leadLoading, setLeadLoading] = useState(true);
  const [leadError, setLeadError] = useState('');

  // Prevent state updates after unmount / during fast navigations
  const abortRef = useRef(null);

  const fetchLeads = useCallback(async () => {
    if (!token) return;

    setLeadError('');
    setLeadLoading(true);

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/vendor/leads/list', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
        cache: 'no-store',
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load leads');

      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        setLeadError(e?.message || 'Failed to load leads');
      }
    } finally {
      // Only end loading if not aborted
      if (!controller.signal.aborted) setLeadLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchLeads();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [token, fetchLeads]);

  const updateStatus = useCallback(
    async (assignmentId, status) => {
      if (!token) return;

      setLeadError('');
      try {
        const res = await fetch('/api/vendor/leads/update-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignmentId, status }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Update failed');

        await fetchLeads();
      } catch (e) {
        setLeadError(e?.message || 'Update failed');
      }
    },
    [token, fetchLeads]
  );

  const pill = useCallback((s) => {
    return s === 'completed'
      ? 'bg-green-50 text-green-700 border-green-200'
      : s === 'in_progress'
      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
      : s === 'accepted'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Your Leads</h3>
          <p className="text-sm text-slate-500">
            Update status and the admin dashboard tracks it instantly.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {leadError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 font-semibold">
          {leadError}
        </div>
      ) : null}

      {leadLoading ? (
        <div className="flex items-center gap-3 text-slate-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900" />
          Loading leads...
        </div>
      ) : leads.length ? (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.assignment_id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-extrabold text-slate-900">{l.customer_name}</div>
                  <div className="text-sm text-slate-500">
                    {l.lead_number} • {l.location || '—'}
                  </div>
                </div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full border text-xs font-black ${pill(
                    l.assignment_status
                  )}`}
                >
                  {l.assignment_status}
                </span>
              </div>

              {l.details ? <div className="mt-3 text-sm text-slate-700">{l.details}</div> : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {l.assignment_status === 'assigned' ? (
                  <button
                    onClick={() => updateStatus(l.assignment_id, 'accepted')}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    Accept
                  </button>
                ) : null}

                {['accepted', 'assigned'].includes(l.assignment_status) ? (
                  <button
                    onClick={() => updateStatus(l.assignment_id, 'in_progress')}
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800"
                  >
                    Start
                  </button>
                ) : null}

                {l.assignment_status !== 'completed' ? (
                  <button
                    onClick={() => updateStatus(l.assignment_id, 'completed')}
                    className="px-3 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700"
                  >
                    Complete
                  </button>
                ) : null}

                {l.assignment_status !== 'cancelled' ? (
                  <button
                    onClick={() => updateStatus(l.assignment_id, 'cancelled')}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">No leads assigned yet.</div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read token once on mount (prevents weirdness / repeated reads)
  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('vendorToken') : null;
    setToken(t);
  }, []);

  useEffect(() => {
    if (token === null) return; // token not loaded yet

    if (!token) {
      router.replace('/');
      return;
    }

    const payload = decodeJwtPayload(token);
    const vendorId = payload?.id;

    if (!vendorId) {
      // bad token -> clear and redirect
      localStorage.removeItem('vendorToken');
      localStorage.removeItem('vendorData');
      router.replace('/');
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setError(null);
        setLoading(true);

        const response = await fetch('/api/vendors/get-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If your endpoint needs auth, uncomment this line:
            // Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vendorId }),
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) throw new Error('Failed to fetch vendor data');

        const data = await response.json();
        setVendor(data.vendor || null);
        setApplication(data.application || null);
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.error('Error fetching data:', err);
          setError('Failed to load vendor data');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [token, router]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorData');
    router.replace('/');
  }, [router]);

  const appStatus = useMemo(() => application?.status || vendor?.status, [application, vendor]);

  const getStatusIcon = () => {
    switch (appStatus) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (appStatus) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {vendor.contact_person_name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition text-slate-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className={`rounded-xl border-2 p-6 mb-8 ${getStatusColor()}`}>
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <h2 className="font-semibold text-lg">Application Status</h2>
              <p className="text-sm">
                {vendor.status === 'pending' && 'Your application is under review'}
                {vendor.status === 'approved' && 'Your application has been approved!'}
                {vendor.status === 'rejected' && 'Your application was rejected'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Company Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-slate-600">Company Name</dt>
                <dd className="text-slate-800 font-medium">{vendor.company_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Owner Name</dt>
                <dd className="text-slate-800 font-medium">{vendor.account_holder_name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">Email</dt>
                <dd className="text-slate-800 font-medium">{vendor.email}</dd>
              </div>
              {vendor.phone && (
                <div>
                  <dt className="text-sm text-slate-600">Phone</dt>
                  <dd className="text-slate-800 font-medium">{vendor.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Tax Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-slate-600">GST Number</dt>
                <dd className="text-slate-800 font-medium">{vendor.gst_number}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">PAN Number</dt>
                <dd className="text-slate-800 font-medium">{vendor.pan_number}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Bank Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-slate-600">Account Number</dt>
                <dd className="text-slate-800 font-medium">
                  ••••••••{vendor.account_number?.slice(-4)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-600">IFSC Code</dt>
                <dd className="text-slate-800 font-medium">{vendor.ifsc_code}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Address</h3>
            <dl className="space-y-3">
              {vendor.address && (
                <div>
                  <dt className="text-sm text-slate-600">Street</dt>
                  <dd className="text-slate-800 font-medium">{vendor.address}</dd>
                </div>
              )}
              {vendor.city && (
                <div>
                  <dt className="text-sm text-slate-600">City</dt>
                  <dd className="text-slate-800 font-medium">{vendor.city}</dd>
                </div>
              )}
              {vendor.state && (
                <div>
                  <dt className="text-sm text-slate-600">State</dt>
                  <dd className="text-slate-800 font-medium">{vendor.state}</dd>
                </div>
              )}
              {vendor.pincode && (
                <div>
                  <dt className="text-sm text-slate-600">Pincode</dt>
                  <dd className="text-slate-800 font-medium">{vendor.pincode}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Documents</h3>
          {documents.length ? (
            <ul className="divide-y divide-slate-200">
              {documents.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 capitalize">
                      {String(d.document_type || '').replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-slate-500">{d.file_name}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {d.upload_date ? new Date(d.upload_date).toLocaleDateString() : '—'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">No documents metadata found.</div>
          )}
        </div>

        {vendor.status === 'approved' ? <LeadsSection token={token} /> : null}
      </div>
    </div>
  );
}
