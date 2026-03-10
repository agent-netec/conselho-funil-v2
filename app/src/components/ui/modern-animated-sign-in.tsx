'use client';
import {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
} from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// ==================== FadeIn (replaces BoxReveal — CSS only, no framer-motion) ====================

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn('animate-in-up', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ==================== Ripple Component ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 11,
  className = '',
}: RippleProps) {
  return (
    <section
      className={cn(
        'max-w-[50%] absolute inset-0 flex items-center justify-center bg-[#1A1612]/30',
        '[mask-image:linear-gradient(to_bottom,white,transparent)]',
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';
        const borderOpacity = 5 + i * 5;

        return (
          <span
            key={i}
            className="absolute animate-ripple rounded-full bg-[#E6B447]/5 border"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity,
              animationDelay,
              borderStyle,
              borderWidth: '1px',
              borderColor: `rgba(230, 180, 71, ${borderOpacity / 100})`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles Component ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <circle
            className="stroke-[#E6B447]/[0.06] stroke-1"
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
          />
        </svg>
      )}
      <section
        style={{
          '--duration': duration,
          '--radius': radius,
          '--delay': -delay,
        } as React.CSSProperties}
        className={cn(
          'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full border border-[#E6B447]/[0.08] bg-[#E6B447]/[0.06] [animation-delay:calc(var(--delay)*1000ms)]',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        {children}
      </section>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================

export type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
  text?: string;
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = 'MKTHONEY',
}: TechnologyOrbitDisplayProps) {
  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-[#E6B447] to-[#AB8648]/60 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent">
        {text}
      </span>

      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

// ==================== AnimatedForm Component ====================

type FieldType = 'text' | 'email' | 'password';

type Field = {
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  successField?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  secondaryLinkText?: string;
  onSecondaryLink?: () => void;
  onGoogleSignIn?: () => void;
  googleLoading?: boolean;
};

type Errors = { [key: string]: string };

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  successField,
  onSubmit,
  goTo,
  secondaryLinkText,
  onSecondaryLink,
  onGoogleSignIn,
  googleLoading,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event: FormEvent<HTMLFormElement>) => {
    const currentErrors: Errors = {};
    fields.forEach((field) => {
      const value = (event.target as HTMLFormElement)[field.label]?.value;
      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} e obrigatorio`;
      }
      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = 'Endereco de email invalido';
      }
      if (field.type === 'password' && value && value.length < 8) {
        currentErrors[field.label] = 'A senha deve ter pelo menos 8 caracteres';
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formErrors = validateForm(event);
    if (Object.keys(formErrors).length === 0) {
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <div className="max-md:w-full flex flex-col gap-5 w-[380px] mx-auto">
      <FadeIn>
        <h2 className="font-bold text-3xl text-[#F5E8CE]">{header}</h2>
      </FadeIn>

      {subHeader && (
        <FadeIn delay={50} className="pb-1">
          <p className="text-[#CAB792] text-sm max-w-sm">{subHeader}</p>
        </FadeIn>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5 space-y-4">
          {fields.map((field, i) => (
            <FadeIn key={field.label} delay={100 + i * 60}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.label} className="text-[#CAB792] text-xs font-medium">
                  {field.label}
                  {field.required && <span className="text-[#C45B3A] ml-0.5">*</span>}
                </Label>
                <div className="relative group">
                  <Input
                    type={
                      field.type === 'password'
                        ? visible ? 'text' : 'password'
                        : field.type
                    }
                    id={field.label}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                    className="h-10 bg-[#1A1612] border-[#2A2318] text-[#F5E8CE] placeholder:text-[#6B5D4A] focus-visible:border-[#E6B447]/50 focus-visible:ring-[#E6B447]/20 transition-colors"
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={toggleVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B5D4A] hover:text-[#CAB792] transition-colors"
                    >
                      {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  )}
                </div>
                {errors[field.label] && (
                  <p className="text-[#C45B3A] text-xs mt-0.5">{errors[field.label]}</p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {(errorField || successField) && (
          <div className="mb-3">
            {errorField && <p className="text-[#C45B3A] text-sm">{errorField}</p>}
            {successField && <p className="text-[#E6B447] text-sm">{successField}</p>}
          </div>
        )}

        {secondaryLinkText && onSecondaryLink && (
          <div className="mb-3 text-right">
            <button
              type="button"
              className="text-xs text-[#6B5D4A] hover:text-[#E6B447] transition-colors outline-none"
              onClick={onSecondaryLink}
            >
              {secondaryLinkText}
            </button>
          </div>
        )}

        <FadeIn delay={300}>
          <Button
            type="submit"
            className="group/btn relative w-full h-10 bg-gradient-to-r from-[#E6B447] to-[#AB8648] text-[#0D0B09] font-semibold hover:from-[#F0C35C] hover:to-[#E6B447] rounded-md cursor-pointer transition-all duration-200"
          >
            {submitButton}
            <BottomGradient />
          </Button>
        </FadeIn>

        {onGoogleSignIn && (
          <FadeIn delay={320}>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A2318]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0D0B09] px-3 text-[#6B5D4A]">ou</span>
              </div>
            </div>
            <Button
              type="button"
              disabled={googleLoading}
              onClick={onGoogleSignIn}
              className="group/btn relative w-full h-10 bg-[#1A1612] border border-[#2A2318] text-[#CAB792] font-medium hover:bg-[#2A2318] hover:border-[#E6B447]/30 rounded-md cursor-pointer transition-all duration-200"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Conectando...' : 'Continuar com Google'}
              <BottomGradient />
            </Button>
          </FadeIn>
        )}

        {textVariantButton && goTo && (
          <FadeIn delay={350}>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-[#AB8648] hover:text-[#E6B447] font-medium cursor-pointer outline-none transition-colors"
                onClick={goTo as any}
              >
                {textVariantButton}
              </button>
            </div>
          </FadeIn>
        )}
      </form>
    </div>
  );
});

// ==================== BottomGradient ====================

const BottomGradient = () => (
  <>
    <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[#E6B447] to-transparent" />
    <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[#E6B447] to-transparent" />
  </>
);

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
  formFields: {
    header: string;
    subHeader?: string;
    fields: Array<{
      label: string;
      required?: boolean;
      type: any;
      placeholder: string;
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    }>;
    submitButton: string;
    textVariantButton?: string;
    errorField?: string;
    successField?: string;
    secondaryLinkText?: string;
    onSecondaryLink?: () => void;
    onGoogleSignIn?: () => void;
    googleLoading?: boolean;
  };
  goTo: (event: React.MouseEvent<HTMLButtonElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const AuthTabs = memo(function AuthTabs({
  formFields,
  goTo,
  handleSubmit,
}: AuthTabsProps) {
  return (
    <AnimatedForm
      {...formFields}
      onSubmit={handleSubmit}
      goTo={goTo}
    />
  );
});

// ==================== Exports ====================

export {
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  AuthTabs,
  BottomGradient,
};
