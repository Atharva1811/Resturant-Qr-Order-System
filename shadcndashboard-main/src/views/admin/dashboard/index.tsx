import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import api from 'src/api/api-client';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  ChefHat,
  QrCode,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export default function RestaurantAdminDashboard() {
  const { currentRestaurant, orders, menuItems, tables, isBackendConnected } = useRestaurant();
  const [serverAnalytics, setServerAnalytics] = useState<any | null>(null);

  const restaurantOrders = orders.filter((o) => o.restaurantSlug === currentRestaurant.slug);

  useEffect(() => {
    api.admin
      .getAnalytics()
      .then((data) => {
        if (data) setServerAnalytics(data);
      })
      .catch(() => {});
  }, [currentRestaurant.id]);

  // Metrics calculations
  const totalRevenue = serverAnalytics?.totalRevenue ?? restaurantOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = serverAnalytics?.totalOrders ?? restaurantOrders.length;
  const pendingOrders = restaurantOrders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'PREPARING'
  ).length;
  const aov = serverAnalytics?.averageOrderValue ?? (totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0);

  // Chart data: hourly sales simulation
  const salesTrendData = [
    { hour: '11 AM', revenue: 140, orders: 4 },
    { hour: '12 PM', revenue: 380, orders: 11 },
    { hour: '1 PM', revenue: 520, orders: 16 },
    { hour: '2 PM', revenue: 290, orders: 8 },
    { hour: '3 PM', revenue: 160, orders: 5 },
    { hour: '4 PM', revenue: 120, orders: 3 },
    { hour: '5 PM', revenue: 340, orders: 9 },
    { hour: '6 PM', revenue: 680, orders: 19 },
    { hour: '7 PM', revenue: 890, orders: 24 },
    { hour: '8 PM', revenue: 760, orders: 21 },
  ];

  // Category breakdown
  const categoryData = [
    { name: 'Pizzas', share: 45 },
    { name: 'Pastas', share: 28 },
    { name: 'Drinks', share: 15 },
    { name: 'Desserts', share: 12 },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Backend Status Banner */}
      {isBackendConnected ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              <strong>Live Backend Connected:</strong> PostgreSQL & Express sync active for <strong>{currentRestaurant.name}</strong>.
            </span>
          </div>
          <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:text-emerald-300 text-[10px]">
            Live Server Active
          </Badge>
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-600 shrink-0" />
            <span>
              <strong>Resilient Local Mode:</strong> Connected to client store for <strong>{currentRestaurant.name}</strong>. Values update optimistically.
            </span>
          </div>
          <Badge variant="outline" className="border-amber-300 text-[10px]">
            Local Store
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Restaurant Admin Overview</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentRestaurant.name} • Live operational KPIs, order flow, and revenue analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/kitchen/orders">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-xl font-semibold">
              <ChefHat className="size-3.5 text-rose-600" />
              <span>Open Kitchen KDS</span>
            </Button>
          </Link>
          <Link to="/admin/menu">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 text-xs font-semibold">
              <UtensilsCrossed className="size-3.5" />
              <span>Manage Menu</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Today's Revenue</span>
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currentRestaurant.currency}
                {totalRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="size-3" />
                <span>+18.2% vs yesterday</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Orders Count</span>
              <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{restaurantOrders.length}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Total orders processed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Pending Orders</span>
              <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{pendingOrders}</span>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Requires kitchen attention</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Average Order Value</span>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currentRestaurant.currency}
                {aov.toFixed(2)}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">Average per QR ticket</p>
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
                <CardTitle className="text-base font-bold text-foreground">Today's Sales Hourly Flow</CardTitle>
                <p className="text-xs text-muted-foreground">Revenue generated throughout lunch and dinner shifts</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Today (Live)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData}>
                  <defs>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="hour" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`$${val}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#amberGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Popular Items / Category Share */}
        <Card className="lg:col-span-4 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Category Share (%)</CardTitle>
            <p className="text-xs text-muted-foreground">Volume proportion by category</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(val: any) => [`${val}%`, 'Order Volume Share']} />
                  <Bar dataKey="share" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Preview */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Recent QR Orders</CardTitle>
            <p className="text-xs text-muted-foreground">Incoming orders submitted from customer mobile tables</p>
          </div>
          <Link to="/admin/orders">
            <Button variant="ghost" size="sm" className="text-xs text-amber-600 gap-1 font-semibold">
              <span>View All Orders</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/60">
            {restaurantOrders.slice(0, 4).map((order) => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-black text-xs text-foreground shrink-0">
                    {order.tableNumber.replace('Table ', 'T')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground font-medium">• {order.customerName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {currentRestaurant.currency}
                      {order.total.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {order.paymentMethod} ({order.paymentStatus})
                    </p>
                  </div>

                  <Badge
                    className={`text-xs font-semibold ${
                      order.status === 'NEW'
                        ? 'bg-amber-500 text-white'
                        : order.status === 'ACCEPTED'
                        ? 'bg-blue-600 text-white'
                        : order.status === 'PREPARING'
                        ? 'bg-purple-600 text-white'
                        : order.status === 'READY'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
