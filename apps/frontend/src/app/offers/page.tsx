'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

const PAGE_SIZE = 10;

// --- Types ---
interface Offer {
  id: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED';
  salary: number;
  currency: string;
  equity: string | null;
  startDate: string;
  // [UPDATE] Added generatedOfferUrl to interface
  generatedOfferUrl?: string; 
  application: {
    id: string;
    candidate: { firstName: string; lastName: string; email: string };
    job: { title: string };
  };
  createdBy: { fullName: string };
}

// --- Icons ---
const IconOffers = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconRate = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const IconMoney = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconArrowRight = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
// [UPDATE] Added IconPDF
const IconPDF = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    ACCEPTED: 'bg-[var(--color-success)]/10 text-[var(--color-success-text)] border-[var(--color-success)]/20',
    SENT: 'bg-pink-50 text-pink-700 border-pink-200',
    DRAFT: 'bg-[var(--color-neutral-100)] text-[var(--color-text-soft)] border-[var(--color-border)]',
    DECLINED: 'bg-[var(--color-error)]/10 text-[var(--color-error-text)] border-[var(--color-error)]/20',
  }[status] || 'bg-gray-100 text-gray-600';

  return (
    <span className={`px-2.5 py-1 inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-wider rounded-full border ${styles}`}>
      {status}
    </span>
  );
};

const Avatar = ({ name }: { name: string }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const colors = [
    'bg-blue-50 text-blue-600 border-blue-200',
    'bg-purple-50 text-purple-600 border-purple-200',
    'bg-emerald-50 text-emerald-600 border-emerald-200',
    'bg-amber-50 text-amber-600 border-amber-200',
    'bg-rose-50 text-rose-600 border-rose-200',
  ];
  const colorIndex = name.length % colors.length;
  return <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${colors[colorIndex]} shadow-sm`}>{initials}</div>;
};

const StatCard = ({ label, value, subtext, icon }: { label: string; value: string; subtext?: string, icon: React.ReactNode }) => (
  <div className="bg-white rounded-[var(--radius-xl)] p-5 border border-[var(--color-border)] shadow-sm hover:shadow-[var(--shadow-hover)] transition-all duration-300 group">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-[var(--color-neutral-50)] rounded-lg text-[var(--color-text-soft)] group-hover:bg-[var(--color-primary)]/10 group-hover:text-[var(--color-primary)] transition-colors">{icon}</div>
      {subtext && <span className="text-[10px] font-medium text-[var(--color-text-soft)] bg-[var(--color-neutral-50)] px-2 py-0.5 rounded-full">{subtext}</span>}
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider">{label}</span>
      <span className="text-2xl font-bold text-[var(--color-text-dark)] tracking-tight">{value}</span>
    </div>
  </div>
);

const Pagination = ({ page, totalPages, onPageChange }: { page: number, totalPages: number, onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm font-bold bg-white border border-[var(--color-border)] rounded-md disabled:opacity-50">Previous</button>
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1.5 text-sm font-bold border rounded-md ${p === page ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white border-[var(--color-border)]'}`}>{p}</button>
      ))}
      <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm font-bold bg-white border border-[var(--color-border)] rounded-md disabled:opacity-50">Next</button>
    </div>
  );
};

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.data || []);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setOffers([]);
      });
  }, [page]);

  const stats = useMemo(() => {
    const safeOffers = offers || [];
    const total = safeOffers.length;
    const accepted = safeOffers.filter(o => o.status === 'ACCEPTED').length;
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const totalSalary = safeOffers.reduce((acc, curr) => acc + curr.salary, 0);
    const avgSalary = total > 0 ? Math.round(totalSalary / total) : 0;
    return { total, rate, avgSalary: avgSalary.toLocaleString() };
  }, [offers]);

  if (loading && offers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-[var(--color-text-soft)]">Loading Offers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-dark)] tracking-tight">Offers Management</h1>
            <p className="text-[var(--color-text-soft)] mt-1 text-sm">Track salary offers, equity grants, and candidate acceptance.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Offers" value={stats.total.toString()} subtext="On this page" icon={<IconOffers />} />
          <StatCard label="Acceptance Rate" value={`${stats.rate}%`} subtext="On this page" icon={<IconRate />} />
          <StatCard label="Avg. Salary" value={`€ ${stats.avgSalary}`} subtext="On this page" icon={<IconMoney />} />
        </div>
        <div className="bg-white rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--color-neutral-50)] border-b border-[var(--color-border)]">
            <div className="col-span-4 text-[11px] font-bold text-[var(--color-text-soft)] uppercase tracking-widest">Candidate</div>
            <div className="col-span-3 text-[11px] font-bold text-[var(--color-text-soft)] uppercase tracking-widest">Role</div>
            <div className="col-span-2 text-[11px] font-bold text-[var(--color-text-soft)] uppercase tracking-widest">Status</div>
            <div className="col-span-2 text-right text-[11px] font-bold text-[var(--color-text-soft)] uppercase tracking-widest">Compensation</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {loading ? (
              <div className="py-20 text-center text-sm text-[var(--color-text-soft)]">Loading...</div>
            ) : offers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[var(--color-neutral-100)] rounded-full flex items-center justify-center mb-4 text-2xl text-[var(--color-neutral-400)]">📭</div>
                <h3 className="text-lg font-semibold text-[var(--color-text-dark)]">No offers generated yet</h3>
                <p className="text-sm text-[var(--color-text-soft)] max-w-xs mt-1">Move a candidate to the &quot;Offer&quot; stage in the pipeline to draft a new offer.</p>
              </div>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-[var(--color-neutral-50)] transition-colors group">
                  <div className="col-span-4 flex items-center gap-4">
                    <Avatar name={`${offer.application.candidate.firstName} ${offer.application.candidate.lastName}`} />
                    <div>
                      <div className="text-sm font-bold text-[var(--color-text-dark)] group-hover:text-[var(--color-primary)] transition-colors">{offer.application.candidate.firstName} {offer.application.candidate.lastName}</div>
                      <div className="text-xs text-[var(--color-text-soft)]">{offer.application.candidate.email}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="text-sm font-medium text-[var(--color-text-dark)]">{offer.application.job.title}</div>
                    <div className="text-[11px] font-medium text-[var(--color-text-soft)] mt-0.5 flex items-center gap-1">Start: {new Date(offer.startDate).toLocaleDateString()}</div>
                  </div>
                  <div className="col-span-2"><StatusBadge status={offer.status} /></div>
                  <div className="col-span-2 text-right">
                    <div className="text-sm font-bold text-[var(--color-text-dark)] tabular-nums tracking-tight">{offer.currency} {offer.salary.toLocaleString()}</div>
                    {offer.equity && <div className="text-[10px] font-bold text-[var(--color-primary)] inline-block mt-0.5 bg-[var(--color-primary)]/5 px-1.5 py-0.5 rounded">+ {offer.equity} Equity</div>}
                  </div>
                  
                  {/* [UPDATE] Added PDF Button */}
                  <div className="col-span-1 flex justify-end gap-2">
                    {offer.generatedOfferUrl && (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_API_URL}${offer.generatedOfferUrl.startsWith('/') ? '' : '/'}${offer.generatedOfferUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 border border-transparent hover:border-[var(--color-primary)]/20 transition-all"
                        title="View Offer PDF"
                      >
                        <IconPDF />
                      </a>
                    )}
                    <Link href={`/applications/${offer.application.id}`} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--color-border)] transition-all" title="View Details"><IconArrowRight /></Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}