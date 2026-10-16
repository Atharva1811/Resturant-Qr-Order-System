import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { StaffMember } from 'src/context/restaurant-context/types';
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
} from 'src/components/ui/dialog';
import {
  Users,
  Plus,
  Shield,
  ChefHat,
  Coffee,
  Trash2,
  Edit2,
  Mail,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAdminStaff() {
  const { currentRestaurant, staff, addStaff, updateStaff, deleteStaff } = useRestaurant();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'RESTAURANT_ADMIN' | 'KITCHEN_STAFF' | 'WAITER'>('KITCHEN_STAFF');

  const restaurantStaff = staff.filter((s) => s.restaurantSlug === currentRestaurant.slug);

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    const created = addStaff({
      restaurantSlug: currentRestaurant.slug,
      name: name.trim(),
      email: email.trim(),
      role: role,
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    });

    toast.success(`Staff member "${created.name}" invited.`);
    setIsAddOpen(false);
    setName('');
    setEmail('');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'RESTAURANT_ADMIN':
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 gap-1 text-[10px]">
            <Shield className="size-3" />
            <span>Admin</span>
          </Badge>
        );
      case 'KITCHEN_STAFF':
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 gap-1 text-[10px]">
            <ChefHat className="size-3" />
            <span>Kitchen / Barista</span>
          </Badge>
        );
      case 'WAITER':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 gap-1 text-[10px]">
            <Coffee className="size-3" />
            <span>Floor Waiter</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-amber-600" />
            <span>Staff & Permissions</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Assign team roles, kitchen display access, and manager rights for {currentRestaurant.name}
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Staff Member</span>
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold">Team Member</TableHead>
              <TableHead className="text-xs font-bold">Assigned Role</TableHead>
              <TableHead className="text-xs font-bold">Account Status</TableHead>
              <TableHead className="text-xs font-bold">Joined Date</TableHead>
              <TableHead className="text-xs font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurantStaff.map((member) => (
              <TableRow key={member.id} className="hover:bg-muted/40">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="size-9 rounded-full object-cover border border-border"
                    />
                    <div>
                      <p className="font-bold text-sm text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="size-3 text-stone-400" />
                        <span>{member.email}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(member.role)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      member.status === 'ACTIVE'
                        ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
                        : 'text-stone-500'
                    }`}
                  >
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {member.joinedDate}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteStaff(member.id);
                      toast.success(`Removed ${member.name}`);
                    }}
                    className="size-8 p-0 text-muted-foreground hover:text-rose-600"
                    title="Remove Staff"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Add New Staff Member</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mateo Rossi"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Address *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mateo@rustichearth.com"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assign Role *</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
              >
                <option value="KITCHEN_STAFF">Kitchen Staff / Barista (KDS View)</option>
                <option value="RESTAURANT_ADMIN">Restaurant Admin (Full Manager Access)</option>
                <option value="WAITER">Floor Waiter (Table Assistance)</option>
              </select>
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
