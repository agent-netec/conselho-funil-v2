'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  AlertTriangle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore, type Notification, type NotificationType } from '@/lib/stores/notification-store';
import { Button } from './button';

const ICONS: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<NotificationType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-400',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
  },
};

function ToastItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotificationStore();
  const Icon = ICONS[notification.type];
  const colors = COLORS[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm',
        'shadow-lg shadow-black/20',
        colors.bg,
        colors.border
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', colors.icon)} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm">{notification.title}</p>
        {notification.message && (
          <p className="text-sm text-zinc-400 mt-0.5">{notification.message}</p>
        )}
        {notification.action && (
          <Button
            size="sm"
            variant="ghost"
            className={cn('mt-2 h-7 px-2 text-xs', colors.icon)}
            onClick={notification.action.onClick}
          >
            {notification.action.label}
          </Button>
        )}
      </div>
      
      <button
        onClick={() => removeNotification(notification.id)}
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastNotifications() {
  const { notifications } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <ToastItem notification={notification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}



