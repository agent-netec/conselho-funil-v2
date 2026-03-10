import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Criar conta — MKTHONEY',
  description: 'Crie sua conta MKTHONEY. Trial PRO gratuito por 14 dias.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
