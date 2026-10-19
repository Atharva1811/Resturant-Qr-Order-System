import { useState } from 'react';
import { initialNotifications, NotificationType } from './data';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { cn } from 'src/lib/utils';

const Notifications = ({ className }: { className?: string }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>(initialNotifications);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <div className={cn('', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="relative cursor-pointer">
            {unreadCount > 0 && (
              <>
                <span className="h-2.5 w-2.5 bg-amber-600 rounded-full absolute top-1 end-2 text-xs text-center text-white z-1 animate-ping" />
                <span className="h-2.5 w-2.5 bg-amber-600 rounded-full absolute top-1 end-2 text-xs text-center text-white z-1" />
              </>
            )}
            <div className="flex justify-center items-center hover:bg-primary/5 w-10 h-10 rounded-full">
              <Bell className="size-5" />
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-screen sm:w-[360px] py-4 px-0">
          <div className="flex items-center px-5 justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 ? (
                <Badge className="px-2 py-0 text-[10px] bg-amber-600 hover:bg-amber-700 text-white">
                  {unreadCount} new
                </Badge>
              ) : (
                <Badge variant="outline" className="px-2 py-0 text-[10px] text-muted-foreground">
                  Up to date
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              >
                <CheckCheck className="size-3.5" />
                <span>Mark all read</span>
              </Button>
            )}
          </div>

          {/* List or Empty State */}
          <SimpleBar className="max-h-72 mt-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <Inbox className="size-8 mx-auto stroke-1" />
                <p className="text-xs">No active notifications</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border/40">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id)}
                    className={cn(
                      'px-5 py-3 flex justify-between items-center hover:bg-primary/5 cursor-pointer transition-colors',
                      !item.isRead && 'bg-amber-500/5'
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div
                        className={cn(
                          'h-9 w-9 shrink-0 rounded-xl flex justify-center items-center',
                          item.bgcolor
                        )}
                      >
                        <item.icon className={cn('size-4', item.color)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5
                            className={cn(
                              'text-xs truncate',
                              item.isRead ? 'font-normal text-muted-foreground' : 'font-bold text-foreground'
                            )}
                          >
                            {item.title}
                          </h5>
                          <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SimpleBar>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Notifications;
