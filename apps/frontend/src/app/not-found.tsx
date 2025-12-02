import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--color-soft-grey)] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">

            {/* Background Mesh Gradient (Subtle) */}
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-primary)]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <h1 className="text-[120px] font-black text-[var(--color-slate)]/20 leading-none select-none">
                    404
                </h1>
                <h2 className="text-3xl font-bold text-[var(--color-midnight)] mt-4 mb-2">
                    Page Not Found
                </h2>
                <p className="text-[var(--color-slate)] mb-10 max-w-md mx-auto">
                    We couldn&apos;t find the page you were looking for. It might have been moved, deleted, or never existed.
                </p>

                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center bg-[var(--color-midnight)] text-white px-8 py-3 rounded-[var(--radius-md)] font-bold hover:bg-[#3A1F3D] shadow-[var(--shadow-md)] transition-all transform hover:-translate-y-0.5"
                >
                    Return to Dashboard
                </Link>
            </div>

            <div className="absolute bottom-8 text-xs text-[var(--color-slate)] opacity-50">
                ATS.ai &copy; {new Date().getFullYear()}
            </div>
        </div>
    );
}
