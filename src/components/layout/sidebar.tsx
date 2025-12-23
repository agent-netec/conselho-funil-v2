'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import {
  Home,
  MessageSquare,
  Target,
  Library,
  Settings,
  LogOut,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/stores/auth-store';
import { logout } from '@/lib/firebase/auth';

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
  Home,
  MessageSquare,
  Target,
  Library,
  Settings,
  BarChart3,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col bg-[#0a0a0c]">
        {/* Subtle border gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />
        
        {/* Logo */}
        <div className="flex h-[72px] items-center justify-center">
          <Link href="/" className="group relative flex items-center justify-center">
            <div className="relative flex h-11 w-11 items-center justify-center">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Logo container */}
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-1.5 px-3 py-4">
          {NAV_ITEMS.map((item, index) => {
            const Icon = ICONS[item.icon];
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className="relative w-full"
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      }}
                      whileHover={{
                        backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'flex h-11 w-full items-center justify-center rounded-xl transition-colors relative',
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-emerald-500"
                          style={{ marginLeft: -12 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      
                      <Icon className={cn(
                        'h-5 w-5 transition-colors duration-200',
                        isActive ? 'text-emerald-400' : 'text-zinc-500'
                      )} />
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  sideOffset={12}
                  className="bg-zinc-900 border-zinc-800/80 text-zinc-100 text-sm font-medium px-3 py-1.5"
                >
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-3 px-3 py-4">
          {/* Divider */}
          <div className="w-8 h-px bg-white/[0.06]" />
          
          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex h-11 w-full items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={12}
              className="bg-zinc-900 border-zinc-800/80 text-zinc-100 text-sm font-medium px-3 py-1.5"
            >
              Sair
            </TooltipContent>
          </Tooltip>

          {/* User avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings" className="group relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-sm font-medium text-zinc-200 ring-2 ring-transparent group-hover:ring-emerald-500/30 transition-all duration-200">
                  {initials}
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a0a0c]" />
              </Link>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={12}
              className="bg-zinc-900 border-zinc-800/80 text-zinc-100 text-sm font-medium px-3 py-1.5"
            >
              Minha Conta
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
