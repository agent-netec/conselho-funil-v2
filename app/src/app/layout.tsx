import type { Metadata } from "next";
// import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { AppShell } from "@/components/layout/app-shell";
import { CookieBanner } from "@/components/legal";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

// const inter = Inter({
//   variable: "--font-inter",
//   subsets: ["latin"],
// });

// const jetbrainsMono = JetBrains_Mono({
//   variable: "--font-jetbrains-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: {
    default: 'MKTHONEY — Marketing Autônomo com IA',
    template: '%s | MKTHONEY',
  },
  description: 'Plataforma de inteligência estratégica de marketing com IA. Funis, copy, ads e social — tudo com conselheiros especializados.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com'),
  openGraph: {
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Plataforma de inteligência estratégica de marketing com IA. Funis, copy, ads e social — tudo com conselheiros especializados.',
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com',
    siteName: 'MKTHONEY',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {/* A11Y-2: Skip navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#E6B447] focus:text-[#0D0B09] focus:rounded-lg focus:font-semibold focus:text-sm"
        >
          Ir para o conteúdo principal
        </a>
        <AuthProvider>
          <PostHogProvider>
              <AppShell>{children}</AppShell>
              <CookieBanner />
          </PostHogProvider>
        </AuthProvider>
        <Toaster position="bottom-right" theme="dark" />
        <SpeedInsights />
      </body>
    </html>
  );
}
