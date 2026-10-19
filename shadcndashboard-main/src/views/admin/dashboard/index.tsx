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
  UtensilsCrossed,
  ArrowRight,
  Inbox,
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
  const { currentRestaurant, orders, menuItems, categories } = useRestaurant();
  const [serverAnalytics, setServerAnalytics] = useState<any | null>(null);

  const restaurantOrders = orders.filter(
    (o) => !o.restaurantSlug || o.restaurantSlug === currentRestaurant.slug
  );

  useEffect(() => {
    if (currentRestaurant.id) {
      api.admin
        .getAnalytics()
        .then((data) => {
          if (data) setServerAnalytics(data);
        })
        .catch(() => {});
    }
  }, [currentRestaurant.id]);

  // Derived real metrics
  const totalRevenue =
    serverAnalytics?.totalRevenue ?? restaurantOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = serverAnalytics?.totalOrders ?? restaurantOrders.length;
  const pendingOrders = restaurantOrders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'PREPARING'
  ).length;
  const aov =
    serverAnalytics?.averageOrderValue ??
    (totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0);

  // Real hourly sales distribution calculated from actual orders
  const hourlyMap = new Map<string, { hour: string; revenue: number; orders: number }>();
  for (const o of restaurantOrders) {
    const d = new Date(o.createdAt);
    const hourStr = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    const existing = hourlyMap.get(hourStr) || { hour: hourStr, revenue: 0, orders: 0 };
    existing.revenue = Number((existing.revenue + o.total).toFixed(2));
    existing.orders += 1;
    hourlyMap.set(hourStr, existing);
  }
  const salesTrendData = Array.from(hourlyMap.values());

  // Real category share calculated from actual order line items
  const catCountMap = new Map<string, number>();
  let totalItemUnits = 0;
  for (const o of restaurantOrders) {
    for (const item of o.items) {
      const matchMenu = menuItems.find((m) => m.id === item.menuItemId);
      const matchCat = categories.find((c) => c.id === matchMenu?.categoryId);
      const catName = matchCat?.name || matchMenu?.name || 'General';
      catCountMap.set(catName, (catCountMap.get(catName) || 0) + item.quantity);
      totalItemUnits += item.quantity;
    }
  }
  const categoryData = Array.from(catCountMap.entries()).map(([name, count]) => ({
    name: name.length > 12 ? name.substring(0, 12) + '...' : name,
    share: totalItemUnits > 0 ? Math.round((count / totalItemUnits) * 100) : 0,
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Restaurant Admin Overview</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currentRestaurant.name} • Operational KPIs, live table orders, and revenue
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
              <span className="text-xs font-semibold text-muted-foreground">Total Revenue</span>
              <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currentRestaurant.currency}
                {totalRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">Aggregated verified sales</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
              <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{restaurantOrders.length}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Verified orders received</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Active Orders</span>
              <div className="size-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Clock className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{pendingOrders}</span>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Pending in kitchen</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Average Ticket Value</span>
              <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currentRestaurant.currency}
                {aov.toFixed(2)}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">Average per customer order</p>
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
                <CardTitle className="text-base font-bold text-foreground">Sales Distribution by Hour</CardTitle>
                <p className="text-xs text-muted-foreground">Revenue generated throughout dining shifts</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Live Data
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full flex items-center justify-center">
              {salesTrendData.length > 0 ? (
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
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#amberGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <Inbox className="size-8 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-semibold">No hourly sales activity recorded yet</p>
                  <p className="text-[11px] text-muted-foreground">Hourly trends will appear as customers place orders.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Items / Category Share */}
        <Card className="lg:col-span-4 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Category Share (%)</CardTitle>
            <p className="text-xs text-muted-foreground">Order volume proportion by category</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full flex items-center justify-center">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Order Share']} />
                    <Bar dataKey="share" fill="#d97706" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <Inbox className="size-8 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-semibold">No category volume data available</p>
                  <p className="text-[11px] text-muted-foreground">Categories will populate from order line items.</p>
                </div>
              )}
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
          {restaurantOrders.length > 0 ? (
            <div className="divide-y divide-border/60">
              {restaurantOrders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
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
          ) : (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <ShoppingBag className="size-10 text-muted-foreground/40 mb-2" />
              <p className="font-semibold text-sm">No orders received yet today</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                When guests scan table QR codes and place orders, they will appear here in real time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
