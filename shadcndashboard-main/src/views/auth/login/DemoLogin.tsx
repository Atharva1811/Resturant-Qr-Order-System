import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import api from 'src/api/api-client';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { UtensilsCrossed, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { setActiveRole, setCurrentRestaurantSlug } = useRestaurant();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password.trim()) {
      toast.error('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.login(cleanEmail, password);
      const user = (response as any)?.data?.user || response?.user;

      if (!user) {
        throw new Error('Authentication failed: no user record returned');
      }

      setActiveRole(user.role);
      if (user.restaurantSlug) {
        setCurrentRestaurantSlug(user.restaurantSlug);
      }

      toast.success(`Welcome back, ${user.name || 'User'}!`);

      // Route based on authorized server-side role
      switch (user.role) {
        case 'SUPERADMIN':
          navigate('/superadmin');
          break;
        case 'KITCHEN_STAFF':
          navigate('/kitchen/orders');
          break;
        case 'RESTAURANT_ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'WAITER':
          navigate('/admin/orders');
          break;
        default:
          navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      toast.error(err.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setIsLoading(false);
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
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  placeholder="admin@restaurant.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  placeholder="Enter your password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
