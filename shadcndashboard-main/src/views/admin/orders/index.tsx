import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Order, OrderStatus } from 'src/context/restaurant-context/types';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Separator } from 'src/components/ui/separator';
import {
  Search,
  ShoppingBag,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  CreditCard,
  Banknote,
  Utensils,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAdminOrders() {
  const { orders, currentRestaurant, updateOrderStatus } = useRestaurant();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'WEEK' | 'ALL'>('TODAY');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [renderTime] = useState(() => Date.now());

  const restaurantOrders = orders.filter((o) => o.restaurantSlug === currentRestaurant.slug);

  const filteredOrders = restaurantOrders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;

    if (dateFilter === 'TODAY') {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const todayDate = new Date(renderTime).toISOString().split('T')[0];
      if (orderDate !== todayDate) return false;
    } else if (dateFilter === 'WEEK') {
      const orderTime = new Date(order.createdAt).getTime();
      const sevenDaysAgo = renderTime - 7 * 24 * 60 * 60 * 1000;
      if (orderTime < sevenDaysAgo) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        order.orderNumber.toLowerCase().includes(q) ||
        order.tableNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, newStatus);
    setSelectedOrder({ ...selectedOrder, status: newStatus });
    toast.success(`Order ${selectedOrder.orderNumber} updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="size-6 text-amber-600" />
            <span>Orders Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Filter, inspect, and update dining orders across all restaurant tables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-card">
            Total Orders: <strong className="ml-1 text-foreground">{restaurantOrders.length}</strong>
          </Badge>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, table, customer..."
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
                <Calendar className="size-3.5" /> Date:
              </span>
              <Button
                size="sm"
                variant={dateFilter === 'TODAY' ? 'default' : 'outline'}
                onClick={() => setDateFilter('TODAY')}
                className={`h-8 text-xs rounded-lg ${dateFilter === 'TODAY' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'WEEK' ? 'default' : 'outline'}
                onClick={() => setDateFilter('WEEK')}
                className={`h-8 text-xs rounded-lg ${dateFilter === 'WEEK' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              >
                7 Days
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'ALL' ? 'default' : 'outline'}
                onClick={() => setDateFilter('ALL')}
                className={`h-8 text-xs rounded-lg ${dateFilter === 'ALL' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              >
                All Time
              </Button>
            </div>
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)} className="w-full">
            <TabsList className="grid grid-cols-4 sm:flex flex-wrap h-auto p-1 gap-1">
              <TabsTrigger value="ALL" className="text-xs py-1.5 px-3">
                All ({restaurantOrders.length})
              </TabsTrigger>
              <TabsTrigger value="NEW" className="text-xs py-1.5 px-3">
                New ({restaurantOrders.filter((o) => o.status === 'NEW').length})
              </TabsTrigger>
              <TabsTrigger value="ACCEPTED" className="text-xs py-1.5 px-3">
                Accepted ({restaurantOrders.filter((o) => o.status === 'ACCEPTED').length})
              </TabsTrigger>
              <TabsTrigger value="PREPARING" className="text-xs py-1.5 px-3">
                Preparing ({restaurantOrders.filter((o) => o.status === 'PREPARING').length})
              </TabsTrigger>
              <TabsTrigger value="READY" className="text-xs py-1.5 px-3">
                Ready ({restaurantOrders.filter((o) => o.status === 'READY').length})
              </TabsTrigger>
              <TabsTrigger value="COMPLETED" className="text-xs py-1.5 px-3">
                Completed ({restaurantOrders.filter((o) => o.status === 'COMPLETED').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold">Order #</TableHead>
              <TableHead className="text-xs font-bold">Table</TableHead>
              <TableHead className="text-xs font-bold">Customer</TableHead>
              <TableHead className="text-xs font-bold">Items</TableHead>
              <TableHead className="text-xs font-bold">Total</TableHead>
              <TableHead className="text-xs font-bold">Payment</TableHead>
              <TableHead className="text-xs font-bold">Status</TableHead>
              <TableHead className="text-xs font-bold">Time</TableHead>
              <TableHead className="text-xs font-bold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground text-xs">
                  No orders found matching the selected criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const totalItemQty = order.items.reduce((acc, i) => acc + i.quantity, 0);
                const orderTimeStr = new Date(order.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <TableRow key={order.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <TableCell className="font-bold font-mono text-xs text-foreground">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-xs bg-muted/40">
                        {order.tableNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{order.customerName}</p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
                          {order.customerEmail}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{totalItemQty}</span> items
                    </TableCell>
                    <TableCell className="font-bold text-xs text-foreground">
                      {currentRestaurant.currency}
                      {order.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div>
                        {order.paymentStatus === 'PAID' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold text-[10px] gap-1 py-0.5">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            <span>Paid</span>
                          </Badge>
                        ) : order.paymentStatus === 'FAILED' ? (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-[10px] gap-1 py-0.5">
                            <Clock className="size-3 text-rose-600" />
                            <span>Failed</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-[10px] gap-1 py-0.5">
                            <Clock className="size-3 text-amber-600" />
                            <span>Pending</span>
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {order.paymentMethod === 'ONLINE' ? 'Online Pay' : 'At Counter'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          order.status === 'NEW'
                            ? 'bg-amber-500 text-white'
                            : order.status === 'ACCEPTED'
                            ? 'bg-blue-600 text-white'
                            : order.status === 'PREPARING'
                            ? 'bg-purple-600 text-white'
                            : order.status === 'READY'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : order.status === 'COMPLETED'
                            ? 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {orderTimeStr}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                        }}
                        className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                      >
                        <Eye className="size-3.5 mr-1" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Order {selectedOrder.orderNumber}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedOrder.tableNumber} • Placed at{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </p>
                </div>

                <Badge
                  className={`text-xs font-semibold uppercase ${
                    selectedOrder.status === 'NEW'
                      ? 'bg-amber-500 text-white'
                      : selectedOrder.status === 'ACCEPTED'
                      ? 'bg-blue-600 text-white'
                      : selectedOrder.status === 'PREPARING'
                      ? 'bg-purple-600 text-white'
                      : selectedOrder.status === 'READY'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {selectedOrder.status}
                </Badge>
              </div>
            </DialogHeader>

            {/* Customer & Payment Info */}
            <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs grid grid-cols-2 gap-2 mt-2">
              <div>
                <span className="text-muted-foreground">Customer:</span>
                <p className="font-semibold text-foreground">{selectedOrder.customerName}</p>
                <p className="text-muted-foreground truncate">{selectedOrder.customerEmail}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment:</span>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : selectedOrder.paymentStatus === 'FAILED'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'PAID' ? '✓ Paid' : selectedOrder.paymentStatus === 'FAILED' ? '✗ Failed' : '⏳ Pending'}
                    <span className="text-[10px] font-normal opacity-75 ml-1">
                      ({selectedOrder.paymentMethod === 'ONLINE' ? 'Online' : 'Counter'})
                    </span>
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  Total: <strong className="text-foreground">{currentRestaurant.currency}{selectedOrder.total.toFixed(2)}</strong>
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 mt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Itemized Dishes
              </span>
              <div className="divide-y divide-border/60 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 flex items-start justify-between text-xs">
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
                      {item.notes && <p className="text-[11px] text-rose-500 italic pl-5 mt-0.5">"{item.notes}"</p>}
                    </div>
                    <span className="font-bold text-foreground">
                      {currentRestaurant.currency}
                      {item.itemTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-2" />

            {/* Status Transition Controls */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Update Order Status
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  size="sm"
                  variant={selectedOrder.status === 'NEW' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus('NEW')}
                  className="h-8 text-xs"
                >
                  New
                </Button>
                <Button
                  size="sm"
                  variant={selectedOrder.status === 'ACCEPTED' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  className="h-8 text-xs"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant={selectedOrder.status === 'PREPARING' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus('PREPARING')}
                  className="h-8 text-xs"
                >
                  Cooking
                </Button>
                <Button
                  size="sm"
                  variant={selectedOrder.status === 'READY' ? 'default' : 'outline'}
                  onClick={() => handleUpdateStatus('READY')}
                  className="h-8 text-xs"
                >
                  Ready
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                >
                  <CheckCircle2 className="size-3.5 mr-1" />
                  <span>Mark as Completed & Served</span>
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)} className="text-xs w-full">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
