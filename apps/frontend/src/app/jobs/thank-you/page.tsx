'use client';

import Link from 'next/link';

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-[var(--color-soft-grey)] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-[var(--radius-xl)] shadow-[var(--shadow-2xl)] w-full max-w-lg text-center border border-[var(--color-border-subtle)]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🚀</span>
                </div>

                <h1 className="text-3xl font-bold text-[var(--color-midnight)] mb-4">Application Received!</h1>
                <p className="text-[var(--color-slate)] mb-8 text-lg leading-relaxed">
                    Thank you for applying to High Tech Inc. We have received your application and will review it shortly.
                </p>

                <div className="space-y-4">
                    <Link href="/careers"
                        className="block w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white py-3 rounded-[var(--radius-md)] font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                        Back to Careers
                    </Link>
                </div>
            </div>

            <p className="mt-8 text-xs text-[var(--color-slate)] opacity-60">
                &copy; {new Date().getFullYear()} High Tech Inc. All rights reserved.
            </p>
        </div>
    );
}
