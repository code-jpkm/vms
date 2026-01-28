'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  Loader2,
  Users,
  Activity,
  BadgeCheck,
} from 'lucide-react';

function cn(...c) {
  return c.filter(Boolean).join(' ');
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(980px,94vw)]">
        <div className="rounded-[28px] border border-white/15 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="text-lg font-black text-slate-900">{title}</div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 font-black hover:bg-slate-50 inline-flex items-center gap-2"
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

const Input = ({ label, icon: Icon, hint, ...props }) => (
  <label className="block">
    <div className="flex items-end justify-between gap-3">
      <div className="text-sm font-extrabold text-slate-800">{label}</div>
      {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
    </div>
    <div className="relative mt-2">
      {Icon ? (
        <Icon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      ) : null}
      <input
        {...props}
        className={cn(
          'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400',
          'shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300',
          Icon ? 'pl-10' : ''
        )}
      />
    </div>
  </label>
);

const Select = ({ label, children, ...props }) => (
  <label className="block">
    <div className="text-sm font-extrabold text-slate-800">{label}</div>
    <select
      {...props}
      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300"
    >
      {children}
    </select>
  </label>
);

function StepPill({ active, done, title, subtitle, idx }) {
  return (
    <div className={cn('flex items-center gap-3', active ? '' : 'opacity-80')}>
      <div
        className={cn(
          'w-9 h-9 rounded-2xl grid place-items-center border text-sm font-black',
          done
            ? 'bg-green-600 text-white border-green-600'
            : active
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200'
        )}
      >
        {done ? <CheckCircle2 className="w-5 h-5" /> : idx}
      </div>
      <div>
        <div className="text-sm font-black text-slate-900">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export default function VendorForm() {
  const router = useRouter();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('register'); // register | login
  const [step, setStep] = useState(1); // 1 | 2
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [login, setLogin] = useState({ email: '', password: '' });

  const [form, setForm] = useState({
    email: '',
    password: '',
    company_name: '',
    gst_number: '',
    pan_number: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    zip_code: '',
    phone: '',
    contact_person_name: '',
    registered_by: 'self', // self | staff
  });

  const canGoNext = useMemo(() => {
    // Step 1 minimal checks (feel light)
    if (step !== 1) return true;
    return (
      form.company_name.trim() &&
      form.contact_person_name.trim() &&
      form.phone.trim() &&
      form.email.trim() &&
      form.password.trim()
    );
  }, [form, step]);

  const canSubmit = useMemo(() => {
    // Step 2 required checks (full schema)
    if (step !== 2) return false;
    const required = [
      form.gst_number,
      form.pan_number,
      form.account_holder_name,
      form.account_number,
      form.ifsc_code,
      form.bank_name,
      form.address,
      form.city,
      form.state,
      form.zip_code,
    ];
    return required.every((x) => String(x || '').trim().length > 0);
  }, [form, step]);

  const openRegister = () => {
    setMsg({ type: '', text: '' });
    setAuthTab('register');
    setStep(1);
    setAuthOpen(true);
  };

  const openLogin = () => {
    setMsg({ type: '', text: '' });
    setAuthTab('login');
    setAuthOpen(true);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      if (data.token) localStorage.setItem('vendorToken', data.token);

      setMsg({
        type: 'ok',
        text: 'Registration submitted ✅ Admin will review. You will get email updates.',
      });

      // feel premium: short delay then go
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('vendorToken', data.token);
      router.push('/dashboard');
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200 via-slate-50 to-white">
      {/* Top Nav */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-900 font-black leading-tight text-lg">
                Vendor Management
              </div>
              <div className="text-xs text-slate-600">
                Onboarding • Approvals • Leads • Live Tracking
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin"
              className="hidden sm:inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 font-black text-slate-800 hover:bg-slate-50"
            >
              Admin
            </a>
            <a
              href="/staff"
              className="hidden sm:inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 font-black text-slate-800 hover:bg-slate-50"
            >
              Staff
            </a>
            <button
              onClick={openLogin}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-black text-slate-800 hover:bg-slate-50"
            >
              Vendor Login
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Hero copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/70 backdrop-blur px-4 py-2 shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-700" />
              <div className="text-xs font-black text-slate-800">
                Premium onboarding experience • Mobile-first
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.05]">
              Onboard vendors fast.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-violet-700 to-slate-900">
                Assign leads & track status live.
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg max-w-xl">
              A professional vendor platform with automated emails, approvals, lead assignment,
              vendor status updates, and real-time admin tracking.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={openRegister}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black shadow-lg hover:bg-slate-800 inline-flex items-center gap-2"
              >
                Register Vendor
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={openLogin}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-black text-slate-800 hover:bg-slate-50"
              >
                Vendor Login
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  <div className="text-sm font-black text-slate-900">Secure</div>
                </div>
                <div className="text-xs text-slate-600 mt-1">JWT sessions & protected routes</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-900" />
                  <div className="text-sm font-black text-slate-900">Live Tracking</div>
                </div>
                <div className="text-xs text-slate-600 mt-1">Lead pipeline updates instantly</div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-slate-900" />
                  <div className="text-sm font-black text-slate-900">Automation</div>
                </div>
                <div className="text-xs text-slate-600 mt-1">Emails on every key action</div>
              </div>
            </div>
          </div>

          {/* Right: Product cards (clean, not text-heavy) */}
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-xl overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 grid place-items-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-black">How it works</div>
                    <div className="text-sm text-white/80">Simple. Automated. Trackable.</div>
                  </div>
                </div>
              </div>

              <div className="p-6 grid gap-3">
                {[
                  {
                    title: 'Vendor registers (or staff registers during visit)',
                    sub: 'Admin gets notified automatically',
                  },
                  {
                    title: 'Approve / Reject from admin dashboard',
                    sub: 'Vendor receives instant email update',
                  },
                  {
                    title: 'Create lead + allocate vendor',
                    sub: 'Vendor gets lead email + shows in dashboard',
                  },
                  {
                    title: 'Vendor updates status',
                    sub: 'Admin sees live tracking + timeline',
                  },
                ].map((x, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-sm font-black text-slate-900">
                      {i + 1}. {x.title}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{x.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white shadow-xl p-6">
              <div className="text-sm font-black text-slate-900">Pro Tip</div>
              <div className="text-sm text-slate-600 mt-2">
                This system uses Neon Postgres + SMTP. All email triggers and tracking events are already implemented.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="/admin"
                  className="rounded-2xl bg-slate-900 text-white px-4 py-2 text-sm font-black hover:bg-slate-800"
                >
                  Open Admin
                </a>
                <a
                  href="/staff"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50"
                >
                  Open Staff
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <Modal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        title={authTab === 'register' ? 'Register Vendor' : 'Vendor Login'}
      >
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setMsg({ type: '', text: '' });
              setAuthTab('register');
              setStep(1);
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-black border transition',
              authTab === 'register'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMsg({ type: '', text: '' });
              setAuthTab('login');
            }}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-black border transition',
              authTab === 'login'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
            )}
          >
            Login
          </button>
        </div>

        {/* Message */}
        {msg?.text ? (
          <div
            className={cn(
              'mb-5 rounded-2xl border px-4 py-3 text-sm font-bold',
              msg.type === 'ok'
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-red-200 bg-red-50 text-red-900'
            )}
          >
            {msg.text}
          </div>
        ) : null}

        {authTab === 'login' ? (
          <form onSubmit={submitLogin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={login.email}
              onChange={(e) => setLogin((p) => ({ ...p, email: e.target.value }))}
              placeholder="vendor@company.com"
              required
            />
            <Input
              label="Password"
              icon={Lock}
              type="password"
              value={login.password}
              onChange={(e) => setLogin((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              required
            />

            <div className="md:col-span-2 flex flex-wrap gap-2 items-center justify-between pt-2">
              <button
                disabled={loading}
                className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Login'}
              </button>

              <div className="text-xs text-slate-500 font-semibold">
                After login you’ll see your leads and status updates.
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Step header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <StepPill
                idx={1}
                active={step === 1}
                done={step > 1}
                title="Basic details"
                subtitle="Fast start (feels short)"
              />
              <StepPill
                idx={2}
                active={step === 2}
                done={false}
                title="Business & bank"
                subtitle="Required for approval"
              />
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-slate-900 via-indigo-700 to-violet-700"
                style={{ width: step === 1 ? '45%' : '100%' }}
              />
            </div>

            <form onSubmit={submitRegister} className="space-y-6">
              {/* Step 1 */}
              {step === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Company Name"
                    icon={Building2}
                    value={form.company_name}
                    onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                    placeholder="ABC Traders Pvt Ltd"
                    required
                  />

                  <Select
                    label="Registered By"
                    value={form.registered_by}
                    onChange={(e) => setForm((p) => ({ ...p, registered_by: e.target.value }))}
                  >
                    <option value="self">Self (Vendor)</option>
                    <option value="staff">Staff (On-site visit)</option>
                  </Select>

                  <Input
                    label="Contact Person"
                    icon={Users}
                    value={form.contact_person_name}
                    onChange={(e) => setForm((p) => ({ ...p, contact_person_name: e.target.value }))}
                    placeholder="Rahul Sharma"
                    required
                  />

                  <Input
                    label="Phone"
                    icon={Phone}
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="9876543210"
                    required
                  />

                  <Input
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="vendor@company.com"
                    required
                  />

                  <Input
                    label="Create Password"
                    icon={Lock}
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Create a strong password"
                    required
                  />

                  <div className="md:col-span-2 flex flex-wrap gap-2 items-center justify-between pt-2">
                    <div className="text-xs text-slate-500 font-semibold">
                      Next step will ask for GST/PAN, bank and address details (required for approval).
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!canGoNext}
                      className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2 */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="GST Number"
                    value={form.gst_number}
                    onChange={(e) => setForm((p) => ({ ...p, gst_number: e.target.value }))}
                    placeholder="27ABCDE1234F1Z5"
                    required
                  />
                  <Input
                    label="PAN Number"
                    value={form.pan_number}
                    onChange={(e) => setForm((p) => ({ ...p, pan_number: e.target.value }))}
                    placeholder="ABCDE1234F"
                    required
                  />

                  <Input
                    label="Account Holder Name"
                    value={form.account_holder_name}
                    onChange={(e) => setForm((p) => ({ ...p, account_holder_name: e.target.value }))}
                    placeholder="Rahul Sharma"
                    required
                  />
                  <Input
                    label="Account Number"
                    value={form.account_number}
                    onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                    placeholder="012345678901"
                    required
                  />

                  <Input
                    label="IFSC Code"
                    value={form.ifsc_code}
                    onChange={(e) => setForm((p) => ({ ...p, ifsc_code: e.target.value }))}
                    placeholder="HDFC0001234"
                    required
                  />
                  <Input
                    label="Bank Name"
                    value={form.bank_name}
                    onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
                    placeholder="HDFC Bank"
                    required
                  />

                  <Input
                    label="Address"
                    icon={MapPin}
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Street / Area"
                    required
                  />
                  <Input
                    label="City"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Mumbai"
                    required
                  />

                  <Input
                    label="State"
                    value={form.state}
                    onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="Maharashtra"
                    required
                  />
                  <Input
                    label="ZIP Code"
                    value={form.zip_code}
                    onChange={(e) => setForm((p) => ({ ...p, zip_code: e.target.value }))}
                    placeholder="400001"
                    required
                  />

                  <div className="md:col-span-2 flex flex-wrap gap-2 items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-black text-slate-800 hover:bg-slate-50"
                    >
                      Back
                    </button>

                    <button
                      disabled={loading || !canSubmit}
                      className="rounded-2xl bg-slate-900 text-white px-6 py-3 font-black hover:bg-slate-800 disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {loading ? 'Submitting...' : 'Submit Registration'}
                    </button>
                  </div>

                  <div className="md:col-span-2 text-xs text-slate-500 font-semibold">
                    After submit: Admin gets email → approves/rejects → vendor gets email → leads can be assigned.
                  </div>
                </div>
              )}
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}
