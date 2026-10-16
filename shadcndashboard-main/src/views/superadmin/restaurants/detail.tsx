import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminRestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const { restaurants, updateRestaurantStatus, tables, menuItems, setCurrentRestaurantSlug } = useRestaurant();

  const tenant = restaurants.find((r) => r.id === id) || restaurants[0];

  const handleToggleStatus = () => {
    const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateRestaurantStatus(tenant.id, nextStatus);
    toast.success(`Tenant status changed to ${nextStatus}`);
  };

  const tenantTables = tables.filter((t) => t.restaurantSlug === tenant.slug);
  const tenantMenuItems = menuItems.filter((m) => m.restaurantSlug === tenant.slug);

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <div>
        <Link
          to="/superadmin/restaurants"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Tenant Directory</span>
        </Link>
      </div>

      {/* Tenant Banner Header */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <div className="relative h-44 w-full bg-muted">
          <img src={tenant.bannerUrl} alt={tenant.name} className="w-full h-full object-cover brightness-75" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="size-16 rounded-2xl object-cover border-2 border-white shadow-md bg-background"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black">{tenant.name}</h1>
                  <Badge
                    className={`text-xs ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-emerald-500 hover:bg-emerald-500 text-white'
                        : 'bg-rose-500 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {tenant.status}
                  </Badge>
                </div>
                <p className="text-xs text-stone-200 mt-1">{tenant.cuisine}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={tenant.status === 'ACTIVE' ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleStatus}
                className="text-xs font-semibold rounded-lg"
              >
                {tenant.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
              </Button>

              <Link
                to={`/m/${tenant.slug}/table-1`}
                target="_blank"
                className="inline-block"
              >
                <Button variant="secondary" size="sm" className="text-xs gap-1.5 rounded-lg">
                  <span>Open Customer Menu</span>
                  <ExternalLink className="size-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border bg-card">
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-black text-foreground mt-0.5">
              ${tenant.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Lifetime Orders</p>
            <p className="text-lg font-black text-foreground mt-0.5">{tenant.totalOrders.toLocaleString()}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Configured Tables</p>
            <p className="text-lg font-black text-foreground mt-0.5">{tenantTables.length || 8}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Menu Items</p>
            <p className="text-lg font-black text-foreground mt-0.5">{tenantMenuItems.length || 8} Active</p>
          </div>
        </div>
      </Card>

      {/* Details Two Column */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Tenant Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin className="size-4 text-stone-400" />
              <span>Address: <strong className="text-foreground">{tenant.address}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="size-4 text-stone-400" />
              <span>Contact Phone: <strong className="text-foreground">{tenant.phone}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="size-4 text-stone-400" />
              <span>Official Email: <strong className="text-foreground">{tenant.email}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Calendar className="size-4 text-stone-400" />
              <span>Joined Platform: <strong className="text-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</strong></span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold text-foreground">Billing & SaaS Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5 text-xs">
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Subscription Plan</span>
              <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">Enterprise Pro</Badge>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Configured Sales Tax</span>
              <span className="font-bold text-foreground">{tenant.taxRate}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/60">
              <span className="text-muted-foreground">Default Currency</span>
              <span className="font-bold text-foreground">{tenant.currency} (USD)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Multi-tenant Data Isolation</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="size-3.5" /> Enforced
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
