'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  Briefcase,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Flame,
  LayoutDashboard,
  LifeBuoy,
  LineChart as LineChartIcon,
  LogOut,
  MessagesSquare,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Star,
  Timer,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const kpi = [
  { label: 'New Leads', value: '18', delta: '+12%', icon: Users },
  { label: 'Active Jobs', value: '7', delta: '+5%', icon: Briefcase },
  { label: 'Revenue', value: '₹86,400', delta: '+18%', icon: DollarSign },
  { label: 'Avg Response', value: '9 min', delta: '-22%', icon: Timer },
];

const revenueData = [
  { name: 'Mon', value: 8200 },
  { name: 'Tue', value: 12600 },
  { name: 'Wed', value: 9800 },
  { name: 'Thu', value: 14100 },
  { name: 'Fri', value: 16900 },
  { name: 'Sat', value: 13200 },
  { name: 'Sun', value: 15600 },
];

const pipelineData = [
  { name: 'New', value: 22 },
  { name: 'Contacted', value: 14 },
  { name: 'Quoted', value: 9 },
  { name: 'Won', value: 6 },
];

const pieColors = ['#111827', '#374151', '#6b7280', '#9ca3af'];

const leads = [
  { id: 'LD-1092', customer: 'Aarav Sharma', service: 'AC Repair', city: 'Bengaluru', budget: '₹2,500', status: 'New' },
  { id: 'LD-1093', customer: 'Meera Iyer', service: 'Kitchen Remodel', city: 'Chennai', budget: '₹1,20,000', status: 'Contacted' },
  { id: 'LD-1094', customer: 'Rohit Verma', service: 'Carpentry', city: 'Delhi', budget: '₹8,000', status: 'Quoted' },
  { id: 'LD-1095', customer: 'Nisha Gupta', service: 'Pest Control', city: 'Mumbai', budget: '₹3,200', status: 'Won' },
];

const container = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, duration: 0.35 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function StatusBadge({ status }) {
  const map = {
    New: 'bg-zinc-900 text-white',
    Contacted: 'bg-zinc-200 text-zinc-900',
    Quoted: 'bg-zinc-100 text-zinc-900 border border-zinc-200',
    Won: 'bg-emerald-600 text-white',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || 'bg-zinc-100 text-zinc-900'}`}>
      {status}
    </span>
  );
}

export default function VendorDashboardPage() {
  const vendorName = 'Vendor Pro';
  const tier = 'Elite Partner';
  const profileCompletion = 82;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900">Vendor Dashboard</div>
              <div className="text-xs text-zinc-500">Operate like a premium brand.</div>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input className="w-80 rounded-2xl pl-9" placeholder="Search leads, customers, jobs..." />
            </div>
            <Button variant="outline" className="rounded-2xl">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-2xl">
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-2xl border bg-white px-2 py-1.5 shadow-sm hover:bg-zinc-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-zinc-900 text-white">VP</AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <div className="text-sm font-semibold text-zinc-900 leading-4">{vendorName}</div>
                    <div className="text-xs text-zinc-500">{tier}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuItem className="gap-2">
                  <Settings className="h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <LifeBuoy className="h-4 w-4" /> Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600">
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 md:grid-cols-12 md:px-6">
        {/* Sidebar */}
        <aside className="md:col-span-3">
          <Card className="rounded-3xl border-zinc-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Move faster. Look premium.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                <Rocket className="mr-2 h-4 w-4" /> Boost Profile
              </Button>
              <Button variant="outline" className="w-full rounded-2xl">
                <MessagesSquare className="mr-2 h-4 w-4" /> Messages
              </Button>
              <Button variant="outline" className="w-full rounded-2xl">
                <CreditCard className="mr-2 h-4 w-4" /> Billing
              </Button>

              <Separator className="my-2" />

              <div className="space-y-2 rounded-2xl bg-zinc-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-zinc-900">Profile Strength</div>
                  <Badge className="rounded-full bg-zinc-900">{profileCompletion}%</Badge>
                </div>
                <Progress value={profileCompletion} />
                <p className="text-xs text-zinc-500">
                  Complete your profile to unlock higher quality leads.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-zinc-900" />
                  <div className="text-sm font-semibold text-zinc-900">Premium Tip</div>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Reply in under <span className="font-semibold text-zinc-900">10 minutes</span> to win 2× more jobs.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-5 grid gap-3">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, active: true },
              { label: 'Analytics', icon: LineChartIcon },
              { label: 'Leads', icon: Users },
              { label: 'Jobs', icon: Briefcase },
              { label: 'Reviews', icon: Star },
            ].map((x) => (
              <button
                key={x.label}
                className={[
                  'flex items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition hover:bg-zinc-50',
                  x.active ? 'border-zinc-900' : 'border-zinc-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <x.icon className="h-4 w-4 text-zinc-900" />
                  <span className="text-sm font-semibold text-zinc-900">{x.label}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="md:col-span-9">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
            {/* Header hero */}
            <motion.div variants={item}>
              <Card className="rounded-3xl border-zinc-200">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                        <BadgeCheck className="h-4 w-4" />
                        {tier}
                      </div>
                      <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                        Welcome back, {vendorName} 👋
                      </h1>
                      <p className="mt-1 text-sm text-zinc-500">
                        You’re trending up. Keep response time low and close more deals.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-2xl">
                        View Leads
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button className="rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                        Upgrade Visibility
                        <Sparkles className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* KPIs */}
            <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {kpi.map((k) => (
                <Card key={k.label} className="rounded-3xl border-zinc-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-medium text-zinc-500">{k.label}</div>
                        <div className="mt-2 text-2xl font-bold text-zinc-900">{k.value}</div>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-zinc-900">
                          <span className="rounded-full bg-zinc-100 px-2 py-1">{k.delta}</span>
                          <span className="text-zinc-500">this week</span>
                        </div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                        <k.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Charts + pipeline */}
            <motion.div variants={item} className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <Card className="rounded-3xl border-zinc-200 md:col-span-8">
                <CardHeader>
                  <CardTitle className="text-base">Revenue Trend</CardTitle>
                  <CardDescription>Last 7 days performance</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="currentColor" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="currentColor" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="currentColor" fill="url(#rev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-zinc-200 md:col-span-4">
                <CardHeader>
                  <CardTitle className="text-base">Lead Pipeline</CardTitle>
                  <CardDescription>Conversion stages</CardDescription>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Pie data={pipelineData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                        {pipelineData.map((_, i) => (
                          <Cell key={i} fill={pieColors[i % pieColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {pipelineData.map((p, idx) => (
                      <div key={p.name} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2 py-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[idx] }} />
                        <span className="font-semibold text-zinc-900">{p.name}</span>
                        <span className="ml-auto text-zinc-500">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs: Leads + Insights */}
            <motion.div variants={item}>
              <Tabs defaultValue="leads">
                <TabsList className="rounded-2xl bg-white">
                  <TabsTrigger value="leads" className="rounded-2xl">Recent Leads</TabsTrigger>
                  <TabsTrigger value="insights" className="rounded-2xl">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="leads" className="mt-4">
                  <Card className="rounded-3xl border-zinc-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Hot Leads</CardTitle>
                        <CardDescription>Respond quickly to win</CardDescription>
                      </div>
                      <Button className="rounded-2xl bg-zinc-900 hover:bg-zinc-800">
                        Open Leads
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>City</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.map((l) => (
                            <TableRow key={l.id} className="hover:bg-zinc-50">
                              <TableCell>
                                <div className="font-semibold text-zinc-900">{l.customer}</div>
                                <div className="text-xs text-zinc-500">{l.id}</div>
                              </TableCell>
                              <TableCell className="font-medium text-zinc-900">{l.service}</TableCell>
                              <TableCell className="text-zinc-600">{l.city}</TableCell>
                              <TableCell className="font-semibold text-zinc-900">{l.budget}</TableCell>
                              <TableCell><StatusBadge status={l.status} /></TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" className="rounded-2xl">
                                  View
                                  <ArrowUpRight className="ml-2 h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card className="rounded-3xl border-zinc-200">
                      <CardHeader>
                        <CardTitle className="text-base">Win Rate</CardTitle>
                        <CardDescription>Last 30 days</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-zinc-900">34%</div>
                        <p className="mt-2 text-sm text-zinc-500">
                          Improve by replying faster and sending quotes within 1 hour.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-zinc-200">
                      <CardHeader>
                        <CardTitle className="text-base">Top Category</CardTitle>
                        <CardDescription>Highest conversions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-zinc-900">AC Repair</div>
                        <p className="mt-2 text-sm text-zinc-500">
                          Customers trust you here—showcase 3 before/after photos.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-zinc-200">
                      <CardHeader>
                        <CardTitle className="text-base">Next Goal</CardTitle>
                        <CardDescription>Unlock premium leads</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-zinc-900">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-semibold">Reach 90% profile</span>
                        </div>
                        <div className="mt-3">
                          <Progress value={profileCompletion} />
                          <div className="mt-2 text-xs text-zinc-500">
                            You’re <span className="font-semibold text-zinc-900">{90 - profileCompletion}%</span> away.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
