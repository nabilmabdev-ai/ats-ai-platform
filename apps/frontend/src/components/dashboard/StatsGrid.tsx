import { BriefcaseIcon, UsersIcon, CalendarIcon } from '@/components/ui/Icons';

interface StatsGridProps {
    activeJobs: number;
    totalCandidates: number;
    interviewsScheduled: number;
}

export const StatsGrid = ({ activeJobs, totalCandidates, interviewsScheduled }: StatsGridProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

            {/* Card: Active Jobs */}
            <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] flex items-center justify-center text-[#00695C] border border-[#B2DFDB]/30">
                        <BriefcaseIcon className="w-6 h-6" />
                    </div>
                    {activeJobs > 0 && (
                        <span className="px-3 py-1 rounded-full bg-[#E0F2F1] text-[#00695C] text-[10px] font-bold uppercase tracking-wider border border-[#B2DFDB]/50">
                            Active
                        </span>
                    )}
                </div>
                <div>
                    <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{activeJobs}</div>
                    <div className="text-sm font-medium text-[var(--color-text-soft)]">Open Positions</div>
                </div>
            </div>

            {/* Card: Active Candidates */}
            <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    {/* Using Primary Pink Family for Candidates */}
                    <div className="w-12 h-12 rounded-xl bg-[#FCE4EC] flex items-center justify-center text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    {totalCandidates > 0 && (
                        <span className="px-3 py-1 rounded-full bg-[#FCE4EC] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--color-primary)]/20">
                            Pipeline
                        </span>
                    )}
                </div>
                <div>
                    <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{totalCandidates}</div>
                    <div className="text-sm font-medium text-[var(--color-text-soft)]">Active Candidates</div>
                </div>
            </div>

            {/* Card: Interviews */}
            <div className="group bg-white rounded-[var(--radius-xl)] border border-[var(--color-border)] p-6 shadow-sm transition-all duration-300 hover:shadow-[var(--shadow-hover)] hover:border-[var(--color-primary)]/30 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF8E1] flex items-center justify-center text-[#F57F17] border border-[#FFE0B2]/50">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    {interviewsScheduled > 0 && (
                        <span className="px-3 py-1 rounded-full bg-[#FFF8E1] text-[#F57F17] text-[10px] font-bold uppercase tracking-wider border border-[#FFE0B2]">
                            Upcoming
                        </span>
                    )}
                </div>
                <div>
                    <div className="text-4xl font-bold text-[var(--color-text-dark)] tracking-tight mb-1">{interviewsScheduled}</div>
                    <div className="text-sm font-medium text-[var(--color-text-soft)]">Interviews Scheduled</div>
                </div>
            </div>

        </div>
    );
};
