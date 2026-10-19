import { LucideIcon } from "lucide-react";
import {
  House,
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  Users,
  BarChart3,
  Settings,
  ChefHat,
  ShieldCheck,
  Building2,
  Smartphone,
} from "lucide-react";

export interface ChildItem {
  id?: number | string;
  name: string;
  icon?: LucideIcon;
  items?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  badgeContent?: string;
  isActive?: boolean;
  external?: boolean;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: LucideIcon;
  id?: number | string;
  to?: string;
  item?: MenuItem[];
  items?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  badgeContent?: string;
  isActive?: boolean;
  isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
  {
    heading: "Restaurant Admin",
    items: [
      {
        id: "admin-overview",
        name: "Dashboard Overview",
        icon: House,
        url: "/admin/dashboard",
      },
      {
        id: "admin-orders",
        name: "Orders Management",
        icon: ShoppingBag,
        url: "/admin/orders",
      },
      {
        id: "admin-menu",
        name: "Menu & Categories",
        icon: UtensilsCrossed,
        url: "/admin/menu",
      },
      {
        id: "admin-tables",
        name: "Tables & QR Codes",
        icon: QrCode,
        url: "/admin/tables",
      },
      {
        id: "admin-staff",
        name: "Staff & Roles",
        icon: Users,
        url: "/admin/staff",
      },
      {
        id: "admin-analytics",
        name: "Sales Analytics",
        icon: BarChart3,
        url: "/admin/analytics",
      },
      {
        id: "admin-settings",
        name: "Restaurant Settings",
        icon: Settings,
        url: "/admin/settings",
      },
    ],
  },
  {
    heading: "Operations",
    items: [
      {
        id: "ops-kds",
        name: "Kitchen Display (KDS)",
        icon: ChefHat,
        url: "/kitchen/orders",
      },
    ],
  },
  {
    heading: "Platform Superadmin",
    items: [
      {
        id: "superadmin-overview",
        name: "Platform Overview",
        icon: ShieldCheck,
        url: "/superadmin",
      },
      {
        id: "superadmin-restaurants",
        name: "Tenants Directory",
        icon: Building2,
        url: "/superadmin/restaurants",
      },
    ],
  },
  {
    heading: "Customer Experience",
    items: [
      {
        id: "customer-preview",
        name: "Live Table Menu (T4)",
        icon: Smartphone,
        url: "/m/rustic-hearth/table-4",
      },
    ],
  },
];

export default SidebarContent;
