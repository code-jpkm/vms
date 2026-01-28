'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function StaffResetPassword() {
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
      setTimeout(() => router.push('/staff'), 700);
    } catch (e) {
      setErr(e.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-slate-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
          <div className="px-7 py-7 bg-gradient-to-r from-emerald-700 to-slate-900">
            <div className="text-white text-2xl font-black">Reset Password</div>
            <div className="text-white/80 text-sm">Choose a new password</div>
          </div>

          <div className="p-7">
            {err ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {err}
              </div>
            ) : null}
            {msg ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {msg}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative mt-2">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-900/15"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                disabled={loading || !token}
                className="w-full rounded-2xl bg-slate-900 text-white font-black py-3 hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              {!token ? (
                <div className="text-xs text-red-600 font-semibold">
                  Missing token in URL. Open the reset link from your email.
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
