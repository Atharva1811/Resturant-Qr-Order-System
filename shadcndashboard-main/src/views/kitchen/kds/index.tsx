import React, { useState, useEffect, useCallback } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Order, OrderStatus } from 'src/context/restaurant-context/types';
import { onOrderCreated, onSocketConnect } from 'src/api/socket-client';
import api from 'src/api/api-client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Clock,
  AlertTriangle,
  ChefHat,
  Volume2,
  VolumeX,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function KitchenDashboard() {
  const { orders, updateOrderStatus, currentRestaurant, refreshData } = useRestaurant();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | OrderStatus | 'ALL'>('ACTIVE');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Web Audio chime function for action / alert feedback
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or blocked
    }
  }, [soundEnabled]);

  // Real-time audio alert when new order arrives via Socket.IO
  useEffect(() => {
    const unsub = onOrderCreated((newOrder) => {
      if (newOrder) {
        playChime();
        toast.info(`🔔 New incoming ticket: ${newOrder.orderNumber || 'Order'} (Table ${newOrder.tableNumberSnapshot || 'QR'})`);
      }
    });
    return () => unsub();
  }, [playChime]);

  // Fetch active queue and auto-recover on socket reconnect
  const fetchActiveKitchenOrders = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      await refreshData();
      if (!quiet) toast.success('Kitchen queue synchronized with server');
    } catch {
      if (!quiet) toast.error('Failed to sync queue with server');
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, [refreshData]);

  useEffect(() => {
    fetchActiveKitchenOrders(true);
    const unsubConnect = onSocketConnect(() => {
      fetchActiveKitchenOrders(true);
      toast.info('⚡ Reconnected to server: active orders refreshed');
    });
    return () => unsubConnect();
  }, [fetchActiveKitchenOrders]);

  // Update timer every 10 seconds for real-time elapsed time calculation
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTimeMinutes = (isoString: string) => {
    const elapsedMs = currentTime - new Date(isoString).getTime();
    return Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
  };

  // Filter orders for the current restaurant
  const restaurantOrders = orders.filter((o) => o.restaurantSlug === currentRestaurant.slug);

  const filteredOrders = restaurantOrders.filter((order) => {
    if (activeTab === 'ACTIVE') {
      return order.status === 'NEW' || order.status === 'ACCEPTED' || order.status === 'PREPARING';
    }
    if (activeTab === 'ALL') return true;
    return order.status === activeTab;
  });

  const handleNextStatus = async (order: Order) => {
    let nextStatus: OrderStatus = order.status;
    let actionLabel = '';

    if (order.status === 'NEW') {
      nextStatus = 'ACCEPTED';
      actionLabel = 'Order Accepted';
    } else if (order.status === 'ACCEPTED') {
      nextStatus = 'PREPARING';
      actionLabel = 'Started Cooking';
    } else if (order.status === 'PREPARING') {
      nextStatus = 'READY';
      actionLabel = 'Order Marked as Ready!';
    } else if (order.status === 'READY') {
      nextStatus = 'COMPLETED';
      actionLabel = 'Order Completed & Served';
    }

    if (nextStatus !== order.status) {
      setUpdatingOrderId(order.id);
      try {
        await updateOrderStatus(order.id, nextStatus);
        playChime();
        toast.success(`${actionLabel} for ${order.tableNumber} (${order.orderNumber})`);
      } catch (err: any) {
        toast.error(`Status update failed: ${err?.message || 'Server error'}`);
      } finally {
        setUpdatingOrderId(null);
      }
    }
  };

  const activeOrdersCount = restaurantOrders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'PREPARING'
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* KDS Header */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <ChefHat className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Kitchen Display System (KDS)
              </h1>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                Live Kitchen View
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentRestaurant.name} • High-visibility real-time order queue for kitchen & barista staff
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActiveKitchenOrders(false)}
            disabled={isRefreshing}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Queue</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? 'Chime sound disabled' : 'Chime sound enabled');
            }}
            className="gap-2 text-xs"
          >
            {soundEnabled ? <Volume2 className="size-4 text-emerald-600" /> : <VolumeX className="size-4 text-muted-foreground" />}
            <span>Sound Alerts: {soundEnabled ? 'ON' : 'OFF'}</span>
          </Button>

          <Badge className="bg-rose-600 hover:bg-rose-600 text-white px-3 py-1 text-xs font-semibold">
            {activeOrdersCount} Pending In Kitchen
          </Badge>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:flex flex-wrap h-auto p-1 gap-1">
            <TabsTrigger value="ACTIVE" className="text-xs py-1.5 px-3">
              Active Queue ({activeOrdersCount})
            </TabsTrigger>
            <TabsTrigger value="NEW" className="text-xs py-1.5 px-3">
              New ({restaurantOrders.filter((o) => o.status === 'NEW').length})
            </TabsTrigger>
            <TabsTrigger value="PREPARING" className="text-xs py-1.5 px-3">
              Cooking ({restaurantOrders.filter((o) => o.status === 'PREPARING').length})
            </TabsTrigger>
            <TabsTrigger value="READY" className="text-xs py-1.5 px-3">
              Ready ({restaurantOrders.filter((o) => o.status === 'READY').length})
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="text-xs py-1.5 px-3">
              Done ({restaurantOrders.filter((o) => o.status === 'COMPLETED').length})
            </TabsTrigger>
            <TabsTrigger value="ALL" className="text-xs py-1.5 px-3">
              All Orders ({restaurantOrders.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No orders in this station</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            All caught up! New orders placed by customers or waitstaff will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsed = getElapsedTimeMinutes(order.createdAt);
            const isOverdue = elapsed >= 15 && order.status !== 'COMPLETED';

            return (
              <Card
                key={order.id}
                className={`flex flex-col transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden ${
                  isOverdue
                    ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/10'
                    : order.status === 'NEW'
                    ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                    : 'border-border bg-card'
                }`}
              >
                {/* Urgent Overdue Ticket Banner */}
                {isOverdue && (
                  <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between tracking-wide animate-pulse">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>URGENT: WAITING OVER {elapsed} MINUTES</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono bg-rose-800/90 px-2 py-0.5 rounded shadow-xs">
                      PRIORITY
                    </span>
                  </div>
                )}

                {/* Header */}
                <CardHeader className="pb-3 border-b border-border/80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-2xl font-black tracking-tight text-foreground block">
                        {order.tableNumber}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {order.orderNumber} • {order.customerName}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          order.status === 'NEW'
                            ? 'bg-amber-500 text-white'
                            : order.status === 'ACCEPTED'
                            ? 'bg-blue-600 text-white'
                            : order.status === 'PREPARING'
                            ? 'bg-purple-600 text-white'
                            : order.status === 'READY'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : order.status === 'COMPLETED'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-stone-500 text-white'
                        }`}
                      >
                        {order.status}
                      </Badge>

                      {/* Elapsed Timer */}
                      <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isOverdue && <AlertTriangle className="size-3 text-rose-600" />}
                        <Clock className="size-3" />
                        <span>{elapsed}m ago</span>
                        {isOverdue && <span className="text-[10px] uppercase font-bold">(Overdue)</span>}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Items List */}
                <CardContent className="py-4 flex-1 space-y-3">
                  <div className="divide-y divide-border/60">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <span className="size-8 rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-xs">
                              {item.quantity}x
                            </span>
                            <div>
                              <p className="font-semibold text-sm text-foreground leading-snug">
                                {item.name}
                              </p>
                              {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedCustomizations.map((c, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-amber-100/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 font-medium"
                                    >
                                      {c.selectedOptionNames.join(', ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {item.notes && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 italic mt-1 font-medium">
                                  Note: "{item.notes}"
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-lg p-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-bold">Customer instructions:</span> {order.notes}
                    </div>
                  )}
                </CardContent>

                {/* Card Action Footer */}
                <CardFooter className="pt-3 pb-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Payment:</span>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : order.paymentStatus === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      }`}
                    >
                      {order.paymentStatus === 'PAID' ? '✓ Paid' : order.paymentStatus === 'FAILED' ? '✗ Failed' : '⏳ Pending'}
                      <span className="text-[10px] font-normal opacity-75 ml-1">
                        ({order.paymentMethod === 'ONLINE' ? 'Online' : 'Counter'})
                      </span>
                    </Badge>
                  </div>

                  {order.status !== 'COMPLETED' ? (
                    <Button
                      onClick={() => handleNextStatus(order)}
                      disabled={updatingOrderId === order.id}
                      className={`w-full sm:w-auto min-h-[44px] h-11 text-xs sm:text-sm font-bold rounded-xl gap-2 shadow-sm transition-all active:scale-[0.98] ${
                        order.status === 'NEW'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : order.status === 'ACCEPTED'
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : order.status === 'PREPARING'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-stone-800 hover:bg-stone-900 text-white'
                      }`}
                    >
                      {updatingOrderId === order.id ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          {order.status === 'NEW' && 'Accept Order'}
                          {order.status === 'ACCEPTED' && 'Start Cooking'}
                          {order.status === 'PREPARING' && 'Mark as Ready'}
                          {order.status === 'READY' && 'Complete Order'}
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 font-bold py-1 px-2.5">
                      Completed & Served
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
