'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminResetPassword() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';

  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');

      setMsg('Password updated. You can login now.');
      setTimeout(() => router.push('/admin'), 700);
    } catch (e) {
      setErr(e.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 font-bold">
          Missing token. Please use the link from your email.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="p-7 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
          <div className="text-2xl font-black">Reset Password</div>
          <div className="text-white/80 text-sm">Set a new admin password.</div>
        </div>

        <div className="p-7">
          {msg ? <div className="mb-4 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-2xl p-3">{msg}</div> : null}
          {err ? <div className="mb-4 text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl p-3">{err}</div> : null}

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <div className="text-sm font-bold text-slate-700 mb-2">New Password</div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 text-white font-black py-3 hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
