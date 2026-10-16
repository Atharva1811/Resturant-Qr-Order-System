import React, { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useRestaurant } from 'src/context/restaurant-context/RestaurantContext';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import {
  ShieldCheck,
  UtensilsCrossed,
  ChefHat,
  Smartphone,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const DemoNavBanner: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { currentRestaurant, resetToInitialData, orders } = useRestaurant();

  const handleReset = () => {
    resetToInitialData();
    toast.success('Demo data restored to initial baseline.');
  };

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'NEW' || o.status === 'ACCEPTED' || o.status === 'PREPARING'
  ).length;

  if (isCollapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in">
        <Button
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-xl rounded-full px-4 py-2 flex items-center gap-2 border border-amber-500/30 text-xs font-medium"
        >
          <Sparkles className="size-3.5 text-amber-200" />
          <span>Demo Role Switcher</span>
          <ChevronUp className="size-3.5 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Demo environment switcher"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-stone-900/95 text-stone-100 backdrop-blur-md rounded-2xl border border-stone-700/60 shadow-2xl p-2.5 px-3 md:px-4 text-xs transition-all animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-stone-200 tracking-tight">Phase 1 Demo</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-stone-700 text-stone-400 bg-stone-800/60">
              Mock Data
            </Badge>
          </div>
          <span className="text-stone-500 hidden sm:inline">•</span>
          <span className="text-stone-400 truncate max-w-[160px] hidden md:inline">
            {currentRestaurant.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="sm:hidden text-stone-400 hover:text-stone-200 h-6 w-6 p-0"
            title="Minimize"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>

        {/* Roles links */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center w-full sm:w-auto">
          <Link to="/superadmin">
            <Button
              size="sm"
              variant={location.pathname.startsWith('/superadmin') ? 'default' : 'ghost'}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                location.pathname.startsWith('/superadmin')
                  ? 'bg-purple-600 hover:bg-purple-700 text-white font-medium'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ShieldCheck className="size-3.5" />
              <span>Superadmin</span>
            </Button>
          </Link>

          <Link to="/admin/dashboard">
            <Button
              size="sm"
              variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <UtensilsCrossed className="size-3.5" />
              <span>Admin</span>
            </Button>
          </Link>

          <Link to="/kitchen/orders">
            <Button
              size="sm"
              variant={location.pathname.startsWith('/kitchen') ? 'default' : 'ghost'}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                location.pathname.startsWith('/kitchen')
                  ? 'bg-rose-600 hover:bg-rose-700 text-white font-medium'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <ChefHat className="size-3.5" />
              <span>Kitchen KDS</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingOrdersCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to="/m/rustic-hearth/table-4">
            <Button
              size="sm"
              variant={location.pathname.startsWith('/m/') ? 'default' : 'ghost'}
              className={`h-7 px-2.5 rounded-lg text-xs gap-1.5 ${
                location.pathname.startsWith('/m/')
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Customer (Table 4)</span>
              <ExternalLink className="size-3 opacity-60 ml-0.5" />
            </Button>
          </Link>
        </div>

        {/* Action icons */}
        <div className="hidden sm:flex items-center gap-1 border-l border-stone-800 pl-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="Reset to fresh demo data"
            className="text-stone-400 hover:text-amber-400 hover:bg-stone-800 h-7 px-2 text-xs gap-1"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden lg:inline text-[11px]">Reset Data</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="text-stone-400 hover:text-stone-200 h-7 w-7 p-0"
            title="Minimize"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};
