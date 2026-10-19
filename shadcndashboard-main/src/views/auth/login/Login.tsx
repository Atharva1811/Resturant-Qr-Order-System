import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import api from 'src/api/api-client';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { UtensilsCrossed, Lock, Mail, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BRAND_CONFIG } from 'src/config/brand.config';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveRole, setCurrentRestaurantSlug } = useRestaurant();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setErrorMessage('Your session has expired. Please sign in again to continue.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.login(cleanEmail, password);
      const user = (response as any)?.data?.user || response?.user;

      if (!user) {
        throw new Error('Authentication succeeded but user profile was not returned.');
      }

      // Update state in application context
      setActiveRole(user.role);
      if (user.restaurantSlug) {
        setCurrentRestaurantSlug(user.restaurantSlug);
      }

      toast.success(`Welcome back, ${user.name || 'User'}!`);

      // Authoritative redirection based on verified server role
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
      const msg =
        err?.status === 429
          ? 'Too many login attempts. Please wait 15 minutes before trying again.'
          : err?.status === 403
          ? err.message || 'This restaurant account is currently suspended.'
          : err?.status === 401
          ? 'Invalid email or password. Please verify your credentials.'
          : err?.message || 'Authentication failed. Please verify your connection and credentials.';

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-md border border-border shadow-xl rounded-2xl bg-card overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 text-center bg-stone-900 text-white border-b border-stone-800">
          <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <UtensilsCrossed className="size-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">{BRAND_CONFIG.name}</h1>
          <p className="text-xs text-stone-300 mt-1 font-medium">
            {BRAND_CONFIG.tagline}
          </p>
        </div>

        <CardContent className="p-7 space-y-5">
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs font-medium">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  placeholder="name@restaurant.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  placeholder="Enter your account password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-10 text-xs rounded-xl"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Servora</span>
              )}
            </Button>
          </form>

          <div className="pt-2 text-center border-t border-border/60">
            <p className="text-[11px] text-muted-foreground">
              Authorized restaurant staff and administrators only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
