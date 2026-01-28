'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin/dashboard';

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  // ✅ Do NOT auto redirect based on random state.
  // Only redirect if token exists already.
  useEffect(() => {
    try {
      const t = localStorage.getItem('adminToken');
      if (t) {
        router.replace(next);
        return;
      }
    } catch {}
    setChecking(false);
  }, [router, next]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ IMPORTANT: Your backend must return { token, user } for this to work.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      if (!data?.token) {
        // This is EXACT reason you see "Authorization token missing" later
        throw new Error('Login succeeded but token not returned by /api/auth/login');
      }

      // ✅ Save token
      localStorage.setItem('adminToken', data.token);
      if (data?.user) localStorage.setItem('adminUser', JSON.stringify(data.user));

      router.replace(next);
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="font-black text-slate-900">Checking…</div>
          <div className="text-sm text-slate-600 mt-1">Loading admin session</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="text-2xl font-black text-slate-900">Admin Login</div>
        <div className="text-sm text-slate-600 mt-1">Enter your admin credentials.</div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-bold text-slate-700 mb-2">Email</div>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              placeholder="admin@company.com"
            />
          </label>

          <label className="block">
            <div className="text-sm font-bold text-slate-700 mb-2">Password</div>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              placeholder="••••••••"
            />
          </label>

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 text-white px-5 py-3 font-black hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
