'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Building2,
  Share2,
  Menu,
  X,
  Pencil,
  Palette,
  LayoutGrid,
  Activity,
  Zap,
  PenTool,
  Sparkles,
  Database,
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
import { useState, useEffect } from 'react';
import { useMobile } from '@/lib/hooks/use-mobile';
import { UserUsageWidget } from './user-usage-widget';
import { CONFIG } from '@/lib/config';
import { setCredits } from '@/lib/firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
  Home,
  MessageSquare,
  Target,
  Building2,
  Library,
  Settings,
  BarChart3,
  Share2,
  Pencil,
  Palette,
  LayoutGrid,
  Activity,
  Zap,
  PenTool,
  Sparkles,
  Database,
};

import { useBranding } from '@/components/providers/branding-provider';

export function Sidebar() {
  const brandingContext = useBranding();
  const branding = brandingContext?.branding || { colors: { primary: '#10b981', secondary: '#8b5cf6' } };
  
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleReloadCredits = async () => {
    if (!user || isReloading) return;
    setIsReloading(true);
    try {
      await setCredits(user.uid, 10);
      router.refresh(); // Refresh to update state
    } catch (err) {
      console.error('Error reloading credits:', err);
    } finally {
      setIsReloading(false);
    }
  };

  // Close mobile menu on navigation
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isOpen]);

  // Get user initials
  const initials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0c] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={cn(
          'h-screen flex-col bg-background fixed left-0 top-0 z-40 overflow-y-auto scrollbar-none border-r border-white/[0.02]',
          // Desktop width
          'w-[72px] hidden md:flex',
          // Mobile drawer style
          isMobile && isOpen && '!flex w-[280px] z-50 shadow-2xl shadow-black/50'
        )}
      >
        {/* Subtle border gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.04] to-transparent" />
        
        {/* Logo Section */}
        <div className={cn(
          "flex items-center justify-center",
          isMobile ? "h-20 px-6 justify-between" : "h-[72px]"
        )}>
          <Link href="/" className="group relative flex items-center justify-center">
            <div className="relative flex h-11 w-11 items-center justify-center">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Logo container */}
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt="Agency Logo" className="h-7 w-7 object-contain" />
                ) : (
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
                )}
              </div>
            </div>
          </Link>

          {isMobile && (
            <div className="flex flex-col ml-3 mr-auto">
              <span className="text-sm font-bold text-white leading-tight">Conselho</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">de Funil</span>
            </div>
          )}

          {isMobile && (
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-zinc-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex flex-1 flex-col gap-1.5 py-4",
          isMobile ? "px-4" : "items-center px-3"
        )}>
          {NAV_ITEMS.map((item, index) => {
            const Icon = ICONS[item.icon];
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));

            const NavContent = (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0)',
                  scale: isActive ? 1 : 0.98,
                }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex items-center rounded-xl transition-all duration-300',
                  isMobile ? 'h-12 px-4 gap-4' : 'h-11 justify-center',
                  isActive && 'sidebar-icon-active'
                )}
              >
                <Icon 
                  className={cn(
                    'transition-all duration-300',
                    isMobile ? 'h-5 w-5' : 'h-[22px] w-[22px]',
                    isActive ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-500'
                  )} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {isMobile && (
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-emerald-400" : "text-zinc-400"
                  )}>
                    {item.label}
                  </span>
                )}
                {isActive && !isMobile && (
                  <div className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full" />
                )}
              </motion.div>
            );

            if (isMobile) {
              return (
                <Link key={item.id} href={item.href} className="w-full">
                  {NavContent}
                </Link>
              );
            }

            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className="w-full">
                    {NavContent}
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
        <div className={cn(
          "flex flex-col gap-3 py-4 border-t border-white/[0.04]",
          isMobile ? "px-6" : "items-center px-3"
        )}>
          {/* User Section Mobile */}
          {isMobile ? (
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 text-xs font-bold text-zinc-400 ring-1 ring-white/[0.05]">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.displayName || 'Usuário'}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <UserUsageWidget />
          )}

          {!isMobile && <div className="w-8 h-px bg-white/[0.06]" />}
          
          {/* Logout & Credits - Desktop only in this block, Mobile gets a simpler logout */}
          {isMobile ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Sair da conta</span>
            </button>
          ) : (
            <>
              {CONFIG.IS_DEV && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleReloadCredits}
                      disabled={isReloading}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200",
                        "bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20",
                        isReloading && "animate-pulse opacity-50"
                      )}
                    >
                      <RefreshCw className={cn("h-5 w-5", isReloading && "animate-spin")} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-amber-600 border-amber-500 text-white">
                    Recarregar Créditos (Dev Mode)
                  </TooltipContent>
                </Tooltip>
              )}
              <UserUsageWidget />
              <div className="w-8 h-px bg-white/[0.06]" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="sidebar-icon-container text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all"
                  >
                    <LogOut className="h-5 w-5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-900 border-zinc-800/80 text-zinc-100 text-sm font-medium px-3 py-1.5">
                  Sair
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
