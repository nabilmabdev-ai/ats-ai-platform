import Link from 'next/link';
import { CalendarIcon } from '@/components/ui/Icons';

interface WelcomeSectionProps {
    userName?: string;
    interviewsScheduled: number;
}

export const WelcomeSection = ({ userName, interviewsScheduled }: WelcomeSectionProps) => {
    return (
        <section className="mb-8 flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold text-[var(--color-text-dark)] mb-1 tracking-tight">
                    Welcome back, <span className="text-[var(--color-primary)]">{userName?.split(' ')[0] || 'User'}</span>
                </h2>
                <p className="text-base text-[var(--color-text-soft)]">
                    You have <span className="font-semibold text-[var(--color-text-dark)]">{interviewsScheduled} interviews</span> scheduled for today.
                </p>
            </div>
            <Link href="/interviews" className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-full hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all shadow-sm">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-sm font-bold">View Schedule</span>
            </Link>
        </section>
    );
};
