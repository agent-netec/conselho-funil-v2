'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { sendEmailVerification } from '@/lib/firebase/auth';
import Link from 'next/link';
import Image from 'next/image';

type ActionStatus = 'loading' | 'success' | 'error' | 'reset-form' | 'reset-success';

export default function AuthActionPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [status, setStatus] = useState<ActionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');

  // Reset password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!oobCode || !auth) {
      setStatus('error');
      setErrorMessage('Link inválido ou expirado.');
      return;
    }

    if (mode === 'verifyEmail') {
      handleVerifyEmail(oobCode);
    } else if (mode === 'resetPassword') {
      handleVerifyResetCode(oobCode);
    } else {
      setStatus('error');
      setErrorMessage('Ação não reconhecida.');
    }
  }, [mode, oobCode]);

  async function handleVerifyEmail(code: string) {
    try {
      await applyActionCode(auth!, code);
      // Reload current user to update emailVerified
      if (auth?.currentUser) {
        await auth.currentUser.reload();
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Link expirado ou já utilizado.');
    }
  }

  async function handleVerifyResetCode(code: string) {
    try {
      const userEmail = await verifyPasswordResetCode(auth!, code);
      setEmail(userEmail);
      setStatus('reset-form');
    } catch {
      setStatus('error');
      setErrorMessage('Link de redefinição expirado. Solicite um novo.');
    }
  }

  async function handleResetPassword() {
    if (!oobCode) return;

    // Validation
    if (newPassword.length < 8) {
      setErrorMessage('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMessage('A senha deve conter pelo menos 1 letra maiúscula.');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setErrorMessage('A senha deve conter pelo menos 1 número.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await confirmPasswordReset(auth!, oobCode, newPassword);
      setStatus('reset-success');
    } catch {
      setErrorMessage('Erro ao redefinir senha. Link pode ter expirado.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (resendCooldown > 0) return;
    try {
      await sendEmailVerification();
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-mkthoney-icon.svg"
            alt="MKTHONEY"
            width={32}
            height={46}
            priority
            className="h-10 w-auto opacity-60"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#1A1612]/80 p-8">
          {/* Loading */}
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 text-[#E6B447] animate-spin" />
              <p className="text-sm text-zinc-400">Processando...</p>
            </div>
          )}

          {/* Verify Email - Success */}
          {status === 'success' && mode === 'verifyEmail' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6B447]/10">
                <CheckCircle className="h-7 w-7 text-[#E6B447]" />
              </div>
              <h1 className="text-xl font-bold text-white">
                Email verificado com sucesso!
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Sua conta está ativa. Você já pode usar todos os recursos.
              </p>
              <Link
                href="/"
                className="mt-4 w-full rounded-xl bg-[#E6B447] px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C]"
              >
                Ir para o Dashboard
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">
                {mode === 'resetPassword'
                  ? 'Link de redefinição expirado'
                  : 'Link expirado ou inválido'}
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {errorMessage}
              </p>

              <div className="mt-4 flex w-full flex-col gap-3">
                {mode === 'verifyEmail' && (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0}
                    className="w-full rounded-xl bg-[#E6B447] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C] disabled:opacity-50"
                  >
                    {resendCooldown > 0
                      ? `Reenviar em ${resendCooldown}s`
                      : 'Reenviar verificação'}
                  </button>
                )}
                <Link
                  href="/login"
                  className="w-full rounded-xl border border-white/[0.06] px-6 py-3 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/[0.04]"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>
          )}

          {/* Reset Password - Form */}
          {status === 'reset-form' && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6B447]/10">
                  <Lock className="h-7 w-7 text-[#E6B447]" />
                </div>
                <h1 className="text-xl font-bold text-white">
                  Redefinir senha
                </h1>
                <p className="text-sm text-zinc-400">
                  Defina uma nova senha para <span className="text-zinc-300">{email}</span>
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 pr-10 text-sm text-white placeholder:text-zinc-600 focus:border-[#E6B447]/30 focus:outline-none focus:ring-1 focus:ring-[#E6B447]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar senha"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#E6B447]/30 focus:outline-none focus:ring-1 focus:ring-[#E6B447]/20"
                />
              </div>

              <div className="text-[11px] text-zinc-600 space-y-1">
                <p className={newPassword.length >= 8 ? 'text-[#E6B447]' : ''}>
                  {newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                </p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-[#E6B447]' : ''}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'} 1 letra maiúscula
                </p>
                <p className={/\d/.test(newPassword) ? 'text-[#E6B447]' : ''}>
                  {/\d/.test(newPassword) ? '✓' : '○'} 1 número
                </p>
              </div>

              <button
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#E6B447] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </div>
          )}

          {/* Reset Password - Success */}
          {status === 'reset-success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E6B447]/10">
                <CheckCircle className="h-7 w-7 text-[#E6B447]" />
              </div>
              <h1 className="text-xl font-bold text-white">
                Senha redefinida!
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Faça login com sua nova senha.
              </p>
              <Link
                href="/login"
                className="mt-4 w-full rounded-xl bg-[#E6B447] px-6 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-[#F0C35C]"
              >
                Ir para o login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
