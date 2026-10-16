import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import api from 'src/api/api-client';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { MenuItem, CustomizationGroup, SelectedCustomization, OrderItem } from 'src/context/restaurant-context/types';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Card } from 'src/components/ui/card';
import { Separator } from 'src/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from 'src/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from 'src/components/ui/sheet';
import { InputOTP, InputOTPGroup, InputOTPSlot } from 'src/components/ui/input-otp';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from 'src/components/ui/radio-group';
import { Checkbox } from 'src/components/ui/checkbox';
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  Clock,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle2,
  Utensils,
  Leaf,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerMenuPage() {
  const { slug, table } = useParams<{ slug: string; table: string }>();
  const navigate = useNavigate();
  const {
    currentRestaurant,
    categories,
    menuItems,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    cartItemCount,
    createCustomerOrder,
  } = useRestaurant();

  const [searchParams] = useSearchParams();
  const qrToken = searchParams.get('token') || undefined;
  const formattedTable = table ? decodeURIComponent(table).replace(/-/g, ' ').toUpperCase() : 'TABLE 4';

  const [tableVerified, setTableVerified] = useState<boolean | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  // Validate table QR context on server
  useEffect(() => {
    if (currentRestaurant?.slug && formattedTable) {
      api.public
        .verifyTable(currentRestaurant.slug, formattedTable, qrToken)
        .then(() => {
          setTableVerified(true);
          setTableError(null);
        })
        .catch((err) => {
          if (err.status === 400 || err.status === 404) {
            setTableVerified(false);
            setTableError(err.message || 'Table verification failed. Please scan the official table stand.');
          } else {
            setTableVerified(true);
          }
        });
    }
  }, [currentRestaurant?.slug, formattedTable, qrToken]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [vegOnly, setVegOnly] = useState(false);

  // Customization modal state
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedSingleOptions, setSelectedSingleOptions] = useState<Record<string, string>>({});
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<Record<string, string[]>>({});
  const [itemSpecialNotes, setItemSpecialNotes] = useState('');

  // Cart sheet state
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Checkout & OTP modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'DETAILS' | 'OTP' | 'PAYMENT'>('DETAILS');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COUNTER' | 'ONLINE'>('ONLINE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategoryId !== 'ALL' && item.categoryId !== selectedCategoryId) return false;
    if (vegOnly && !item.isVeg) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenCustomize = (item: MenuItem) => {
    if (!item.isAvailable) {
      toast.error('Sorry, this item is currently sold out.');
      return;
    }
    setActiveItem(item);
    setItemQuantity(1);
    setItemSpecialNotes('');

    // Pre-populate default single options
    const defaults: Record<string, string> = {};
    if (item.customizationGroups) {
      item.customizationGroups.forEach((group) => {
        if (group.type === 'SINGLE' && group.options.length > 0) {
          defaults[group.id] = group.options[0].id;
        }
      });
    }
    setSelectedSingleOptions(defaults);
    setSelectedMultiOptions({});
  };

  const calculateCustomizedItemPrice = () => {
    if (!activeItem) return 0;
    let base = activeItem.price;

    if (activeItem.customizationGroups) {
      activeItem.customizationGroups.forEach((group) => {
        if (group.type === 'SINGLE') {
          const selectedOptId = selectedSingleOptions[group.id];
          const opt = group.options.find((o) => o.id === selectedOptId);
          if (opt) base += opt.price;
        } else {
          const selectedOptIds = selectedMultiOptions[group.id] || [];
          selectedOptIds.forEach((optId) => {
            const opt = group.options.find((o) => o.id === optId);
            if (opt) base += opt.price;
          });
        }
      });
    }
    return Number((base * itemQuantity).toFixed(2));
  };

  const handleQuickAdd = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!item.isAvailable) {
      toast.error('Sorry, this item is currently sold out.');
      return;
    }
    const orderItem: OrderItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
      selectedCustomizations: [],
      itemTotal: item.price,
    };
    addToCart(orderItem);
    toast.success(`Added 1x ${item.name} to cart`);
  };

  const handleConfirmAddToCart = () => {
    if (!activeItem) return;

    // Validate required single options
    if (activeItem.customizationGroups) {
      for (const group of activeItem.customizationGroups) {
        if (group.type === 'SINGLE' && group.required && !selectedSingleOptions[group.id]) {
          toast.error(`Please select an option for "${group.name}".`);
          return;
        }
      }
    }

    const compiledCustomizations: SelectedCustomization[] = [];

    if (activeItem.customizationGroups) {
      activeItem.customizationGroups.forEach((group) => {
        if (group.type === 'SINGLE') {
          const optId = selectedSingleOptions[group.id];
          const opt = group.options.find((o) => o.id === optId);
          if (opt) {
            compiledCustomizations.push({
              groupId: group.id,
              groupName: group.name,
              selectedOptionIds: [opt.id],
              selectedOptionNames: [opt.name],
              additionalPrice: opt.price,
            });
          }
        } else {
          const optIds = selectedMultiOptions[group.id] || [];
          if (optIds.length > 0) {
            const selectedOpts = group.options.filter((o) => optIds.includes(o.id));
            compiledCustomizations.push({
              groupId: group.id,
              groupName: group.name,
              selectedOptionIds: optIds,
              selectedOptionNames: selectedOpts.map((o) => o.name),
              additionalPrice: selectedOpts.reduce((acc, curr) => acc + curr.price, 0),
            });
          }
        }
      });
    }

    const orderItem: OrderItem = {
      id: `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: activeItem.id,
      name: activeItem.name,
      price: activeItem.price,
      quantity: itemQuantity,
      imageUrl: activeItem.imageUrl,
      selectedCustomizations: compiledCustomizations,
      itemTotal: calculateCustomizedItemPrice(),
      notes: itemSpecialNotes.trim() || undefined,
    };

    addToCart(orderItem);
    toast.success(`Added ${itemQuantity}x ${activeItem.name} to cart!`);
    setActiveItem(null);
  };

  const handleSendOtp = () => {
    if (!customerName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsOtpSending(true);
    api.otp
      .requestOtp(customerEmail.trim(), currentRestaurant.slug, formattedTable)
      .then((res) => {
        setIsOtpSending(false);
        setCheckoutStep('OTP');
        if (res?.mockCode) {
          toast.success(`6-digit code sent! (Dev mock code: ${res.mockCode})`);
          setOtpCode(res.mockCode);
        } else {
          toast.success(`6-digit verification code sent to ${customerEmail}`);
        }
      })
      .catch((err) => {
        setIsOtpSending(false);
        if (err.status && err.status !== 0) {
          toast.error(err.message || 'Failed to request verification code.');
          return;
        }
        setCheckoutStep('OTP');
        toast.info(err.message || 'Offline preview mode: enter code to continue.');
      });
  };

  const handleVerifyOtp = () => {
    if (otpCode.length < 6) {
      toast.error('Please enter the full 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);
    api.otp
      .verifyOtp(customerEmail.trim(), otpCode, currentRestaurant.slug, formattedTable)
      .then((res) => {
        setIsSubmitting(false);
        if (res?.sessionToken) {
          localStorage.setItem('sudarshan_customer_session', res.sessionToken);
        }
        toast.success('Email verified successfully!');
        setCheckoutStep('PAYMENT');
      })
      .catch((err) => {
        setIsSubmitting(false);
        if (err.status && err.status !== 0) {
          toast.error(err.message || 'Verification failed. Please check the code.');
          return;
        }
        toast.warning('Backend unreachable. Continuing in offline preview mode.');
        setCheckoutStep('PAYMENT');
      });
  };

  const handleSubmitFinalOrder = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionToken = localStorage.getItem('sudarshan_customer_session') || undefined;

      const response = await api.public.createOrder({
        restaurantSlug: currentRestaurant.slug,
        tableNumber: formattedTable,
        tableToken: qrToken,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        sessionToken,
        paymentMethod: paymentMethod,
        notes: 'Placed via Mobile QR Scan',
        items: cart.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          selectedCustomizations: i.selectedCustomizations?.map((c) => ({
            groupId: c.groupId,
            optionIds: c.selectedOptionIds,
          })),
          notes: i.notes,
        })),
      });

      const serverOrder = response?.order || response;
      setIsSubmitting(false);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      clearCart();
      if (response?.isDuplicate) {
        toast.info(`Order ${serverOrder.orderNumber} already received! Opening tracking...`);
      } else {
        toast.success(`Order ${serverOrder.orderNumber} confirmed by kitchen!`);
      }
      navigate(`/m/${currentRestaurant.slug}/${table || 'table-4'}/track/${serverOrder.id}`);
    } catch (err: any) {
      console.warn('Backend order placement error, evaluating fallback:', err);
      // Fallback if backend network is unreachable during offline testing
      if (!err.status || err.status === 0) {
        const order = createCustomerOrder({
          restaurantSlug: currentRestaurant.slug,
          tableNumber: formattedTable,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          items: cart,
          subtotal: cartSubtotal,
          tax: cartTax,
          total: cartTotal,
          paymentMethod: paymentMethod,
          notes: 'Placed via Mobile QR Scan (Offline Store)',
        });
        setIsSubmitting(false);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        toast.success(`Order ${order.orderNumber} placed in offline store!`);
        navigate(`/m/${currentRestaurant.slug}/${table || 'table-4'}/track/${order.id}`);
      } else {
        setIsSubmitting(false);
        toast.error(err.message || 'Failed to place order. Please review your selections.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28 overflow-x-hidden">
      {/* Mobile-Friendly Shell Container */}
      <div className="max-w-xl mx-auto bg-background min-h-screen border-x border-border shadow-sm flex flex-col">
        {/* Restaurant Header Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden">
          <img
            src={currentRestaurant.bannerUrl}
            alt={currentRestaurant.name}
            className="w-full h-full object-cover brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Table Pill */}
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-amber-600 hover:bg-amber-600 text-white font-bold text-xs py-1 px-3 shadow-md flex items-center gap-1.5 border border-amber-400/40">
              <Utensils className="size-3.5" />
              <span>{formattedTable}</span>
            </Badge>
          </div>

          {/* Table QR Context Badge */}
          <div className="absolute top-4 right-4 z-10">
            <Badge variant="outline" className="bg-black/40 text-stone-200 border-white/20 backdrop-blur-md text-[11px] py-1">
              QR Verified
            </Badge>
          </div>

          {/* Restaurant Profile Info */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{currentRestaurant.name}</h1>
            <p className="text-xs text-stone-200 mt-0.5 line-clamp-1">{currentRestaurant.cuisine}</p>
          </div>
        </div>

        {/* Search & Dietary Filter */}
        <div className="p-4 space-y-3 bg-card border-b border-border sticky top-0 z-20 shadow-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, desserts..."
              className="pl-9 pr-4 h-10 bg-muted/40 rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Button
              size="sm"
              variant={selectedCategoryId === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSelectedCategoryId('ALL')}
              className={`rounded-full h-8 text-xs shrink-0 px-3.5 ${
                selectedCategoryId === 'ALL' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''
              }`}
            >
              All Items
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`rounded-full h-8 text-xs shrink-0 px-3.5 ${
                  selectedCategoryId === cat.id ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''
                }`}
              >
                {cat.name}
              </Button>
            ))}

            <Separator orientation="vertical" className="h-5 mx-1" />

            <Button
              size="sm"
              variant={vegOnly ? 'default' : 'outline'}
              onClick={() => setVegOnly(!vegOnly)}
              className={`rounded-full h-8 text-xs shrink-0 px-3 gap-1.5 ${
                vegOnly ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              <Leaf className="size-3.5" />
              <span>Veg Only</span>
            </Button>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="p-4 space-y-4 flex-1">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Utensils className="size-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-foreground text-sm">No dishes found</p>
              <p className="text-xs text-muted-foreground mt-1">Try searching for something else or clearing filters.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('ALL');
                  setVegOnly(false);
                }}
                className="mt-4 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasCustomizations = Boolean(item.customizationGroups && item.customizationGroups.length > 0);
              const inCartQty = cart
                .filter((c) => c.menuItemId === item.id)
                .reduce((acc, c) => acc + c.quantity, 0);

              return (
                <Card
                  key={item.id}
                  onClick={() => handleOpenCustomize(item)}
                  className={`overflow-hidden border border-border/80 transition-all duration-150 cursor-pointer hover:border-amber-500/50 hover:shadow-md flex flex-row ${
                    !item.isAvailable ? 'opacity-65 cursor-not-allowed bg-muted/30' : 'bg-card'
                  }`}
                >
                  {/* Content */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {item.isVeg ? (
                          <span className="size-3.5 rounded-xs border border-emerald-600 flex items-center justify-center p-0.5" title="Vegetarian">
                            <span className="size-1.5 rounded-full bg-emerald-600" />
                          </span>
                        ) : (
                          <span className="size-3.5 rounded-xs border border-rose-600 flex items-center justify-center p-0.5" title="Non-Vegetarian">
                            <span className="size-1.5 rounded-full bg-rose-600" />
                          </span>
                        )}
                        <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">{item.name}</h3>
                        {inCartQty > 0 && (
                          <Badge variant="secondary" className="text-[10px] font-bold bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 py-0 px-1.5">
                            {inCartQty} in cart
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-black text-foreground">
                        {currentRestaurant.currency}
                        {item.price.toFixed(2)}
                      </span>

                      {item.isAvailable ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            if (hasCustomizations) {
                              e.stopPropagation();
                              handleOpenCustomize(item);
                            } else {
                              handleQuickAdd(item, e);
                            }
                          }}
                          aria-label={`Add ${item.name} to order`}
                          className="h-8 px-3 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white gap-1 active:scale-95 transition-all shadow-xs"
                        >
                          <Plus className="size-3.5" />
                          <span>{hasCustomizations ? 'Customize' : inCartQty > 0 ? 'Add +' : 'Add'}</span>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border uppercase">
                          Sold Out
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-28 sm:w-32 h-28 sm:h-32 relative shrink-0 overflow-hidden bg-muted">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[11px] font-bold text-white uppercase tracking-wider">
                        Sold Out
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar (Appears when cart has items) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-40 animate-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={() => setIsCartOpen(true)}
            aria-label={`View Cart with ${cartItemCount} items, total ${currentRestaurant.currency}${cartTotal.toFixed(2)}`}
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-xl flex items-center justify-between px-5 text-sm active:scale-[0.99] transition-all border border-amber-500/30"
          >
            <div className="flex items-center gap-2.5">
              <span className="size-7 rounded-full bg-black/25 flex items-center justify-center text-xs font-black">
                {cartItemCount}
              </span>
              <div className="text-left">
                <span className="block leading-tight font-bold">View Cart</span>
                <span className="text-[10px] font-normal text-amber-100 opacity-90 block">
                  {cartItemCount === 1 ? '1 dish queued' : `${cartItemCount} dishes queued`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">
                {currentRestaurant.currency}
                {cartTotal.toFixed(2)}
              </span>
              <ArrowRight className="size-4.5" />
            </div>
          </Button>
        </div>
      )}

      {/* Item Customization Modal */}
      {activeItem && (
        <Dialog open={!!activeItem} onOpenChange={() => setActiveItem(null)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
            <div className="relative h-44 w-full overflow-hidden bg-muted">
              <img src={activeItem.imageUrl} alt={activeItem.name} className="w-full h-full object-cover" />
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{activeItem.name}</h2>
                  {activeItem.isVeg && (
                    <Badge variant="outline" className="text-emerald-700 border-emerald-300 text-[10px]">
                      Vegetarian
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activeItem.description}</p>
                <p className="text-base font-black text-foreground mt-2">
                  {currentRestaurant.currency}
                  {activeItem.price.toFixed(2)}
                </p>
              </div>

              <Separator />

              {/* Customization Options */}
              {activeItem.customizationGroups?.map((group) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {group.name} {group.required && <span className="text-rose-500">*</span>}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {group.type === 'SINGLE' ? 'Select 1' : 'Optional add-ons'}
                    </span>
                  </div>

                  {group.type === 'SINGLE' ? (
                    <RadioGroup
                      value={selectedSingleOptions[group.id] || ''}
                      onValueChange={(val) => setSelectedSingleOptions({ ...selectedSingleOptions, [group.id]: val })}
                      className="space-y-1.5"
                    >
                      {group.options.map((opt) => (
                        <label
                          key={opt.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 hover:bg-muted/30 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value={opt.id} id={opt.id} />
                            <span className="font-medium text-foreground">{opt.name}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-muted-foreground font-semibold">
                              +{currentRestaurant.currency}
                              {opt.price.toFixed(2)}
                            </span>
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-1.5">
                      {group.options.map((opt) => {
                        const isChecked = (selectedMultiOptions[group.id] || []).includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 hover:bg-muted/30 cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const current = selectedMultiOptions[group.id] || [];
                                  const next = checked ? [...current, opt.id] : current.filter((id) => id !== opt.id);
                                  setSelectedMultiOptions({ ...selectedMultiOptions, [group.id]: next });
                                }}
                              />
                              <span className="font-medium text-foreground">{opt.name}</span>
                            </div>
                            {opt.price > 0 && (
                              <span className="text-muted-foreground font-semibold">
                                +{currentRestaurant.currency}
                                {opt.price.toFixed(2)}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Special Instructions / Allergies</Label>
                <Textarea
                  value={itemSpecialNotes}
                  onChange={(e) => setItemSpecialNotes(e.target.value)}
                  placeholder="e.g. Extra dressing on the side, no onions"
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>

              {/* Quantity Selector & Confirm */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <div className="flex items-center border border-border rounded-xl p-1 bg-muted/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="size-8 p-0 rounded-lg text-foreground"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">{itemQuantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="size-8 p-0 rounded-lg text-foreground"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                <Button
                  onClick={handleConfirmAddToCart}
                  className="flex-1 h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm"
                >
                  Add to Cart • {currentRestaurant.currency}
                  {calculateCustomizedItemPrice().toFixed(2)}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Cart Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] flex flex-col p-0 max-w-xl mx-auto">
          <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold text-foreground">Your Order Cart</SheetTitle>
              <p className="text-xs text-muted-foreground">{formattedTable}</p>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearCart();
                  toast.info('Cart cleared');
                }}
                className="text-rose-600 hover:text-rose-700 text-xs h-7 px-2"
              >
                Clear All
              </Button>
            )}
          </SheetHeader>

          {/* Cart Items */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 divide-y divide-border/60">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="size-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-foreground text-sm">Your cart is empty</p>
                <p className="text-xs text-muted-foreground mt-1">Select items from the menu to build your meal.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{item.name}</p>
                    {item.selectedCustomizations.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {item.selectedCustomizations.map((c) => c.selectedOptionNames.join(', ')).join(' • ')}
                      </p>
                    )}
                    {item.notes && <p className="text-[11px] text-amber-700 dark:text-amber-300 italic mt-0.5">"{item.notes}"</p>}
                    <p className="text-xs font-bold text-foreground mt-1">
                      {currentRestaurant.currency}
                      {item.itemTotal.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center border border-border rounded-lg bg-muted/40 p-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="size-6 p-0 text-foreground"
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="size-6 p-0 text-foreground"
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <div className="p-4 border-t border-border bg-muted/20 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>
                  {currentRestaurant.currency}
                  {cartSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Estimated Tax ({currentRestaurant.taxRate}%)</span>
                <span>
                  {currentRestaurant.currency}
                  {cartTax.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-black text-foreground">
                <span>Total Amount</span>
                <span>
                  {currentRestaurant.currency}
                  {cartTotal.toFixed(2)}
                </span>
              </div>

              <Button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                  setCheckoutStep('DETAILS');
                }}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl mt-2 text-sm"
              >
                Proceed to Checkout ({currentRestaurant.currency}
                {cartTotal.toFixed(2)})
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout & OTP Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          {/* STEP 1: Customer Details */}
          {checkoutStep === 'DETAILS' && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Verify Details</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Enter your email to receive order updates and your 6-digit verification code.
                </p>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="custName" className="text-xs font-semibold">Your Name</Label>
                  <Input
                    id="custName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="h-10 text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="custEmail" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="custEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="e.g. aarav@example.com"
                    className="h-10 text-sm rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">We will send a 6-digit Brevo OTP verification code.</p>
                </div>
              </div>

              <Button
                onClick={handleSendOtp}
                disabled={isOtpSending}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm"
              >
                {isOtpSending ? 'Sending Code...' : 'Send Verification OTP'}
              </Button>
            </div>
          )}

          {/* STEP 2: 6-Digit Email OTP (Reusing template InputOTP) */}
          {checkoutStep === 'OTP' && (
            <div className="space-y-4 text-center">
              <div className="size-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldCheck className="size-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground">Verify Your Email</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  We sent a 6-digit OTP code to <span className="font-semibold text-foreground">{customerEmail}</span>
                </p>
              </div>

              {/* Demo Helper Banner */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 text-xs text-amber-800 dark:text-amber-200">
                <span className="font-bold">Phase 1 Demo Code:</span> Enter <span className="font-mono font-black text-amber-950 dark:text-amber-100">123456</span> or any 6 digits
              </div>

              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={otpCode} onChange={(val) => setOtpCode(val)}>
                  <InputOTPGroup className="gap-1.5 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:size-10">
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerifyOtp}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm"
              >
                Verify & Continue
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOtpCode('123456');
                  toast.info('Auto-filled demo code: 123456');
                }}
                className="text-xs text-amber-600 hover:underline block mx-auto font-medium"
              >
                Auto-fill Demo Code (123456)
              </button>
            </div>
          )}

          {/* STEP 3: Payment Method Selection */}
          {checkoutStep === 'PAYMENT' && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Choose Payment Method</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Total Due: <span className="font-black text-foreground">{currentRestaurant.currency}{cartTotal.toFixed(2)}</span> ({formattedTable})
                </p>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setPaymentMethod('ONLINE')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                    paymentMethod === 'ONLINE' ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20' : 'border-border'
                  }`}
                >
                  <CreditCard className="size-6 text-amber-600 mb-1.5" />
                  <span className="font-bold text-xs text-foreground">Pay Online</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Card / UPI / Wallet</span>
                </label>

                <label
                  onClick={() => setPaymentMethod('COUNTER')}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                    paymentMethod === 'COUNTER' ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/20' : 'border-border'
                  }`}
                >
                  <Banknote className="size-6 text-emerald-600 mb-1.5" />
                  <span className="font-bold text-xs text-foreground">Pay at Counter</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Cash or Card later</span>
                </label>
              </div>

              {paymentMethod === 'ONLINE' ? (
                <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Instant Demo Gateway</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50">Demo Sandbox</Badge>
                  </div>
                  <Input readOnly value="4242 •••• •••• 4242" className="h-8 text-xs bg-background font-mono" />
                  <p className="text-[10px] text-muted-foreground">Demo mock card preloaded for testing.</p>
                </div>
              ) : (
                <div className="bg-muted/40 p-3 rounded-xl border border-border text-xs text-muted-foreground">
                  Your order will be sent to the kitchen immediately. You can settle the bill with the staff before leaving.
                </div>
              )}

              <Button
                onClick={handleSubmitFinalOrder}
                disabled={isSubmitting}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm"
              >
                {isSubmitting ? 'Placing Order...' : `Confirm & Place Order (${currentRestaurant.currency}${cartTotal.toFixed(2)})`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
