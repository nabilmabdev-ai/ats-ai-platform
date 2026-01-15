'use client';
import { useRouter } from 'next/navigation';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('portal_token');
        router.push('/portal/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-semibold text-lg tracking-tight">Candidate Portal</span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                    Sign Out
                </button>
            </header>
            <main className="max-w-5xl mx-auto px-6 py-12">
                {children}
            </main>
        </div>
    );
}
