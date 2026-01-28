'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';

export default function StaffForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, forRole: 'staff' }),
      });
      setMsg('If this email exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100 via-slate-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
          <div className="px-7 py-7 bg-gradient-to-r from-emerald-700 to-slate-900">
            <div className="text-white text-2xl font-black">Staff Forgot Password</div>
            <div className="text-white/80 text-sm">We will email a reset link</div>
          </div>

          <div className="p-7">
            {msg ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {msg}
              </div>
            ) : null}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Email</label>
                <div className="relative mt-2">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-900/15"
                    placeholder="staff@company.com"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 text-white font-black py-3 hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/staff')}
                className="w-full rounded-2xl border border-slate-200 bg-white font-black py-3 hover:bg-slate-50"
              >
                Back to Staff Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
