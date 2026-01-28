'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Target, UserPlus, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminShell({ children, active = 'dashboard' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const d = await res.json();

        if (cancelled) return;

        if (!d?.user || d.user.role !== 'admin') {
          router.replace('/admin?next=/admin/dashboard');
          return;
        }

        setUser(d.user);
      } catch {
        if (!cancelled) router.replace('/admin?next=/admin/dashboard');
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    try {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } catch {}
    router.replace('/admin');
  };

  const NavBtn = ({ id, label, icon: Icon, href }) => {
    const isActive = active === id;
    return (
      <button
        onClick={() => router.push(href)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition ${
          isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  // ✅ prevent flashing + repeated renders while auth check is running
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="font-black text-slate-900">Loading…</div>
          <div className="text-sm text-slate-600 mt-1">Checking admin session</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-black text-slate-900">
            <ShieldCheck className="w-5 h-5" />
            Admin Panel
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">{user?.name || 'Admin'}</span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50 font-bold text-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm p-3 h-fit">
          <NavBtn id="dashboard" label="Dashboard" icon={LayoutDashboard} href="/admin/dashboard?tab=dashboard" />
          <NavBtn id="vendors" label="Vendors" icon={Users} href="/admin/dashboard?tab=vendors" />
          <NavBtn id="leads" label="Leads" icon={Target} href="/admin/dashboard?tab=leads" />
          <NavBtn id="staff" label="Staff" icon={UserPlus} href="/admin/dashboard?tab=staff" />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
