import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MKTHONEY',
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't have the sidebar
  return <>{children}</>;
}


