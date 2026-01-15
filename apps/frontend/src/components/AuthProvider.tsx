'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const safePathname = pathname || '';

  // Initialize token and user state - start with null to match server for hydration
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_info');

    if (storedToken) {
      setToken(storedToken);
    } else {
      // Clear cookie if no token in storage to prevent middleware loops
      document.cookie = `token=; path=/; max-age=0;`;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user info', e);
        localStorage.removeItem('user_info');
      }
    }
  }, []);

  // Only run redirection logic when token or pathname changes
  useEffect(() => {
    if (!isMounted) return;

    const publicRoutes = ['/login', '/book', '/careers'];
    const isPublic = publicRoutes.some(route => safePathname.startsWith(route)) ||
      safePathname.includes('/apply') ||
      safePathname.includes('/thank-you');

    // If it's not a public route and no token, redirect to login
    if (!isPublic && !token) {
      router.push('/login');
    }
  }, [token, safePathname, router, isMounted]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(newUser));

    // Set cookie for middleware
    document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');

    // Clear cookie
    document.cookie = `token=; path=/; max-age=0;`;

    router.push('/login');
  };

  // Render children if token exists or it's a public route, otherwise null (will be redirected by effect)
  const publicRoutes = ['/login', '/book', '/careers'];
  const isPublicRoute = publicRoutes.some(route => safePathname.startsWith(route)) ||
    safePathname.includes('/apply') ||
    safePathname.includes('/thank-you');

  if (!isPublicRoute && !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent"></div>
          <p className="text-sm font-medium text-[var(--color-text-soft)]">Loading...</p>
          <a
            href="/login"
            onClick={() => document.cookie = 'token=; path=/; max-age=0;'}
            className="text-xs text-[var(--color-primary)] underline mt-4 hover:text-[var(--color-primary-hover)]"
          >
            Stranded? Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}