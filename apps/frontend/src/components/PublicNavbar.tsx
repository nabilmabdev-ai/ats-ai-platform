'use client';

import Link from 'next/link';

export default function PublicNavbar() {
  return (
    <nav className="bg-white border-b border-[var(--color-border)] sticky top-0 z-50 h-20 flex items-center">
      <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-pink-200">
            A
          </div>
          <span className="font-bold text-2xl tracking-tight text-[var(--color-text-dark)]">
            Acme<span className="text-[var(--color-primary)]">Corp</span>
          </span>
        </div>
        
        <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-[var(--color-text-soft)] hover:text-[var(--color-primary)] transition-colors"
            >
                Employee Login
            </Link>
            <a 
              href="#" 
              className="btn-secondary text-sm px-5 py-2.5 rounded-full border-2 border-[var(--color-text-dark)] text-[var(--color-text-dark)] hover:bg-[var(--color-text-dark)] hover:text-white transition-all font-bold"
            >
                Visit Website
            </a>
        </div>
      </div>
    </nav>
  );
}