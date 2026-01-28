'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Loader2, AlertCircle } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Must be staff
      if (data.user?.role !== 'staff') throw new Error('This account is not STAFF');

      // keep for UI usage if you want
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      localStorage.setItem('adminToken', data.token);

      router.push('/staff/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-slate-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
          <div className="px-7 py-7 bg-gradient-to-r from-emerald-900 to-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-white text-2xl font-black">Staff Login</div>
                <div className="text-slate-200 text-sm">Register vendors • Create leads • Allocate vendors</div>
              </div>
            </div>
          </div>

          <div className="p-7">
            {error ? (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="staff@company.com"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={onChange}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="••••••••"
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 text-white font-black py-3 hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Staff route: <b>/staff</b></span>
                <button
                  type="button"
                  onClick={() => router.push('/staff/forgot-password')}
                  className="font-bold text-slate-800 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
