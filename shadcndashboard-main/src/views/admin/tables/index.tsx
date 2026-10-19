import React, { useState, useRef } from 'react';
import { Link } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { TableItem } from 'src/context/restaurant-context/types';
import api from 'src/api/api-client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Plus,
  Users,
  ExternalLink,
  Printer,
  Download,
  Trash2,
  Sparkles,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RestaurantAdminTables() {
  const { currentRestaurant, tables, addTable, updateTable, deleteTable, refreshData } = useRestaurant();
  const [selectedTableForQr, setSelectedTableForQr] = useState<TableItem | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Add Table Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');

  const printRef = useRef<HTMLDivElement>(null);

  const restaurantTables = tables.filter((t) => t.restaurantSlug === currentRestaurant.slug);

  const getTableUrl = (tableItem: TableItem) => {
    const tableSlug = tableItem.tableNumber.toLowerCase().replace(/\s+/g, '-');
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return `${window.location.origin}${base}/m/${currentRestaurant.slug}/${tableSlug}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerateQr = async () => {
    if (!selectedTableForQr) return;
    setIsRegenerating(true);
    try {
      await api.admin.regenerateTableQr(selectedTableForQr.id);
      toast.success(`Generated fresh secure QR token for ${selectedTableForQr.tableNumber}`);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || `Failed to regenerate QR token for ${selectedTableForQr.tableNumber}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      toast.error('Table number is required.');
      return;
    }

    try {
      await addTable({
        restaurantSlug: currentRestaurant.slug,
        tableNumber: newTableNumber.trim(),
        capacity: parseInt(newCapacity, 10) || 4,
        status: 'AVAILABLE',
      });
      setIsAddOpen(false);
      setNewTableNumber('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add table on server');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="size-6 text-amber-600" />
            <span>Tables & QR Code Generator</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate printable high-resolution QR codes mapped to each dining table for {currentRestaurant.name}
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold gap-1.5"
        >
          <Plus className="size-4" />
          <span>Add Dining Table</span>
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {restaurantTables.map((tbl) => {
          const tableUrl = getTableUrl(tbl);

          return (
            <Card key={tbl.id} className="border border-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/70">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-black text-foreground">{tbl.tableNumber}</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Users className="size-3 text-stone-400" />
                      <span>{tbl.capacity} Seats</span>
                    </p>
                  </div>

                  <Badge
                    className={`text-[10px] uppercase font-semibold ${
                      tbl.status === 'OCCUPIED'
                        ? 'bg-amber-500 text-white'
                        : tbl.status === 'RESERVED'
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {tbl.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="py-4 flex flex-col items-center text-center">
                {/* QR Preview Thumbnail */}
                <div
                  onClick={() => setSelectedTableForQr(tbl)}
                  className="p-3 bg-white border border-border rounded-xl cursor-pointer hover:scale-105 transition-all shadow-xs"
                >
                  <QRCodeSVG value={tableUrl} size={110} level="M" />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 font-mono truncate max-w-full px-2">
                  /m/{currentRestaurant.slug}/{tbl.tableNumber.toLowerCase().replace(/\s+/g, '-')}
                </p>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTableForQr(tbl)}
                  className="h-8 text-xs font-semibold rounded-lg flex-1 gap-1"
                >
                  <QrCode className="size-3.5 text-amber-600" />
                  <span>View Card</span>
                </Button>

                <Link to={`/m/${currentRestaurant.slug}/${tbl.tableNumber.toLowerCase().replace(/\s+/g, '-')}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground p-2">
                    <ExternalLink className="size-3.5" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteTable(tbl.id);
                    toast.success(`Removed ${tbl.tableNumber}`);
                  }}
                  className="h-8 size-8 p-0 text-muted-foreground hover:text-rose-600"
                  title="Remove Table"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* QR Code Printable Card Modal */}
      {selectedTableForQr && (
        <Dialog open={!!selectedTableForQr} onOpenChange={() => setSelectedTableForQr(null)}>
          <DialogContent className="sm:max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                Dining Table QR Stand Card
              </DialogTitle>
            </DialogHeader>

            {/* Printable Card Area */}
            <div
              ref={printRef}
              className="my-3 p-6 bg-white text-stone-900 border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center text-center shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={currentRestaurant.logoUrl}
                  alt={currentRestaurant.name}
                  className="size-8 rounded-lg object-cover"
                />
                <span className="font-black text-sm uppercase tracking-wider">{currentRestaurant.name}</span>
              </div>

              <div className="bg-amber-600 text-white font-black text-lg py-1 px-4 rounded-full mb-4 shadow-xs">
                {selectedTableForQr.tableNumber.toUpperCase()}
              </div>

              <div className="p-4 bg-white rounded-xl shadow-md border border-stone-200">
                <QRCodeSVG
                  value={getTableUrl(selectedTableForQr)}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <h4 className="font-bold text-base mt-4 text-stone-900">Scan to Order & Pay</h4>
              <p className="text-xs text-stone-500 max-w-[220px] mt-1">
                Point your phone's camera at the QR code to open the live menu and place your order.
              </p>

              <div className="mt-3 text-[10px] text-stone-400 font-mono">
                Powered by Sudarshan QR SaaS
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateQr}
                disabled={isRegenerating}
                className="text-xs font-semibold gap-1.5 flex-1"
              >
                <RefreshCw className={`size-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Rotate QR</span>
              </Button>

              <Link
                to={`/m/${currentRestaurant.slug}/${selectedTableForQr.tableNumber.toLowerCase().replace(/\s+/g, '-')}`}
                target="_blank"
                className="w-full sm:w-auto flex-1"
              >
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5">
                  <ExternalLink className="size-3.5" />
                  <span>Open Menu</span>
                </Button>
              </Link>

              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5 flex-1"
              >
                <Printer className="size-3.5" />
                <span>Print Card</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Table Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Add Dining Table</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddTable} className="space-y-3.5 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Table Label *</Label>
              <Input
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="e.g. Table 9 or Patio P3"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Seating Capacity</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>

            <DialogFooter className="mt-4 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                Generate & Save Table
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
