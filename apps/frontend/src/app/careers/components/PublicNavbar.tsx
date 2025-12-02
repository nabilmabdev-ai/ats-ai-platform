'use client';

import Link from 'next/link';

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-primary)] text-white rounded-lg flex items-center justify-center font-bold text-lg">
            A
          </div>
          <span className="font-bold text-xl tracking-tight text-[var(--color-text-dark)]">
            Acme<span className="text-[var(--color-primary)]">Corp</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-primary)] transition-colors">
                Employee Login
            </Link>
            <a href="https://www.example.com" className="text-sm font-bold text-[var(--color-text-dark)] hover:underline">
                Visit Website
            </a>
        </div>
      </div>
    </nav>
  );
}