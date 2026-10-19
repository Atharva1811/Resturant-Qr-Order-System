

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "src/components/ui/sheet";
import { Avatar, AvatarFallback } from "src/components/ui/avatar";
import { Button } from "src/components/ui/button";
import { Icon } from "@iconify/react";
import { cn } from "src/lib/utils";
import { Link, useNavigate } from "react-router";
import { useRestaurant } from "src/context/restaurant-context/RestaurantContext";
import api from "src/api/api-client";
import { toast } from "sonner";
import { BRAND_CONFIG } from "src/config/brand.config";
import { Settings, ShoppingBag, QrCode, Shield, LogOut, Store } from "lucide-react";

export default function ProfileSheet() {
  const { currentRestaurant, activeRole } = useRestaurant();
  const navigate = useNavigate();

  const handleLogout = () => {
    api.auth.logout();
    toast.success("Successfully logged out");
    navigate("/login");
  };

  const navItems = [
    {
      title: "Store Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      title: "Active Orders",
      href: "/admin/orders",
      icon: ShoppingBag,
    },
    {
      title: "Tables & QR Codes",
      href: "/admin/tables",
      icon: QrCode,
    },
    ...(activeRole === 'SUPERADMIN' ? [
      {
        title: "Platform Superadmin",
        href: "/superadmin",
        icon: Shield,
      }
    ] : [])
  ];

  return (
    <Sheet>
      {/* Trigger Button */}
      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">
        <Avatar className="h-8 w-8 bg-primary/10 text-primary border border-primary/20">
          <AvatarFallback className="font-semibold text-xs">
            {currentRestaurant?.name?.substring(0, 2).toUpperCase() || 'SV'}
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>

      {/* Drawer Panel */}
      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >
        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full">
          <Icon icon="tabler:x" width={20} height={20} />
        </SheetClose>

        {/* Top Profile Section */}
        <div className="p-6 py-6">
          <div className="flex flex-col gap-3 justify-center items-center pt-8">
            <Avatar className="h-16 w-16 bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-md">
              <AvatarFallback className="text-lg font-bold">
                {currentRestaurant?.name?.substring(0, 2).toUpperCase() || 'SV'}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h6 className="text-base font-bold text-foreground">
                {currentRestaurant?.name || BRAND_CONFIG.name}
              </h6>
              <div className="flex items-center gap-1.5 justify-center mt-1">
                <Store size={14} className="text-primary" />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="border-t border-border">
          <ul className="flex flex-col gap-1.5 p-6">
            {navItems.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 pb-6 mt-auto">
          <div className="border-t border-border w-full pt-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
