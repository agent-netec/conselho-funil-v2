'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signupWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { createUser } from '@/lib/firebase/firestore';
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
  name: string;
  email: string;
  password: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof FormData
  ) => {
    setFormData((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos 1 letra maiuscula';
    if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos 1 numero';
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const firebaseUser = await signupWithEmail(formData.email, formData.password, formData.name);
      try {
        await createUser(firebaseUser.uid, {
          email: formData.email,
          name: formData.name,
          role: 'admin',
        });
      } catch (firestoreErr) {
        console.error('Failed to create Firestore user doc:', firestoreErr);
      }
      router.push('/welcome');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ja esta em uso');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 8 caracteres, 1 maiuscula e 1 numero');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
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
      // signInWithGoogle uses signInWithRedirect — page will redirect to Google.
      // Auth result is handled in AuthProvider via handleGoogleRedirectResult().
    } catch {
      setError('Erro ao conectar com Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoToLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    router.push('/login');
  };

  const formFields = {
    header: 'Criar conta',
    subHeader: 'Trial PRO gratuito por 14 dias. Sem cartao de credito.',
    fields: [
      {
        label: 'Nome',
        required: true,
        type: 'text' as const,
        placeholder: 'Seu nome completo',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'name'),
      },
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
        placeholder: 'Min. 8 caracteres, 1 maiuscula, 1 numero',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: isLoading ? 'Criando...' : 'Criar Conta',
    textVariantButton: 'Ja tem conta? Fazer login',
    errorField: error,
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
          goTo={handleGoToLogin}
          handleSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
