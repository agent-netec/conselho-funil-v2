'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';

interface OnboardingTransitionProps {
  onComplete?: () => void;
}

export function OnboardingTransition({ onComplete }: OnboardingTransitionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3500;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);

    // Sprint R2.2: Add ?from=onboarding to trigger proactive verdict
    const redirectTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
      router.push('/chat?from=onboarding');
    }, 3500);

    return () => {
      clearTimeout(redirectTimer);
    };
  }, [router, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0B09]"
    >
      {/* Radial gold glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06)_0%,transparent_60%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Pulsing icon with glow */}
        <motion.div
          className="relative mb-8"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Outer glow */}
          <div
            className="absolute rounded-full bg-[#E6B447]/10 blur-xl animate-pulse"
            style={{ width: 120, height: 120, top: -20, left: -20 }}
          />
          {/* Inner glow */}
          <div
            className="absolute rounded-full bg-[#E6B447]/5 blur-md"
            style={{ width: 100, height: 100, top: -10, left: -10 }}
          />

          {/* Main icon */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E6B447] to-[#AB8648] shadow-lg shadow-[#E6B447]/20">
            <Brain className="h-10 w-10 text-[#0D0B09]" />
          </div>
        </motion.div>

        {/* Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-bold text-[#F5E8CE] mb-3"
        >
          Analisando sua marca...
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#CAB792] text-sm sm:text-base mb-8 max-w-md"
        >
          Preparando seu veredito estrategico personalizado
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-xs"
        >
          <div className="h-1.5 w-full rounded-full bg-[#241F19] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E6B447] to-[#AB8648] rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#6B5D4A] mt-2 font-mono tabular-nums">
            {Math.round(progress)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
