import type { Metadata } from "next";
// import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import { AppShell } from "@/components/layout/app-shell";
import { BrandingProvider } from "@/components/providers/branding-provider";
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
  title: "Conselho de Funil",
  description: "Plataforma de Criação, Avaliação e Governança de Funis",
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
        <PostHogProvider>
          <AuthProvider>
            <BrandingProvider>
              <AppShell>{children}</AppShell>
            </BrandingProvider>
          </AuthProvider>
        </PostHogProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
