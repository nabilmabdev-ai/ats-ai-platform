// --- Content from: apps/frontend/src/app/components/Shell.tsx ---

'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Define public routes where the Recruiter Sidebar should NOT appear
  // UPDATED: Added '/login' and '/careers' to the exclusion list
  const safePathname = pathname || '';
  const isPublic = safePathname.startsWith('/book') || safePathname.includes('/apply') || safePathname.startsWith('/login') || safePathname.startsWith('/careers') || safePathname.includes('/thank-you') || safePathname.startsWith('/portal');

  if (isPublic) {
    return (
      <main className="min-h-screen bg-[var(--color-background)]">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Fixed Sidebar with State */}
      <Sidebar
        isCollapsed={isCollapsed}
        toggleSidebar={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area with Dynamic Margin */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-20' : 'ml-64'
          }`}
      >
        {children}
      </main>
    </div>
  );
}