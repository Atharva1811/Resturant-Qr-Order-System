import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Separator } from 'src/components/ui/separator';
import {
  Settings,
  Store,
  DollarSign,
  Percent,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAdminSettings() {
  const { currentRestaurant, updateRestaurantSettings, resetToInitialData } = useRestaurant();

  const [name, setName] = useState(currentRestaurant.name);
  const [cuisine, setCuisine] = useState(currentRestaurant.cuisine);
  const [address, setAddress] = useState(currentRestaurant.address);
  const [phone, setPhone] = useState(currentRestaurant.phone);
  const [email, setEmail] = useState(currentRestaurant.email);
  const [currency, setCurrency] = useState(currentRestaurant.currency);
  const [taxRate, setTaxRate] = useState(currentRestaurant.taxRate.toString());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTax = parseFloat(taxRate);
    if (!name.trim() || isNaN(parsedTax) || parsedTax < 0) {
      toast.error('Please enter valid restaurant details and tax rate.');
      return;
    }

    try {
      await updateRestaurantSettings({
        name: name.trim(),
        cuisine: cuisine.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currency: currency.trim() || '$',
        taxRate: parsedTax,
      });
    } catch {
      // Toast handled by context
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-6 text-amber-600" />
          <span>Restaurant Settings & Profile</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure establishment details, contact information, currency, and sales tax calculation
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Store className="size-4 text-amber-600" />
              <span>General Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Restaurant Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Cuisine & Concept</Label>
                <Input
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Official Contact Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Physical Location / Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Official Contact & Notification Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxes & Currency Card */}
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <DollarSign className="size-4 text-amber-600" />
              <span>Currency & Tax Calculation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Currency Symbol</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="$"
                  className="h-9 text-xs rounded-lg w-28 font-bold"
                />
                <p className="text-[11px] text-muted-foreground">Used on menus, bills, and tickets</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Sales Tax Rate (%)</Label>
                <div className="relative w-36">
                  <Input
                    type="number"
                    step="0.05"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="h-9 text-xs rounded-lg font-bold pr-8"
                  />
                  <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground">Automatically added to cart totals</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 border-t border-border bg-muted/20 flex justify-end">
            <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold">
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
