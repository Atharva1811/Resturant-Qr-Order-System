import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  Smartphone,
  ArrowRight,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DemoLogin() {
  const navigate = useNavigate();
  const { setActiveRole, currentRestaurant } = useRestaurant();
  const [email, setEmail] = useState('marco@rustichearth.com');
  const [password, setPassword] = useState('demo123456');

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.');
      return;
    }

    if (email.includes('superadmin') || email.includes('admin@platform')) {
      setActiveRole('SUPERADMIN');
      toast.success('Logged in as Platform Superadmin');
      navigate('/superadmin');
    } else if (email.includes('kitchen') || email.includes('chef')) {
      setActiveRole('KITCHEN_STAFF');
      toast.success('Logged in as Kitchen Staff');
      navigate('/kitchen/orders');
    } else {
      setActiveRole('RESTAURANT_ADMIN');
      toast.success(`Logged in as Admin for ${currentRestaurant.name}`);
      navigate('/admin/dashboard');
    }
  };

  const handleRoleQuickLogin = (role: 'SUPERADMIN' | 'RESTAURANT_ADMIN' | 'KITCHEN_STAFF') => {
    setActiveRole(role);
    if (role === 'SUPERADMIN') {
      toast.success('Switched to Platform Superadmin session');
      navigate('/superadmin');
    } else if (role === 'KITCHEN_STAFF') {
      toast.success('Switched to Kitchen Display System (KDS) session');
      navigate('/kitchen/orders');
    } else {
      toast.success(`Switched to Restaurant Admin session for ${currentRestaurant.name}`);
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md border border-border shadow-lg rounded-2xl bg-card overflow-hidden">
        {/* Brand Header */}
        <div className="p-6 text-center bg-stone-900 text-white border-b border-stone-800">
          <div className="size-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md">
            <UtensilsCrossed className="size-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight">Sudarshan QR SaaS</h1>
          <p className="text-xs text-stone-300 mt-1">
            Enterprise QR-Based Restaurant Order Management System
          </p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* 1-Click Role Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1-Click Role Demo Sign-In
              </span>
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                Phase 1 Fast Access
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => handleRoleQuickLogin('RESTAURANT_ADMIN')}
                className="justify-between h-10 px-3.5 text-xs font-semibold rounded-xl hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="size-4 text-amber-600" />
                  <span>Restaurant Admin (Marco)</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRoleQuickLogin('KITCHEN_STAFF')}
                className="justify-between h-10 px-3.5 text-xs font-semibold rounded-xl hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="size-4 text-rose-600" />
                  <span>Kitchen / Barista Staff (Elena)</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>

              <Button
                variant="outline"
                onClick={() => handleRoleQuickLogin('SUPERADMIN')}
                className="justify-between h-10 px-3.5 text-xs font-semibold rounded-xl hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-purple-600" />
                  <span>Platform Superadmin</span>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold text-[10px]">
                Or Authenticate with Credentials
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs">
              Log In
            </Button>
          </form>

          {/* Direct link to customer view */}
          <div className="pt-2 text-center">
            <Link
              to="/m/rustic-hearth/table-4"
              className="text-xs text-amber-600 hover:underline font-semibold inline-flex items-center gap-1"
            >
              <Smartphone className="size-3.5" />
              <span>Simulate Customer QR Scan (Table 4)</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
