'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if the current viewport is mobile
 * Breakpoint: 768px (md in Tailwind)
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Return false during SSR to prevent hydration mismatch
  if (!mounted) return false;
  
  return isMobile;
}

