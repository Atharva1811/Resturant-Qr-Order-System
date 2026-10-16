import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import api from 'src/api/api-client';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import {
  Building2,
  DollarSign,
  ShoppingBag,
  QrCode,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export default function SuperadminOverview() {
  const { restaurants, orders, tables, isBackendConnected } = useRestaurant();
  const [platformMetrics, setPlatformMetrics] = useState<any | null>(null);

  useEffect(() => {
    api.superadmin
      .getMetrics()
      .then((data) => {
        if (data) setPlatformMetrics(data);
      })
      .catch(() => {});
  }, []);

  const totalPlatformRevenue = platformMetrics?.platformRevenue ?? restaurants.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalPlatformOrders = platformMetrics?.platformOrders ?? restaurants.reduce((acc, r) => acc + r.totalOrders, 0);
  const activeTenants = platformMetrics?.activeTenants ?? restaurants.filter((r) => r.status === 'ACTIVE').length;

  // Monthly platform growth data
  const growthData = [
    { month: 'Oct', volume: 18400, orders: 480 },
    { month: 'Nov', volume: 29500, orders: 740 },
    { month: 'Dec', volume: 46200, orders: 1120 },
    { month: 'Jan', volume: 54100, orders: 1390 },
    { month: 'Feb', volume: 68900, orders: 1820 },
    { month: 'Mar', volume: 86990, orders: 2620 },
  ];

  const tenantVolumeData = restaurants.map((r) => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
    revenue: r.totalRevenue,
    orders: r.totalOrders,
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Platform Status Banner */}
      {isBackendConnected ? (
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-purple-600 animate-pulse"></span>
            <span>
              <strong>Platform Superadmin Live Mode:</strong> Connected to PostgreSQL multi-tenant backend with real-time audit event logging.
            </span>
          </div>
          <Badge variant="outline" className="border-purple-300 text-purple-700 dark:text-purple-300 text-[10px] hidden sm:inline">
            PostgreSQL Multi-Tenant
          </Badge>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600 shrink-0" />
            <span>
              <strong>Platform Superadmin Demo:</strong> Multi-tenant management enabled in offline resilient mode.
            </span>
          </div>
          <Badge variant="outline" className="border-amber-300 text-[10px] hidden sm:inline">
            Offline Resilient
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="size-6 text-purple-600" />
            <span>Platform Superadmin Overview</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cross-tenant performance, SaaS metrics, and restaurant partner directory
          </p>
        </div>

        <Link to="/superadmin/restaurants">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 text-xs font-semibold">
            <Building2 className="size-4" />
            <span>Manage Tenants ({restaurants.length})</span>
          </Button>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Gross Volume</span>
              <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                ${totalPlatformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" />
                <span>+24.8% vs last month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Platform Orders</span>
              <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{totalPlatformOrders.toLocaleString()}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Across all subscribed restaurants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Active Restaurants</span>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Building2 className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {activeTenants} / {restaurants.length}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                {restaurants.length - activeTenants > 0 ? `${restaurants.length - activeTenants} suspended` : 'All partners active'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Managed QR Tables</span>
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <QrCode className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">24 Active</span>
              <p className="text-[11px] text-muted-foreground mt-1">Real-time mobile QR ordering points</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-8 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Platform GMV Growth</CardTitle>
                <p className="text-xs text-muted-foreground">Gross Merchandise Value across all SaaS tenant restaurants</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Last 6 Months
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`$${val.toLocaleString()}`, 'GMV Volume']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#9333ea" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Revenue by Restaurant</CardTitle>
            <p className="text-xs text-muted-foreground">Volume comparison across active tenants</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenantVolumeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                  <XAxis type="number" stroke="#888888" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <YAxis type="category" dataKey="name" stroke="#888888" fontSize={11} width={90} />
                  <Tooltip formatter={(val: any) => [`$${val.toLocaleString()}`, 'Total Revenue']} />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registered Tenants Preview */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Tenant Restaurants</CardTitle>
            <p className="text-xs text-muted-foreground">Manage subscriptions, account status, and credentials</p>
          </div>
          <Link to="/superadmin/restaurants">
            <Button variant="ghost" size="sm" className="text-xs text-purple-600 gap-1 font-semibold">
              <span>View All</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/60">
            {restaurants.map((rest) => (
              <div key={rest.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <img src={rest.logoUrl} alt={rest.name} className="size-10 rounded-xl object-cover border border-border" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{rest.name}</h4>
                      <Badge
                        variant={rest.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={`text-[10px] ${
                          rest.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {rest.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{rest.cuisine} • {rest.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-foreground">
                      ${rest.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{rest.totalOrders} total orders</p>
                  </div>

                  <Link to={`/superadmin/restaurants/${rest.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-semibold rounded-lg">
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
