'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Brain } from 'lucide-react';

// Generate particles for background animation
const particles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 3 + 2,
  delay: Math.random() * 2,
}));

interface OnboardingTransitionProps {
  onComplete?: () => void;
}

export function OnboardingTransition({ onComplete }: OnboardingTransitionProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar over 3.5 seconds
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

    // Redirect after 3.5 seconds
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
    >
      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-emerald-500/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-emerald-900/20 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        {/* Pulsing icon */}
        <motion.div
          className="relative mb-8"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Glow rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/30 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: 120, height: 120, margin: -20 }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md"
            animate={{
              scale: [1.1, 1.4, 1.1],
              opacity: [0.2, 0.05, 0.2],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
            style={{ width: 120, height: 120, margin: -20 }}
          />

          {/* Main icon container */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <Brain className="h-10 w-10 text-white" />
          </div>
        </motion.div>

        {/* Main text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-3"
        >
          Seu Conselho está analisando sua marca...
        </motion.h2>

        {/* Secondary text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-400 text-sm sm:text-base mb-8 max-w-md"
        >
          Preparando seu veredito estratégico personalizado
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-xs"
        >
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            {Math.round(progress)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
