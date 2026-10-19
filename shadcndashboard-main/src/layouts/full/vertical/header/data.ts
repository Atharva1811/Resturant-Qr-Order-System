import { LucideIcon, Wifi, ChefHat, CheckCircle2 } from 'lucide-react';

export interface NotificationType {
  id: string;
  title: string;
  icon: LucideIcon;
  subtitle: string;
  bgcolor: string;
  color: string;
  time: string;
  isRead?: boolean;
}

export const initialNotifications: NotificationType[] = [
  {
    id: 'notif-1',
    icon: Wifi,
    bgcolor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    color: 'text-emerald-600 dark:text-emerald-400',
    title: 'Live Order Engine Active',
    subtitle: 'Socket.IO connected for instant customer orders',
    time: 'Now',
    isRead: false,
  },
  {
    id: 'notif-2',
    icon: ChefHat,
    bgcolor: 'bg-amber-500/10 dark:bg-amber-500/20',
    color: 'text-amber-600 dark:text-amber-400',
    title: 'Kitchen Display Ready',
    subtitle: 'KDS operational for kitchen and barista staff',
    time: 'Online',
    isRead: false,
  },
  {
    id: 'notif-3',
    icon: CheckCircle2,
    bgcolor: 'bg-blue-500/10 dark:bg-blue-500/20',
    color: 'text-blue-600 dark:text-blue-400',
    title: 'PostgreSQL Sync Active',
    subtitle: 'Tenant records and menus up to date',
    time: 'Sync',
    isRead: true,
  },
];
