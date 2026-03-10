import type { Metadata } from "next";
// import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { AppShell } from "@/components/layout/app-shell";
import { BrandingProvider } from "@/components/providers/branding-provider";
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
  metadataBase: new URL('https://mkthoney.com'),
  openGraph: {
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Plataforma de inteligência estratégica de marketing com IA. Funis, copy, ads e social — tudo com conselheiros especializados.',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://mkthoney.com',
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
        <AuthProvider>
          <PostHogProvider>
            <BrandingProvider>
              <AppShell>{children}</AppShell>
              <CookieBanner />
            </BrandingProvider>
          </PostHogProvider>
        </AuthProvider>
        <Toaster position="bottom-right" theme="dark" />
        <SpeedInsights />
      </body>
    </html>
  );
}
