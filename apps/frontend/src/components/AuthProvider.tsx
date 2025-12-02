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

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
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
    return null; // Or a loading spinner while redirecting
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