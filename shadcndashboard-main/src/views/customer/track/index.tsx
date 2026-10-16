import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { joinOrderRoom, onOrderStatusUpdated } from 'src/api/socket-client';
import { Card, CardHeader, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import {
  CheckCircle2,
  Clock,
  Utensils,
  ChefHat,
  BellRing,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  CircleCheck,
} from 'lucide-react';

export default function CustomerOrderTrackingPage() {
  const { slug, table, orderId } = useParams<{ slug: string; table: string; orderId: string }>();
  const { orders, currentRestaurant } = useRestaurant();
  const [pulseKey, setPulseKey] = useState(0);

  const order = orders.find((o) => o.id === orderId) || orders[0];

  useEffect(() => {
    // Flash animation on status change
    setPulseKey((prev) => prev + 1);
  }, [order?.status]);

  // Real-time Socket.IO room subscription for live tracking
  useEffect(() => {
    if (!orderId) return;
    try {
      joinOrderRoom(orderId);
    } catch {
      // Ignored if socket unavailable
    }

    const unsub = onOrderStatusUpdated((data) => {
      if (data?.orderId === orderId) {
        setPulseKey((prev) => prev + 1);
      }
    });

    return () => unsub();
  }, [orderId]);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="font-bold text-base text-foreground">Order not found</p>
          <Link to={`/m/${slug || 'rustic-hearth'}/${table || 'table-4'}`}>
            <Button className="mt-4">Return to Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'NEW', title: 'Order Received', desc: 'Sent to the kitchen system' },
    { key: 'ACCEPTED', title: 'Accepted by Kitchen', desc: 'Queued for station prep' },
    { key: 'PREPARING', title: 'Cooking in Progress', desc: 'Freshly prepared by chef' },
    { key: 'READY', title: 'Ready for Service', desc: 'Plated and ready at your table' },
    { key: 'COMPLETED', title: 'Completed', desc: 'Enjoy your meal!' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'NEW':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-20">
      <div className="max-w-xl mx-auto bg-background min-h-screen border-x border-border shadow-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <Link
            to={`/m/${order.restaurantSlug}/${table || 'table-4'}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <ArrowLeft className="size-4" />
            <span>Order More Food</span>
          </Link>
          <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-bold text-xs py-0.5">
            {order.tableNumber}
          </Badge>
        </div>

        {/* Live Status Hero */}
        <div key={pulseKey} className="p-6 text-center bg-stone-900 text-white animate-in fade-in duration-300">
          <div className="size-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            {order.status === 'READY' ? (
              <BellRing className="size-7 animate-bounce text-emerald-400" />
            ) : order.status === 'PREPARING' ? (
              <ChefHat className="size-7 animate-pulse text-amber-400" />
            ) : order.status === 'COMPLETED' ? (
              <CheckCircle2 className="size-7 text-emerald-400" />
            ) : (
              <Clock className="size-7 text-stone-300" />
            )}
          </div>

          <h1 className="text-xl font-black tracking-tight">
            {order.status === 'NEW' && 'Order Received'}
            {order.status === 'ACCEPTED' && 'Order Accepted!'}
            {order.status === 'PREPARING' && 'Chef is Cooking Your Meal'}
            {order.status === 'READY' && 'Your Order is Ready!'}
            {order.status === 'COMPLETED' && 'Order Completed'}
          </h1>

          <p className="text-xs text-stone-300 mt-1">
            Order Reference: <span className="font-mono font-bold text-amber-400">{order.orderNumber}</span>
          </p>

          <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs text-stone-200 mt-3 backdrop-blur-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time status updates automatically</span>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="p-6 bg-card border-b border-border">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Live Kitchen Progress
          </h2>

          <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-border before:z-0">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.key} className="relative z-10 flex items-start gap-4">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950 animate-pulse'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="size-4" /> : idx + 1}
                  </div>

                  <div>
                    <p
                      className={`text-sm font-bold leading-tight ${
                        isCurrent ? 'text-amber-600 dark:text-amber-400' : isPast ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Receipt */}
        <div className="p-6 space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Order Summary</h3>
            <Badge variant="outline" className="text-xs">
              {order.paymentMethod === 'ONLINE' ? 'Paid Online' : 'Pay at Counter'}
            </Badge>
          </div>

          <div className="divide-y divide-border/80 border border-border rounded-xl bg-card p-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{item.quantity}x</span>
                    <span className="font-semibold text-foreground">{item.name}</span>
                  </div>
                  {item.selectedCustomizations.length > 0 && (
                    <p className="text-[11px] text-muted-foreground pl-5 mt-0.5">
                      {item.selectedCustomizations.map((c) => c.selectedOptionNames.join(', ')).join(' • ')}
                    </p>
                  )}
                  {item.notes && <p className="text-[11px] text-amber-600 italic pl-5 mt-0.5">"{item.notes}"</p>}
                </div>
                <span className="font-bold text-foreground">
                  {currentRestaurant.currency}
                  {item.itemTotal.toFixed(2)}
                </span>
              </div>
            ))}

            <div className="pt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {currentRestaurant.currency}
                  {order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>
                  {currentRestaurant.currency}
                  {order.tax.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-black text-sm text-foreground pt-1">
                <span>Total</span>
                <span>
                  {currentRestaurant.currency}
                  {order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-center text-xs text-amber-800 dark:text-amber-200">
            Need assistance or refills? Notify your floor server anytime!
          </div>
        </div>
      </div>
    </div>
  );
}
