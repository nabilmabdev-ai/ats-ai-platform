'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();

      // Store JWT in localStorage (or HttpOnly cookie in production)
      login(data.access_token, data.user);

      // Redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md bg-white p-8 rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] border border-[var(--color-border)]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--color-primary)] text-white font-bold text-xl mb-4 shadow-lg">
            A
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Welcome Back</h1>
          <p className="text-sm text-[var(--color-text-soft)]">Sign in to access your recruitment OS</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg text-sm text-[var(--color-error-text)] text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className="input-base"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="#" className="font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}