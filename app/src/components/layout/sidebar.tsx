'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/constants';
import type { NavItem } from '@/lib/constants';
import { resolveIcon } from '@/lib/guards/resolve-icon';
import { SIDEBAR_ICONS } from '@/lib/icon-maps';
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  Lock,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Crown,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/stores/auth-store';
import { logout } from '@/lib/firebase/auth';
import { useMobile } from '@/lib/hooks/use-mobile';
import { getUnreadNotificationCount, markNotificationsAsRead } from '@/lib/firebase/automation';
import { useBrandStore } from '@/lib/stores/brand-store';
import { UserUsageWidget } from './user-usage-widget';
import { OnboardingChecklist } from './onboarding-checklist';
import { CONFIG } from '@/lib/config';
import { setCredits } from '@/lib/firebase/firestore';
import { useBranding } from '@/components/providers/branding-provider';
import { useTier } from '@/lib/hooks/use-tier';
import { meetsMinimumTier, getTierDisplayName } from '@/lib/tier-system';
import type { Tier } from '@/lib/tier-system';
import { toast } from 'sonner';
import { useSidebarStore } from '@/lib/stores/sidebar-store';

// ============================================
// CONSTANTS
// ============================================

export const SIDEBAR_WIDTH = {
  collapsed: 72,
  expanded: 256,
} as const;

// War Room monospace group labels
const GROUP_SHORT_LABELS: Record<string, string> = {
  main: 'PRINCIPAL',
  strategy: 'ESTRATÉGIA',
  content: 'CONTEÚDO',
  analysis: 'ANÁLISE',
  config: 'CONFIG',
};

// Validate icon mappings in dev
if (process.env.NODE_ENV !== 'production') {
  NAV_GROUPS.forEach((group) => {
    if (group.icon && !SIDEBAR_ICONS[group.icon]) {
      console.warn(`[Sidebar] Icone de grupo nao mapeado: "${group.icon}" (id: ${group.id})`);
    }
    group.items.forEach((item) => {
      if (!SIDEBAR_ICONS[item.icon]) {
        console.warn(`[Sidebar] Icone nao mapeado: "${item.icon}" (id: ${item.id})`);
      }
    });
  });
}

// ============================================
// MAIN EXPORT
// ============================================

export function Sidebar() {
  const isMobile = useMobile();

  return (
    <TooltipProvider delayDuration={0}>
      {isMobile ? <MobileSidebar /> : <DesktopSidebar />}
    </TooltipProvider>
  );
}

// ============================================
// DESKTOP SIDEBAR
// ============================================

function DesktopSidebar() {
  const { isExpanded, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 hidden h-screen flex-col md:flex',
        'bg-[#0D0B09] border-r border-white/[0.04]',
        'transition-[width] duration-200 ease-in-out'
      )}
      style={{ width: isExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed }}
    >
      {/* Gold accent edge */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-[#E6B447]/20 via-[#E6B447]/5 to-transparent" />

      <SidebarLogo expanded={isExpanded} />
      <Separator className="bg-white/[0.04]" />

      <ScrollArea className="flex-1">
        <div className="py-3">
          <SidebarNav expanded={isExpanded} />
        </div>
      </ScrollArea>

      <OnboardingChecklist isMobile={false} />
      <Separator className="bg-white/[0.04]" />

      <SidebarFooter expanded={isExpanded} />

      {/* Collapse / Expand toggle */}
      <div className="px-3 py-2 border-t border-white/[0.02]">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggle}
              className={cn(
                'flex items-center justify-center w-full rounded-lg py-2 transition-all duration-200',
                'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]',
                isExpanded && 'justify-start gap-2 px-3'
              )}
            >
              {isExpanded ? (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  <span className="text-xs font-medium">Recolher</span>
                </>
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
          </TooltipTrigger>
          {!isExpanded && (
            <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100">
              Expandir
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}

// ============================================
// MOBILE SIDEBAR (Sheet)
// ============================================

function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D0B09] border border-white/[0.08] text-zinc-400 hover:text-white transition-colors md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className={cn(
            'w-[280px] p-0 gap-0 bg-[#0D0B09] border-r border-white/[0.04]',
            'flex flex-col',
            '[&>button]:hidden' // Hide default Sheet close button
          )}
        >
          <SheetTitle className="sr-only">Menu de navegacao</SheetTitle>

          <SidebarLogo expanded onClose={() => setIsOpen(false)} />
          <Separator className="bg-white/[0.04]" />

          <ScrollArea className="flex-1">
            <div className="py-3">
              <SidebarNav expanded onNavigate={() => setIsOpen(false)} />
            </div>
          </ScrollArea>

          <OnboardingChecklist isMobile />
          <Separator className="bg-white/[0.04]" />

          <SidebarFooter expanded />
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================
// LOGO
// ============================================

function SidebarLogo({ expanded, onClose }: { expanded: boolean; onClose?: () => void }) {
  const logoUrl = useBranding()?.branding?.logoUrl;

  return (
    <div
      className={cn(
        'flex items-center h-[72px] shrink-0',
        expanded ? 'px-5 gap-3' : 'justify-center'
      )}
    >
      <Link href="/" className="group relative flex items-center shrink-0">
        <div className="relative flex h-10 w-10 items-center justify-center">
          {/* Glow */}
          <div className="absolute inset-0 rounded-xl bg-[#E6B447]/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-xl relative" />
          ) : (
            <Image
              src="/logo-mkthoney-icon.svg"
              alt="MKTHONEY"
              width={40}
              height={40}
              className="relative transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(230,180,71,0.4)]"
              priority
            />
          )}
        </div>
      </Link>

      {expanded && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-bold text-[#F5E8CE] tracking-tight leading-tight">MKTHONEY</span>
          <span className="text-[9px] font-mono text-[#AB8648] uppercase tracking-[0.2em]">
            AUTONOMOUS MKT
          </span>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors ml-auto shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// NAVIGATION
// ============================================

function SidebarNav({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { effectiveTier } = useTier();
  const { selectedBrand } = useBrandStore();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    NAV_GROUPS.map((g) => g.id)
  );

  // Notification badge
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!selectedBrand?.id) return;
    getUnreadNotificationCount(selectedBrand.id)
      .then(setUnreadCount)
      .catch(() => setUnreadCount(0));
  }, [selectedBrand?.id]);

  useEffect(() => {
    if (pathname === '/automation' && selectedBrand?.id && unreadCount > 0) {
      markNotificationsAsRead(selectedBrand.id)
        .then(() => setUnreadCount(0))
        .catch((err) => console.error('[Sidebar] Failed to mark notifications as read:', err));
    }
  }, [pathname, selectedBrand?.id, unreadCount]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <nav className={cn('flex flex-col gap-1', expanded ? 'px-3' : 'items-center px-2')}>
      {NAV_GROUPS.map((group, groupIndex) => {
        const GroupIcon = resolveIcon(SIDEBAR_ICONS, group.icon, SIDEBAR_ICONS.LayoutGrid, 'Sidebar Group');
        const isGroupExpanded = expandedGroups.includes(group.id);
        const hasActiveItem = group.items.some(
          (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        );
        const shortLabel = GROUP_SHORT_LABELS[group.id] || group.label.toUpperCase();

        return (
          <div key={group.id} className="w-full">
            {/* Separator between groups */}
            {groupIndex > 0 && <Separator className="my-2 bg-white/[0.03]" />}

            {/* Group header */}
            {expanded ? (
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'flex items-center justify-between w-full px-2 py-1.5 mb-0.5 rounded-md',
                  'text-[10px] font-mono font-bold uppercase tracking-[0.15em]',
                  'transition-colors duration-150',
                  hasActiveItem ? 'text-[#E6B447]/60' : 'text-zinc-600 hover:text-zinc-500'
                )}
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-3 w-3" />
                  <span>{shortLabel}</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    !isGroupExpanded && '-rotate-90'
                  )}
                />
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex items-center justify-center w-full py-1.5 mb-0.5',
                      hasActiveItem ? 'text-[#E6B447]/40' : 'text-zinc-700'
                    )}
                  >
                    <GroupIcon className="h-3.5 w-3.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100 text-xs">
                  {group.label}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Group items */}
            {(isGroupExpanded || !expanded) && (
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    expanded={expanded}
                    pathname={pathname}
                    effectiveTier={effectiveTier}
                    unreadCount={item.href === '/automation' ? unreadCount : 0}
                    router={router}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ============================================
// NAV ITEM
// ============================================

function SidebarNavItem({
  item,
  expanded,
  pathname,
  effectiveTier,
  unreadCount,
  router,
  onNavigate,
}: {
  item: NavItem;
  expanded: boolean;
  pathname: string;
  effectiveTier: Tier;
  unreadCount: number;
  router: ReturnType<typeof useRouter>;
  onNavigate?: () => void;
}) {
  const Icon = resolveIcon(SIDEBAR_ICONS, item.icon, SIDEBAR_ICONS.Home, 'Sidebar');
  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

  const minTier: Tier = item.minTier || 'starter';
  const hasAccess = meetsMinimumTier(effectiveTier, minTier);
  const isLocked = !hasAccess;
  const isComingSoon = item.comingSoon || false;

  const handleLockedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComingSoon) {
      toast.info('Em Breve', {
        description: `${item.label} estara disponivel em breve.`,
      });
    } else {
      toast.info(`Disponivel no ${getTierDisplayName(minTier)}`, {
        description: `Faca upgrade para acessar ${item.label}.`,
        action: {
          label: 'Ver planos',
          onClick: () => router.push('/settings?tab=billing'),
        },
      });
    }
  };

  // Shared icon + label content
  const content = (
    <div
      className={cn(
        'relative flex items-center rounded-lg transition-all duration-200',
        expanded ? 'h-9 px-2.5 gap-3 w-full' : 'h-10 w-10 justify-center',
        isActive && !isLocked && 'bg-[#E6B447]/[0.08]',
        !isActive && !isLocked && 'hover:bg-white/[0.03]',
        isLocked && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Active indicator bar */}
      {isActive && !isLocked && (
        <div className="absolute left-0 w-[3px] h-5 bg-[#E6B447] rounded-r-full" />
      )}

      <Icon
        className={cn(
          'shrink-0 transition-all duration-200',
          expanded ? 'h-[18px] w-[18px]' : 'h-5 w-5',
          isActive && !isLocked
            ? 'text-[#E6B447] drop-shadow-[0_0_8px_rgba(230,180,71,0.5)]'
            : 'text-zinc-500',
          isLocked && 'text-zinc-700'
        )}
        strokeWidth={isActive && !isLocked ? 2 : 1.5}
      />

      {/* Label */}
      {expanded && (
        <span
          className={cn(
            'text-[13px] font-medium truncate flex-1',
            isActive && !isLocked ? 'text-[#E6B447]' : 'text-zinc-400',
            isLocked && 'text-zinc-700'
          )}
        >
          {item.label}
        </span>
      )}

      {/* Lock badge */}
      {isLocked && !expanded && (
        <div className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700/50">
          {isComingSoon ? (
            <Clock className="h-2 w-2 text-zinc-600" />
          ) : (
            <Lock className="h-2 w-2 text-zinc-600" />
          )}
        </div>
      )}
      {isLocked && expanded && (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800/80 border border-zinc-700/50 shrink-0">
          {isComingSoon ? (
            <Clock className="h-2.5 w-2.5 text-zinc-600" />
          ) : (
            <Lock className="h-2.5 w-2.5 text-zinc-600" />
          )}
        </div>
      )}

      {/* Notification badge */}
      {unreadCount > 0 && !isLocked && !expanded && (
        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0D0B09]" />
      )}
      {unreadCount > 0 && !isLocked && expanded && (
        <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-mono font-bold shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );

  // Locked → button with toast
  if (isLocked) {
    if (expanded) {
      return (
        <button onClick={handleLockedClick} className="w-full text-left">
          {content}
        </button>
      );
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={handleLockedClick} className="w-full">
            {content}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="bg-zinc-900 border-zinc-800 text-zinc-100 text-sm px-3 py-1.5"
        >
          <div className="flex items-center gap-2">
            {isComingSoon ? (
              <>
                <Clock className="h-3 w-3 text-zinc-400" />
                <span>{item.label} - Em Breve</span>
              </>
            ) : (
              <>
                <Lock className="h-3 w-3 text-zinc-400" />
                <span>Disponivel no {getTierDisplayName(minTier)}</span>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Normal → Link
  if (expanded) {
    return (
      <Link href={item.href} onClick={onNavigate} className="w-full">
        {content}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href} onClick={onNavigate} className="w-full">
          {content}
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="bg-zinc-900 border-zinc-800 text-zinc-100 text-sm font-medium px-3 py-1.5"
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================
// FOOTER (User, Tier, Credits, Logout)
// ============================================

function SidebarFooter({ expanded }: { expanded: boolean }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { effectiveTier, isTrial, trialDaysRemaining, tierDisplayName } = useTier();
  const [isReloading, setIsReloading] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleReloadCredits = async () => {
    if (!user || isReloading) return;
    setIsReloading(true);
    try {
      await setCredits(user.uid, 10);
      router.refresh();
    } catch (err) {
      console.error('Error reloading credits:', err);
    } finally {
      setIsReloading(false);
    }
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0].toUpperCase() || 'U';

  return (
    <div className={cn('flex flex-col gap-2 py-3', expanded ? 'px-4' : 'items-center px-2')}>
      {/* User */}
      {expanded ? (
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1A1612] to-[#241F19] text-[11px] font-bold text-[#AB8648] ring-1 ring-white/[0.06] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#F5E8CE] truncate">
              {user?.displayName || 'Usuario'}
            </p>
            <p className="text-[10px] text-zinc-600 truncate font-mono">{user?.email}</p>
          </div>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A1612] to-[#241F19] text-[11px] font-bold text-[#AB8648] ring-1 ring-white/[0.06] cursor-help">
              {initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <div>
              <p className="font-medium">{user?.displayName || 'Usuario'}</p>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Tier badge */}
      <TierBadge
        expanded={expanded}
        tier={effectiveTier}
        isTrial={isTrial}
        daysRemaining={trialDaysRemaining}
        displayName={tierDisplayName}
      />

      {/* Usage */}
      <UserUsageWidget />

      {/* Dev: reload credits */}
      {CONFIG.IS_DEV && (
        expanded ? (
          <button
            onClick={handleReloadCredits}
            disabled={isReloading}
            className={cn(
              'flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-xs transition-all',
              'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20',
              isReloading && 'animate-pulse opacity-50'
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isReloading && 'animate-spin')} />
            <span className="font-mono">Reload Credits</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleReloadCredits}
                disabled={isReloading}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-all',
                  'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20',
                  isReloading && 'animate-pulse opacity-50'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isReloading && 'animate-spin')} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-amber-600 border-amber-500 text-white">
              Recarregar Creditos (Dev)
            </TooltipContent>
          </Tooltip>
        )
      )}

      {/* Logout */}
      {expanded ? (
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sair</span>
        </button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100">
            Sair
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ============================================
// TIER BADGE
// ============================================

function TierBadge({
  expanded,
  tier,
  isTrial,
  daysRemaining,
  displayName,
}: {
  expanded: boolean;
  tier: Tier;
  isTrial: boolean;
  daysRemaining: number;
  displayName: string;
}) {
  const tierStyles: Record<string, string> = {
    free: 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50',
    trial: 'bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20',
    starter: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50',
    pro: 'bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/20 shadow-[0_0_10px_-3px_rgba(230,180,71,0.15)]',
    agency: 'bg-[#E6B447]/15 text-[#E6B447] border-[#E6B447]/25 shadow-[0_0_12px_-3px_rgba(230,180,71,0.2)]',
  };

  const style = tierStyles[tier] || tierStyles.free;
  const label = isTrial ? `Trial · ${daysRemaining}d` : displayName;

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md border text-[8px] font-bold mx-auto',
              style
            )}
          >
            {isTrial ? (
              <span className="font-mono">{daysRemaining}</span>
            ) : (
              <Crown className="h-3 w-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100">
          Plano: {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5', style)}>
      <Crown className="h-3 w-3 shrink-0" />
      <span className="text-[11px] font-bold font-mono uppercase tracking-wider">{label}</span>
    </div>
  );
}
