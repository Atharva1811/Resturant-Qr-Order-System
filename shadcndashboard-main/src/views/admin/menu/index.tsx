import React, { useState } from 'react';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { MenuItem, MenuCategory, CustomizationGroup } from 'src/context/restaurant-context/types';
import { Card, CardHeader, CardTitle, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Switch } from 'src/components/ui/switch';
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
  UtensilsCrossed,
  Search,
  Plus,
  Edit2,
  Trash2,
  Leaf,
  Clock,
  Sparkles,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAdminMenu() {
  const {
    currentRestaurant,
    categories,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
    addCategory,
    deleteCategory,
  } = useRestaurant();

  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');

  // Add/Edit item modal state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCatId, setItemCatId] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(false);
  const [itemPrepTime, setItemPrepTime] = useState('12');
  const [customizationGroups, setCustomizationGroups] = useState<CustomizationGroup[]>([]);

  // Category modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const restaurantCategories = categories.filter((c) => c.restaurantSlug === currentRestaurant.slug);
  const restaurantItems = menuItems.filter((m) => m.restaurantSlug === currentRestaurant.slug);

  const filteredItems = restaurantItems.filter((item) => {
    if (selectedCategoryId !== 'ALL' && item.categoryId !== selectedCategoryId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  const openCreateItemModal = () => {
    setEditingItemId(null);
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setItemCatId(restaurantCategories[0]?.id || 'cat-1');
    setItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80');
    setItemIsVeg(false);
    setItemPrepTime('12');
    setCustomizationGroups([]);
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price.toString());
    setItemCatId(item.categoryId);
    setItemImage(item.imageUrl);
    setItemIsVeg(item.isVeg);
    setItemPrepTime(item.prepTimeMinutes.toString());
    setCustomizationGroups(item.customizationGroups || []);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid item name and positive price.');
      return;
    }

    if (editingItemId) {
      updateMenuItem(editingItemId, {
        name: itemName.trim(),
        description: itemDesc.trim(),
        price: priceNum,
        categoryId: itemCatId,
        imageUrl: itemImage.trim(),
        isVeg: itemIsVeg,
        prepTimeMinutes: parseInt(itemPrepTime, 10) || 10,
        customizationGroups,
      });
      toast.success(`Updated "${itemName}" successfully.`);
    } else {
      addMenuItem({
        restaurantSlug: currentRestaurant.slug,
        name: itemName.trim(),
        description: itemDesc.trim(),
        price: priceNum,
        categoryId: itemCatId,
        imageUrl: itemImage.trim(),
        isAvailable: true,
        isVeg: itemIsVeg,
        prepTimeMinutes: parseInt(itemPrepTime, 10) || 10,
        customizationGroups,
      });
      toast.success(`Created "${itemName}" successfully.`);
    }

    setIsItemModalOpen(false);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Category name is required.');
      return;
    }

    addCategory({
      restaurantSlug: currentRestaurant.slug,
      name: newCatName.trim(),
      description: newCatDesc.trim(),
      sortOrder: restaurantCategories.length + 1,
    });

    toast.success(`Category "${newCatName}" added.`);
    setIsCatModalOpen(false);
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleAddCustomizationGroup = () => {
    const newGroup: CustomizationGroup = {
      id: `cg-${Date.now()}`,
      name: 'Option Group (e.g. Crust / Add-ons)',
      type: 'SINGLE',
      required: false,
      options: [
        { id: `opt-${Date.now()}-1`, name: 'Standard Choice', price: 0 },
        { id: `opt-${Date.now()}-2`, name: 'Extra Upgrade', price: 2.5 },
      ],
    };
    setCustomizationGroups([...customizationGroups, newGroup]);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UtensilsCrossed className="size-6 text-amber-600" />
            <span>Menu & Categories Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure dishes, prices, customizations, and instant availability for {currentRestaurant.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCatModalOpen(true)}
            className="rounded-xl text-xs font-semibold gap-1.5"
          >
            <Layers className="size-4" />
            <span>New Category</span>
          </Button>

          <Button
            onClick={openCreateItemModal}
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold gap-1.5"
          >
            <Plus className="size-4" />
            <span>Add Menu Item</span>
          </Button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <Button
          size="sm"
          variant={selectedCategoryId === 'ALL' ? 'default' : 'outline'}
          onClick={() => setSelectedCategoryId('ALL')}
          className={`h-8 text-xs rounded-full px-3.5 ${
            selectedCategoryId === 'ALL' ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''
          }`}
        >
          All Categories ({restaurantItems.length})
        </Button>
        {restaurantCategories.map((cat) => {
          const count = restaurantItems.filter((i) => i.categoryId === cat.id).length;
          return (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`h-8 text-xs rounded-full px-3.5 ${
                selectedCategoryId === cat.id ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold' : ''
              }`}
            >
              {cat.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* Search Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-3.5 flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes by name or ingredients..."
              className="pl-9 h-9 text-xs rounded-lg"
            />
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Showing <strong>{filteredItems.length}</strong> items
          </span>
        </CardContent>
      </Card>

      {/* Menu Items Table */}
      <Card className="border border-border shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold">Item</TableHead>
              <TableHead className="text-xs font-bold">Category</TableHead>
              <TableHead className="text-xs font-bold">Price</TableHead>
              <TableHead className="text-xs font-bold">Dietary</TableHead>
              <TableHead className="text-xs font-bold">Customizations</TableHead>
              <TableHead className="text-xs font-bold">Live Availability</TableHead>
              <TableHead className="text-xs font-bold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  No dishes found in this category.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const categoryObj = restaurantCategories.find((c) => c.id === item.categoryId);
                const customGroupsCount = item.customizationGroups?.length || 0;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="size-11 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div>
                          <p className="font-bold text-sm text-foreground">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {categoryObj?.name || 'Uncategorized'}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-foreground">
                      {currentRestaurant.currency}
                      {item.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {item.isVeg ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50 gap-1">
                          <Leaf className="size-3" />
                          <span>Veg</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-stone-600 border-stone-300">
                          Non-Veg
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {customGroupsCount > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {customGroupsCount} Modifier Groups
                        </Badge>
                      ) : (
                        <span className="text-stone-400">Standard</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => {
                            toggleItemAvailability(item.id);
                            toast.success(
                              `"${item.name}" marked as ${!item.isAvailable ? 'Available' : 'Sold Out'}`
                            );
                          }}
                        />
                        <span className={`text-xs font-semibold ${item.isAvailable ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {item.isAvailable ? 'Available' : 'Sold Out'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditItemModal(item)}
                          className="size-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Dish"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            deleteMenuItem(item.id);
                            toast.success(`Deleted "${item.name}".`);
                          }}
                          className="size-8 p-0 text-muted-foreground hover:text-rose-600"
                          title="Delete Dish"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add / Edit Dish Modal */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {editingItemId ? 'Edit Menu Item' : 'Create New Menu Item'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure item pricing, photo, description, and addon customization options.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveItem} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dish Name *</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Truffle Pappardelle"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Price ({currentRestaurant.currency}) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="18.50"
                  className="h-9 text-xs rounded-lg font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category *</Label>
                <select
                  value={itemCatId}
                  onChange={(e) => setItemCatId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs"
                >
                  {restaurantCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                placeholder="Describe flavors, key ingredients, and allergens..."
                rows={2}
                className="text-xs rounded-lg resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Photo URL</Label>
              <Input
                value={itemImage}
                onChange={(e) => setItemImage(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs rounded-lg font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Vegetarian Item</p>
                  <p className="text-[10px] text-muted-foreground">Show green veg badge</p>
                </div>
                <Switch checked={itemIsVeg} onCheckedChange={setItemIsVeg} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Prep Time (mins)</Label>
                <Input
                  type="number"
                  value={itemPrepTime}
                  onChange={(e) => setItemPrepTime(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>

            {/* Customizations Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Customization & Add-on Groups
                  </h4>
                  <p className="text-[11px] text-muted-foreground">e.g. Crust style, extra cheese, spice level</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomizationGroup}
                  className="h-7 text-xs font-semibold gap-1"
                >
                  <Plus className="size-3" />
                  <span>Add Group</span>
                </Button>
              </div>

              {customizationGroups.map((group, gIdx) => (
                <div key={group.id} className="p-3 bg-muted/30 border border-border rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={group.name}
                      onChange={(e) => {
                        const updated = [...customizationGroups];
                        updated[gIdx].name = e.target.value;
                        setCustomizationGroups(updated);
                      }}
                      className="h-8 text-xs font-bold bg-background"
                      placeholder="Group Name (e.g. Crust Option)"
                    />
                    <select
                      value={group.type}
                      onChange={(e) => {
                        const updated = [...customizationGroups];
                        updated[gIdx].type = e.target.value as any;
                        setCustomizationGroups(updated);
                      }}
                      className="h-8 text-[11px] rounded-lg border border-border bg-background px-2"
                    >
                      <option value="SINGLE">Single Choice</option>
                      <option value="MULTIPLE">Multiple Selection</option>
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomizationGroups(customizationGroups.filter((_, idx) => idx !== gIdx));
                      }}
                      className="size-8 p-0 text-rose-500 hover:text-rose-700"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {/* Options */}
                  <div className="space-y-1.5 pl-2 border-l-2 border-amber-400">
                    {group.options.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <Input
                          value={opt.name}
                          onChange={(e) => {
                            const updated = [...customizationGroups];
                            updated[gIdx].options[oIdx].name = e.target.value;
                            setCustomizationGroups(updated);
                          }}
                          placeholder="Option Name"
                          className="h-7 text-xs flex-1 bg-background"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-[11px] text-muted-foreground">+${currentRestaurant.currency}</span>
                          <Input
                            type="number"
                            step="0.5"
                            value={opt.price}
                            onChange={(e) => {
                              const updated = [...customizationGroups];
                              updated[gIdx].options[oIdx].price = parseFloat(e.target.value) || 0;
                              setCustomizationGroups(updated);
                            }}
                            className="h-7 text-xs w-16 bg-background font-mono"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...customizationGroups];
                        updated[gIdx].options.push({
                          id: `opt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                          name: 'New Option',
                          price: 0,
                        });
                        setCustomizationGroups(updated);
                      }}
                      className="text-[11px] text-amber-600 hover:underline font-semibold block pt-1"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsItemModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                {editingItemId ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Category Modal */}
      <Dialog open={isCatModalOpen} onOpenChange={setIsCatModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Add Menu Category</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category Name *</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Signature Pastas"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Short Description</Label>
              <Input
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="e.g. Fresh homemade noodles with rich sauces"
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCatModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Add Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
