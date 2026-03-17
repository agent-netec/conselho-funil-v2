'use client';
import { Suspense, useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithEmail, sendPasswordReset, signInWithGoogle } from '@/lib/firebase/auth';
import { useAuthStore } from '@/lib/stores/auth-store';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
  type IconConfig,
} from '@/components/ui/modern-animated-sign-in';
import {
  Target, BarChart3, Megaphone, Users, TrendingUp,
  Zap, PieChart, Mail, Rocket
} from 'lucide-react';

const iconsArray: IconConfig[] = [
  {
    component: () => <Target className="size-[30px] text-[#E6B447]" />,
    radius: 100, duration: 20, delay: 20, reverse: false, path: false,
  },
  {
    component: () => <BarChart3 className="size-[30px] text-[#AB8648]" />,
    radius: 100, duration: 20, delay: 10, reverse: false, path: false,
  },
  {
    component: () => <Megaphone className="size-[50px] text-[#E6B447]" />,
    radius: 210, duration: 20, delay: 0, reverse: false, path: false,
  },
  {
    component: () => <Users className="size-[50px] text-[#F0C35C]" />,
    radius: 210, duration: 20, delay: 20, reverse: false, path: false,
  },
  {
    component: () => <TrendingUp className="size-[30px] text-[#E6B447]" />,
    radius: 150, duration: 20, delay: 20, reverse: true, path: false,
  },
  {
    component: () => <Zap className="size-[30px] text-[#AB8648]" />,
    radius: 150, duration: 20, delay: 10, reverse: true, path: false,
  },
  {
    component: () => <PieChart className="size-[50px] text-[#F0C35C]" />,
    radius: 270, duration: 20, delay: 0, reverse: true, path: false,
  },
  {
    component: () => <Mail className="size-[50px] text-[#E6B447]" />,
    radius: 270, duration: 20, delay: 60, reverse: true, path: false,
  },
  {
    component: () => <Rocket className="size-[30px] text-[#E6B447]" />,
    radius: 320, duration: 20, delay: 20, reverse: false, path: false,
  },
];

type FormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0B09]" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { user, isInitialized } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect to dashboard when auth-store publishes the user
  // (this handles the case where router.push('/') fires before the 300ms delay completes)
  useEffect(() => {
    if (isInitialized && user) {
      router.push(redirectTo);
    }
  }, [user, isInitialized, router, redirectTo]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    setFormData((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(formData.email, formData.password);
      // Navigation handled by the auth-state useEffect above
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuario nao encontrado');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      }
      // On success: navigation handled by the auth-state useEffect above
    } catch {
      setError('Erro ao conectar com Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoToSignup = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const redirect = searchParams.get('redirect');
    router.push(redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup');
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Digite seu email primeiro para recuperar a senha');
      return;
    }
    try {
      await sendPasswordReset(formData.email);
      setError('');
      setSuccess('Email de recuperacao enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Email nao encontrado');
      } else {
        setError('Erro ao enviar email de recuperacao');
      }
    }
  };

  const formFields = {
    header: 'Bem-vindo ao MKTHONEY',
    subHeader: 'Acesse sua central estrategica',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as const,
        placeholder: 'seu@email.com',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Senha',
        required: true,
        type: 'password' as const,
        placeholder: 'Sua senha segura',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: isLoading ? 'Autenticando...' : 'Acessar Comando',
    textVariantButton: 'Nao tem conta? Criar agora',
    errorField: error,
    successField: success,
    secondaryLinkText: 'Esqueci minha senha',
    onSecondaryLink: handleForgotPassword,
    onGoogleSignIn: handleGoogleSignIn,
    googleLoading,
  };

  return (
    <section className="flex max-lg:justify-center min-h-screen bg-[#0D0B09] overflow-hidden">
      {/* Left — Orbit showcase */}
      <div className="flex flex-col justify-center w-1/2 max-lg:hidden relative overflow-hidden bg-[#0D0B09] border-r border-[#2A2318]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06)_0%,transparent_70%)]" />
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={iconsArray} text="MKTHONEY" />
      </div>

      {/* Right — Form */}
      <div className="w-1/2 h-dvh flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] relative z-10 bg-[#0D0B09]">
        <AuthTabs
          formFields={formFields}
          goTo={handleGoToSignup}
          handleSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
