import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Shell from "./components/Shell";

import { AuthProvider } from '@/components/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Load Inter font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "HT Recruitment OS",
  description: "Next-Gen Recruitment & HRIS System",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-text-dark)] font-sans transition-colors duration-200"
      >
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <Shell>{children}</Shell>
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
