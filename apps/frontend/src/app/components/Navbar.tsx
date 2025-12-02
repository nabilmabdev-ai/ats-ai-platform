'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-[var(--color-border)] sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-[var(--space-4)] sm:px-[var(--space-6)] lg:px-[var(--space-8)] h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-[var(--space-2)] group">
              <div className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-[var(--radius-md)] flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform shadow-[var(--shadow-glow)]">
                A
              </div>
              <span className="font-bold text-xl tracking-tight text-[var(--color-text-dark)]">HT<span className="text-[var(--color-primary)]">.os</span></span>
            </Link>
          </div>

          {/* Right Side: Powered By Badge (Public Context) */}
          <div className="flex items-center gap-[var(--space-4)]">
            <div className="hidden sm:flex items-center gap-[var(--space-2)] text-xs font-medium text-[var(--color-text-soft)] bg-[var(--color-neutral-100)] px-[var(--space-3)] py-[var(--space-1)] rounded-full border border-[var(--color-border)]">
              <span>Powered by</span>
              <span className="font-bold text-[var(--color-text-dark)]">HT.os</span>
            </div>

            {/* Optional: Help Link */}
            <Link href="#" className="text-sm font-bold text-[var(--color-text-soft)] hover:text-[var(--color-primary)] transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}