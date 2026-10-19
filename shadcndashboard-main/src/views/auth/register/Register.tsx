import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import api from 'src/api/api-client';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import {
  UtensilsCrossed,
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { BRAND_CONFIG } from 'src/config/brand.config';

export default function Register() {
  const navigate = useNavigate();
  const { setActiveRole, setCurrentRestaurantSlug, refreshData } = useRestaurant();

  // Form State
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-generate slug preview
  const handleRestaurantNameChange = (val: string) => {
    setRestaurantName(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations
    if (!restaurantName.trim() || !adminName.trim() || !adminEmail.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.auth.registerRestaurant({
        restaurantName: restaurantName.trim(),
        slug: slug.trim() || undefined,
        cuisine: cuisine.trim() || 'Contemporary Dining',
        address: address.trim() || '123 Main Street',
        phone: phone.trim() || '+1 (555) 000-0000',
        adminName: adminName.trim(),
        adminEmail: adminEmail.toLowerCase().trim(),
        password,
      });

      const user = (response as any)?.data?.user || response?.user;

      if (!user) {
        throw new Error('Registration succeeded but user profile was not returned.');
      }

      // Update state in application context
      setActiveRole('RESTAURANT_ADMIN');
      if (user.restaurantSlug) {
        setCurrentRestaurantSlug(user.restaurantSlug);
      }

      toast.success(`Welcome to Servora, ${user.restaurantName || restaurantName}!`);
      await refreshData().catch(() => {});

      // Navigate straight to newly created restaurant admin dashboard
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg =
        err?.status === 409
          ? err.message || 'An account with this email or restaurant name already exists.'
          : err?.status === 429
          ? 'Too many registration requests. Please wait 15 minutes before trying again.'
          : err?.message || 'Failed to complete registration. Please verify your details.';

      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center p-4 py-12">
      <Card className="w-full max-w-xl border border-border shadow-xl rounded-2xl bg-card overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 text-center bg-stone-900 text-white border-b border-stone-800">
          <div className="size-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            <UtensilsCrossed className="size-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">{BRAND_CONFIG.name}</h1>
          <p className="text-xs text-stone-300 mt-1 font-medium">
            Launch Your Digital Restaurant & QR Ordering
          </p>
        </div>

        <CardContent className="p-7 space-y-6">
          {errorMessage && (
            <Alert variant="destructive" className="py-2.5 px-3 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs font-medium">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* SECTION 1: Restaurant Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Store className="size-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Restaurant Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="reg-restaurant-name" className="text-xs font-semibold">
                    Establishment Name *
                  </Label>
                  <Input
                    id="reg-restaurant-name"
                    value={restaurantName}
                    placeholder="e.g. The Rustic Hearth"
                    onChange={(e) => handleRestaurantNameChange(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    disabled={isLoading}
                    required
                  />
                  {slug && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      URL slug: <span className="font-mono text-amber-600">/m/{slug}/table-1</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-cuisine" className="text-xs font-semibold">
                    Cuisine Concept
                  </Label>
                  <Input
                    id="reg-cuisine"
                    value={cuisine}
                    placeholder="e.g. Artisan Italian, Cafe, Sushi"
                    onChange={(e) => setCuisine(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-phone" className="text-xs font-semibold">
                    Contact Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="reg-phone"
                      value={phone}
                      placeholder="+1 (555) 234-5678"
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-8 h-10 text-xs rounded-xl"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="reg-address" className="text-xs font-semibold">
                    Physical Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="reg-address"
                      value={address}
                      placeholder="100 Culinary Avenue, Downtown"
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-8 h-10 text-xs rounded-xl"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Admin Credentials */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <User className="size-4 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Manager & Admin Credentials
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label htmlFor="reg-admin-name" className="text-xs font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    id="reg-admin-name"
                    value={adminName}
                    placeholder="Chef Marco Rossi"
                    onChange={(e) => setAdminName(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-admin-email" className="text-xs font-semibold">
                    Work Email *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="reg-admin-email"
                      type="email"
                      value={adminEmail}
                      placeholder="marco@rustichearth.com"
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-8 h-10 text-xs rounded-xl"
                      autoComplete="email"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-password" className="text-xs font-semibold">
                    Password * (min 8 chars)
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 pr-9 h-10 text-xs rounded-xl"
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reg-confirm-password" className="text-xs font-semibold">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id="reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      placeholder="••••••••"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-8 h-10 text-xs rounded-xl"
                      autoComplete="new-password"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
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
                  <span>Provisioning Restaurant & Account...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Register & Launch Restaurant</span>
                </>
              )}
            </Button>
          </form>

          <div className="pt-3 text-center border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Already have a Servora account?{' '}
              <Link to="/login" className="font-bold text-amber-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
