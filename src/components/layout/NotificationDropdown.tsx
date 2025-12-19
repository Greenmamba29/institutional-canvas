import { Link } from "react-router-dom";
import { useNotifications, Notification } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-info bg-info/10',
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  error: 'text-destructive bg-destructive/10',
};

function NotificationItem({ notification, onMarkRead, onRemove }: { 
  notification: Notification; 
  onMarkRead: () => void;
  onRemove: () => void;
}) {
  const Icon = typeIcons[notification.type];
  
  return (
    <div className={cn(
      "p-3 border-b border-border/50 hover:bg-secondary/50 transition-colors",
      !notification.read && "bg-primary/5"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", typeColors[notification.type])}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
              {notification.title}
            </p>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-2 mt-2">
            {notification.action && (
              <Link to={notification.action.href}>
                <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">
                  {notification.action.label}
                </Button>
              </Link>
            )}
            {!notification.read && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] px-2"
                onClick={onMarkRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
                onRemove={() => removeNotification(notification.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>
        
        <div className="p-2 border-t border-border/50">
          <Link to="/settings">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Notification Settings
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
