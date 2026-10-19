import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function RestaurantAdminAnalytics() {
  const { currentRestaurant, orders } = useRestaurant();
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('WEEK');
  const [renderTime] = useState(() => Date.now());

  const restaurantOrders = orders.filter(
    (o) => !o.restaurantSlug || o.restaurantSlug === currentRestaurant.slug
  );

  const filteredOrders = restaurantOrders.filter((order) => {
    if (timeRange === 'TODAY') {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const todayDate = new Date(renderTime).toISOString().split('T')[0];
      return orderDate === todayDate;
    } else if (timeRange === 'WEEK') {
      const orderTime = new Date(order.createdAt).getTime();
      const sevenDaysAgo = renderTime - 7 * 24 * 60 * 60 * 1000;
      return orderTime >= sevenDaysAgo;
    } else if (timeRange === 'MONTH') {
      const orderTime = new Date(order.createdAt).getTime();
      const thirtyDaysAgo = renderTime - 30 * 24 * 60 * 60 * 1000;
      return orderTime >= thirtyDaysAgo;
    }
    return true;
  });

  const hasLiveOrders = filteredOrders.length > 0;
  const currency = currentRestaurant.currency || '$';

  // Derived real figures
  const periodRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const periodOrdersCount = filteredOrders.length;
  const periodAov = periodOrdersCount > 0 ? periodRevenue / periodOrdersCount : 0;
  const completedOrders = filteredOrders.filter((o) => o.status === 'COMPLETED').length;
  const completionRate =
    periodOrdersCount > 0 ? Math.round((completedOrders / periodOrdersCount) * 100) : 0;

  // Real daily aggregation for charts
  const dayMap = new Map<string, { day: string; revenue: number; orders: number }>();
  for (const o of filteredOrders) {
    const d = new Date(o.createdAt);
    const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
    const existing = dayMap.get(dayLabel) || { day: dayLabel, revenue: 0, orders: 0 };
    existing.revenue = Number((existing.revenue + o.total).toFixed(2));
    existing.orders += 1;
    dayMap.set(dayLabel, existing);
  }
  const weekSalesData = Array.from(dayMap.values());

  // Derive top popular dishes from real order line items
  const dishCounts: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const name = item.name || 'Dish';
      if (!dishCounts[name]) {
        dishCounts[name] = { count: 0, revenue: 0 };
      }
      dishCounts[name].count += item.quantity || 1;
      dishCounts[name].revenue += item.itemTotal ?? (item.price || 0) * (item.quantity || 1);
    });
  });

  const popularDishes = Object.entries(dishCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      ordersCount: data.count,
      revenue: data.revenue,
    }));

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-6 text-amber-600" />
            <span>Restaurant Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verified performance metrics, sales velocity, and customer dish preferences for {currentRestaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl shadow-xs">
          <Button
            size="sm"
            variant={timeRange === 'TODAY' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('TODAY')}
            className={`h-7 text-xs rounded-lg ${timeRange === 'TODAY' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''}`}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'WEEK' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('WEEK')}
            className={`h-7 text-xs rounded-lg ${timeRange === 'WEEK' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''}`}
          >
            7 Days
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'MONTH' ? 'default' : 'ghost'}
            onClick={() => setTimeRange('MONTH')}
            className={`h-7 text-xs rounded-lg ${timeRange === 'MONTH' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''}`}
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* 4-KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Period Revenue</span>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currency}
                {periodRevenue.toFixed(2)}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">Verified gross sales</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Orders</span>
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{periodOrdersCount}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Orders submitted</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Avg. Ticket Size</span>
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">
                {currency}
                {periodAov.toFixed(2)}
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">Average per customer</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Fulfillment Rate</span>
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-foreground">{completionRate}%</span>
              <p className="text-[11px] text-muted-foreground mt-1">
                {completedOrders} completed tickets
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-8 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">Revenue Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Daily sales velocity across the selected timeframe</p>
              </div>
              <Badge variant="outline" className="text-xs">
                Verified Orders
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full flex items-center justify-center">
              {weekSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekSalesData}>
                    <defs>
                      <linearGradient id="amberAnalytics" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [`$${val}`, 'Gross Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#amberAnalytics)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <Inbox className="size-8 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-semibold">No sales activity for this period</p>
                  <p className="text-[11px] text-muted-foreground">Orders placed during this range will appear here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Volume Histogram */}
        <Card className="lg:col-span-4 border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Order Volume</CardTitle>
            <p className="text-xs text-muted-foreground">Ticket volume distribution</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full flex items-center justify-center">
              {weekSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekSalesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(val: any) => [val, 'Tickets']} />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center">
                  <Inbox className="size-8 text-muted-foreground/40 mb-1.5" />
                  <p className="text-xs font-semibold">No ticket volume recorded</p>
                  <p className="text-[11px] text-muted-foreground">Ticket counts will reflect here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Dishes Table */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="size-4 text-amber-600" />
              <span>Top Ordered Dishes</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground">Ranked by volume ordered via customer QR tables</p>
          </div>
        </CardHeader>
        <CardContent>
          {popularDishes.length > 0 ? (
            <div className="divide-y divide-border/60">
              {popularDishes.map((dish, idx) => (
                <div key={dish.name} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{dish.name}</h4>
                      <p className="text-xs text-muted-foreground">{dish.ordersCount} total units sold</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-foreground">
                      {currency}
                      {dish.revenue.toFixed(2)}
                    </span>
                    <p className="text-[11px] text-muted-foreground">Revenue contribution</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Inbox className="size-8 text-muted-foreground/40 mb-1.5" />
              <p className="text-xs font-semibold">No dish performance records yet</p>
              <p className="text-[11px] text-muted-foreground">Ordered items will rank here based on customer volume.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
