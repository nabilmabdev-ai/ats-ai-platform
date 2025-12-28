'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';

// --- Icons (SVG Components for Premium Look) ---
const Icons = {
  Overview: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Pipeline: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  Briefcase: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Search: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Calendar: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  FileText: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Users: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Settings: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Template: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Plus: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  ChevronLeft: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Sparkles: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  LogOut: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Import: (className: string) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
};

const isActive = (path: string, currentPathname: string) => {
  if (path === '/') return currentPathname === '/';
  return currentPathname.startsWith(path);
};

const NavItem = ({ href, label, icon, isCollapsed }: { href: string; label: string; icon: keyof typeof Icons; isCollapsed: boolean; }) => {
  const pathname = usePathname();
  const active = isActive(href, pathname || '');
  const IconComponent = Icons[icon];

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-200 relative ${active
        ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/15 font-bold'
        : 'text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] hover:bg-[var(--color-neutral-100)]'
        } ${isCollapsed ? 'justify-center' : ''}`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[var(--color-primary)] rounded-r-full shadow-[0_0_8px_rgba(var(--color-primary-rgb),0.4)]" />
      )}

      {IconComponent && IconComponent(`w-5 h-5 transition-transform duration-200 ${active ? 'text-[var(--color-primary)] scale-110' : 'group-hover:scale-110'}`)}

      {!isCollapsed && (
        <span className="whitespace-nowrap">
          {label}
        </span>
      )}
    </Link>
  );
};

const SectionLabel = ({ text, isCollapsed }: { text: string; isCollapsed: boolean; }) => (
  <div className={`px-3 mb-2 mt-6 text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-wider transition-all duration-300 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden mt-0 mb-0' : 'opacity-100'
    }`}>
    {text}
  </div>
);

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const { logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/40?u=alice');

  useEffect(() => {
    const storedAvatar = localStorage.getItem('user-avatar');
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }
  }, []);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        localStorage.setItem('user-avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`
            bg-white h-screen fixed left-0 top-0 flex flex-col
            border-r border-[var(--color-border)] z-50 transition-all duration-300 ease-in-out shadow-[var(--shadow-soft)]
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}
    >

      {/* 1. Brand & Logo */}
      <div className={`h-16 flex items-center border-b border-[var(--color-border)] transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'
        }`}>
        <div className="relative group">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold shrink-0 shadow-[var(--shadow-glow)] group-hover:scale-105 transition-all">
            A
          </div>
        </div>
        {!isCollapsed && (
          <span className="ml-3 text-lg font-bold text-[var(--color-text-dark)] tracking-tight">
            HT<span className="text-[var(--color-primary)]">.os</span>
          </span>
        )}
      </div>

      {/* User Profile - NEW POSITION */}
      <div className={`flex items-center gap-3 py-4 px-3 transition-all duration-300 border-b border-[var(--color-border)] ${isCollapsed ? 'justify-center' : ''}`}>
        <label className="relative group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shrink-0 flex items-center justify-center text-[var(--color-primary)] font-bold text-xs overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Alice Recruiter" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </label>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-[var(--color-text-dark)] truncate">Alice Recruiter</p>
            <p className="text-[10px] text-[var(--color-text-soft)] truncate uppercase tracking-wider font-semibold">Admin • Acme Corp</p>
          </div>
        )}
      </div>

      {/* 2. Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 scrollbar-hide">


        <NavItem href="/" label="Overview" icon="Overview" isCollapsed={isCollapsed} />

        <SectionLabel text="Recruitment" isCollapsed={isCollapsed} />
        <NavItem href="/dashboard" label="Pipeline" icon="Pipeline" isCollapsed={isCollapsed} />
        <NavItem href="/vacancies" label="Jobs" icon="Briefcase" isCollapsed={isCollapsed} />
        <NavItem href="/search" label="CV Search" icon="Search" isCollapsed={isCollapsed} />

        <SectionLabel text="Operations" isCollapsed={isCollapsed} />
        <NavItem href="/interviews" label="Interviews" icon="Calendar" isCollapsed={isCollapsed} />
        <NavItem href="/offers" label="Offers" icon="FileText" isCollapsed={isCollapsed} />

        <SectionLabel text="Workspace" isCollapsed={isCollapsed} />
        <NavItem href="/team" label="Team" icon="Users" isCollapsed={isCollapsed} />
        <NavItem href="/settings" label="Settings" icon="Settings" isCollapsed={isCollapsed} />
        <NavItem href="/settings/templates" label="Templates" icon="Template" isCollapsed={isCollapsed} />
        <NavItem href="/settings/import" label="Import Candidates" icon="Import" isCollapsed={isCollapsed} />
      </div>

      {/* 3. Footer / Toggle */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-neutral-50)] space-y-2">

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Log Out" : undefined}
        >
          {Icons.LogOut("w-5 h-5 transition-transform duration-200 group-hover:scale-110")}
          {!isCollapsed && <span>Log Out</span>}
        </button>

        {/* Collapse Trigger */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] hover:bg-white transition-all duration-200 group border border-transparent hover:border-[var(--color-border)]"
        >
          {isCollapsed ? (
            Icons.ChevronLeft("w-5 h-5 rotate-180 transition-transform duration-300")
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
              {Icons.ChevronLeft("w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300")}
              <span>Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}