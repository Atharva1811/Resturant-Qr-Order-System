import React, { useState } from 'react';
import { Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Restaurant } from 'src/context/restaurant-context/types';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
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
  DialogDescription,
} from 'src/components/ui/dialog';
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperadminRestaurants() {
  const { restaurants, updateRestaurantStatus, addRestaurant, tables } = useRestaurant();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Confirmation dialog state
  const [selectedTenantForAction, setSelectedTenantForAction] = useState<Restaurant | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'SUSPENDED'>('SUSPENDED');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // New restaurant dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newCuisine, setNewCuisine] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const filtered = restaurants.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const promptStatusChange = (restaurant: Restaurant, next: 'ACTIVE' | 'SUSPENDED') => {
    setSelectedTenantForAction(restaurant);
    setTargetStatus(next);
    setIsConfirmOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!selectedTenantForAction) return;
    updateRestaurantStatus(selectedTenantForAction.id, targetStatus);
    toast.success(
      `Restaurant "${selectedTenantForAction.name}" is now ${targetStatus === 'ACTIVE' ? 'Active' : 'Suspended'}.`
    );
    setIsConfirmOpen(false);
    setSelectedTenantForAction(null);
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSlug.trim()) {
      toast.error('Restaurant name and slug are required.');
      return;
    }

    try {
      const created = await addRestaurant({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        cuisine: newCuisine.trim() || 'Modern Cuisine',
        address: newAddress.trim() || '100 Main St, Cityville',
        phone: newPhone.trim() || '+1 (555) 000-0000',
        email: newEmail.trim() || `contact@${newSlug}.com`,
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
        bannerUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
        currency: '$',
        taxRate: 8.5,
        status: 'ACTIVE',
      });

      toast.success(`Partner restaurant "${created.name}" onboarded successfully!`);
      setIsAddOpen(false);
      setNewName('');
      setNewSlug('');
      setNewCuisine('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to onboard restaurant on server.');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-6 text-purple-600" />
            <span>Restaurant Directory & Tenants</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage multi-tenant partners, subscriptions, and access privileges
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 text-xs font-semibold"
        >
          <Plus className="size-4" />
          <span>Onboard Restaurant</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by restaurant name, slug, cuisine..."
              className="pl-9 h-9 text-xs rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Button
              size="sm"
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ALL')}
              className={`h-8 text-xs rounded-lg ${statusFilter === 'ALL' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              All ({restaurants.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ACTIVE')}
              className={`h-8 text-xs rounded-lg ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              Active ({restaurants.filter((r) => r.status === 'ACTIVE').length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'SUSPENDED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('SUSPENDED')}
              className={`h-8 text-xs rounded-lg ${statusFilter === 'SUSPENDED' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
            >
              Suspended ({restaurants.filter((r) => r.status === 'SUSPENDED').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold">Restaurant</TableHead>
              <TableHead className="text-xs font-bold">Cuisine / Category</TableHead>
              <TableHead className="text-xs font-bold">Tables</TableHead>
              <TableHead className="text-xs font-bold">Total Orders</TableHead>
              <TableHead className="text-xs font-bold">Revenue</TableHead>
              <TableHead className="text-xs font-bold">Status</TableHead>
              <TableHead className="text-xs font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  No restaurant tenants match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tenant) => (
                <TableRow key={tenant.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.name}
                        className="size-9 rounded-lg object-cover border border-border"
                      />
                      <div>
                        <p className="font-bold text-sm text-foreground">{tenant.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">slug: {tenant.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{tenant.cuisine}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {tables.filter((t) => t.restaurantSlug === tenant.slug).length || 8} tables
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground">
                    {tenant.totalOrders.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-black text-foreground">
                    ${tenant.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] font-semibold ${
                        tenant.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/superadmin/restaurants/${tenant.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Details
                        </Button>
                      </Link>

                      {tenant.status === 'ACTIVE' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => promptStatusChange(tenant, 'SUSPENDED')}
                          className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => promptStatusChange(tenant, 'ACTIVE')}
                          className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Confirmation Dialog for Status Change */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              <DialogTitle className="text-base font-bold text-foreground">
                Confirm {targetStatus === 'ACTIVE' ? 'Activation' : 'Suspension'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-2">
              Are you sure you want to change the status of{' '}
              <strong className="text-foreground">{selectedTenantForAction?.name}</strong> to{' '}
              <span className="font-bold uppercase text-foreground">{targetStatus}</span>?
              {targetStatus === 'SUSPENDED' &&
                ' When suspended, customer mobile scanning and order submissions for this tenant are disabled.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmStatusChange}
              className={`text-xs text-white ${
                targetStatus === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {targetStatus === 'ACTIVE' ? 'Activation' : 'Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboard New Restaurant Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Onboard New Restaurant Tenant</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a dedicated tenant profile with its own isolated menu, QR codes, and staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRestaurant} className="space-y-3.5 mt-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Restaurant Name *</Label>
              <Input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) {
                    setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }
                }}
                placeholder="e.g. Bella Napoli Trattoria"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Slug Identifier *</Label>
                <Input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. bella-napoli"
                  className="h-9 text-xs rounded-lg font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Cuisine Type</Label>
                <Input
                  value={newCuisine}
                  onChange={(e) => setNewCuisine(e.target.value)}
                  placeholder="e.g. Authentic Italian & Wine"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Physical Address</Label>
              <Input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contact Phone</Label>
                <Input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Admin Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@restaurant.com"
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                Create Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
