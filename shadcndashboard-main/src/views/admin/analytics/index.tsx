import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Sparkles,
  Award,
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

  const weekSalesData = [
    { day: 'Mon', revenue: 640, orders: 21 },
    { day: 'Tue', revenue: 780, orders: 26 },
    { day: 'Wed', revenue: 920, orders: 31 },
    { day: 'Thu', revenue: 860, orders: 28 },
    { day: 'Fri', revenue: 1420, orders: 46 },
    { day: 'Sat', revenue: 1890, orders: 62 },
    { day: 'Sun', revenue: 1650, orders: 54 },
  ];

  const popularDishes = [
    { name: 'Margherita D.O.P. Pizza', ordersCount: 142, revenue: 2556.0, growth: '+22%' },
    { name: 'Slow-Braised Short Rib Pappardelle', ordersCount: 118, revenue: 2832.0, growth: '+18%' },
    { name: 'Diavola & Hot Honey Pizza', ordersCount: 96, revenue: 2064.0, growth: '+15%' },
    { name: 'Truffle Burrata & Wild Mushrooms', ordersCount: 84, revenue: 1386.0, growth: '+9%' },
    { name: 'Blood Orange Basil Spritz', ordersCount: 164, revenue: 1394.0, growth: '+29%' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Demo Disclosure Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-600 shrink-0" />
          <span>
            <strong>Simulated Analytics:</strong> Analytics figures shown are demonstration values to preview chart telemetry and reporting.
          </span>
        </div>
        <Badge variant="outline" className="border-amber-300 text-[10px]">
          Demo Data
        </Badge>
      </div>

      {/* Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-6 text-amber-600" />
            <span>Restaurant Analytics</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance metrics, sales velocity, and customer dish preferences for {currentRestaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-card border border-border p-1 rounded-xl">
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground">Period Revenue</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-foreground">$8,160.00</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="size-3" /> +14.2%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Gross sales generated via QR ordering</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground">Total Period Orders</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-foreground">268</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="size-3" /> +8.9%
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Average 38 orders per day</p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-muted-foreground">Average Order Value (AOV)</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-foreground">$30.45</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                <TrendingUp className="size-3" /> +$2.10
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Driven by beverage & dessert add-ons</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Revenue Trend</CardTitle>
              <p className="text-xs text-muted-foreground">Daily sales velocity over the selected window</p>
            </div>
            <Badge variant="outline" className="text-xs">
              Weekly Aggregate
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekSalesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${val}`, 'Sales']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Dishes Table */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Award className="size-4 text-amber-600" />
            <span>Top Performing Menu Items</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Most frequently ordered dishes ranked by volume</p>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border/60">
            {popularDishes.map((dish, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="size-6 rounded-md bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-sm text-foreground">{dish.name}</p>
                    <p className="text-muted-foreground">{dish.ordersCount} tickets ordered</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-foreground">${dish.revenue.toFixed(2)}</p>
                  <p className="text-emerald-600 font-semibold">{dish.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
