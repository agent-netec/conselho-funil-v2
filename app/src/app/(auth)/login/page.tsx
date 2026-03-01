'use client';
import { useState, ChangeEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail, sendPasswordReset } from '@/lib/firebase/auth';
import {
  Ripple,
  AuthTabs,
  TechOrbitDisplay,
} from '@/components/ui/modern-animated-sign-in';
import {
  Target, BarChart3, Megaphone, Users, TrendingUp,
  Zap, PieChart, Mail, Rocket
} from 'lucide-react';

type FormData = {
  email: string;
  password: string;
};

interface OrbitIcon {
  component: () => ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
}

const iconsArray: OrbitIcon[] = [
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

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(formData.email, formData.password);
      router.push('/');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuário não encontrado');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToSignup = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push('/signup');
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Digite seu email primeiro para recuperar a senha');
      return;
    }
    try {
      await sendPasswordReset(formData.email);
      setError('');
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Email não encontrado');
      } else {
        setError('Erro ao enviar email de recuperação');
      }
    }
  };

  const formFields = {
    header: 'Bem-vindo ao MKTHONEY',
    subHeader: 'Acesse sua central estratégica',
    fields: [
      {
        label: 'Email',
        required: true,
        type: 'email' as any,
        placeholder: 'seu@email.com',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Senha',
        required: true,
        type: 'password' as any,
        placeholder: 'Sua senha segura',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: isLoading ? 'Autenticando...' : 'Acessar Comando',
    textVariantButton: 'Não tem conta? Criar agora',
    errorField: error,
    successField: success,
    secondaryLinkText: 'Esqueci minha senha',
    onSecondaryLink: handleForgotPassword,
  };

  return (
    <section className='flex max-lg:justify-center min-h-screen bg-[#0D0B09] overflow-hidden'>
      {/* Left Side */}
      <div className='flex flex-col justify-center w-1/2 max-lg:hidden relative overflow-hidden bg-[#0D0B09] border-r border-white/[0.05]'>
        {/* Gold radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(230,180,71,0.06)_0%,transparent_70%)]" />
        <Ripple mainCircleSize={100} />
        <TechOrbitDisplay iconsArray={iconsArray} text="MKTHONEY" />
      </div>

      {/* Right Side */}
      <div className='w-1/2 h-[100dvh] flex flex-col justify-center items-center max-lg:w-full max-lg:px-[10%] relative z-10 bg-[#0D0B09]'>
        <AuthTabs
          formFields={formFields}
          goTo={handleGoToSignup}
          handleSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
