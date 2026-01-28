'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, Target, LogOut, UserCog } from 'lucide-react';

export default function StaffShell({ children, active = 'dashboard' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) router.push('/staff');
        else if (d.user.role !== 'staff') router.push('/staff');
        else setUser(d.user);
      })
      .catch(() => router.push('/staff'));
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/staff');
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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-black text-slate-900">Staff Panel</div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">{user?.name || 'Staff'}</span>
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
          <NavBtn id="dashboard" label="Dashboard" icon={UserCog} href="/staff/dashboard" />
          <NavBtn id="vendors" label="Vendors" icon={Users} href="/staff/dashboard?tab=vendors" />
          <NavBtn id="leads" label="Leads" icon={Target} href="/staff/dashboard?tab=leads" />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
