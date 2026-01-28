'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';

export default function AdminForgotPassword() {
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
        body: JSON.stringify({ email, forRole: 'admin' }),
      });
      setMsg('If this email exists, a reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="p-7 bg-gradient-to-r from-slate-900 to-indigo-900 text-white">
          <div className="text-2xl font-black">Admin Forgot Password</div>
          <div className="text-white/80 text-sm">We’ll send a secure reset link.</div>
        </div>

        <div className="p-7">
          {msg ? <div className="mb-4 text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-2xl p-3">{msg}</div> : null}

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <div className="text-sm font-bold text-slate-700 mb-2">Email</div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 pl-10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  placeholder="admin@company.com"
                />
              </div>
            </label>

            <button
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 text-white font-black py-3 hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button type="button" onClick={() => router.push('/admin')} className="w-full font-bold text-slate-700 hover:underline text-sm">
              Back to login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
