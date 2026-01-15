import Link from 'next/link';
import { SparkleIcon } from '@/components/ui/Icons';

export const DashboardHeader = () => {
    return (
        <header className="sticky top-0 z-20 h-20 bg-white border-b border-[var(--color-border)] flex items-center justify-between px-8 animate-fade-in backdrop-blur-sm bg-white/90">
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-[var(--color-text-dark)] tracking-tight">
                        Dashboard
                    </h1>
                </Link>
                {/* Operational Badge */}
                <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2F1] border border-[#B2DFDB]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00695C] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00695C]"></span>
                    </span>
                    <span className="text-[10px] font-bold text-[#00695C] uppercase tracking-wider">
                        System Operational
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Link
                    href="/cv-doctor"
                    className="flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)] bg-purple-50 text-purple-700 font-bold text-sm border border-purple-100 hover:bg-purple-100 transition-all"
                >
                    <SparkleIcon className="w-4 h-4" />
                    <span>CV Doctor</span>
                </Link>
                <Link
                    href="/jobs/new"
                    className="flex items-center gap-2 h-10 px-6 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-bold text-sm shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-all hover:-translate-y-0.5"
                >
                    <SparkleIcon className="w-4 h-4 text-white/90" />
                    <span>Create New Job</span>
                </Link>
            </div>
        </header>
    );
};
