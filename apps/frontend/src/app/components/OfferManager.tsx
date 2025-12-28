'use client';

import { useState, useEffect } from 'react';

interface Offer {
  id: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'FAILED';
  salary: number;
  equity: string;
  startDate: string;
  offerLetter: string;
  generatedOfferUrl?: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
}

interface Props {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onStatusChange?: () => void;
}

export default function OfferManager({ applicationId, candidateName, jobTitle, onStatusChange }: Props) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [salary, setSalary] = useState<number>(0);
  const [equity, setEquity] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Existing Offer & Templates
  useEffect(() => {
    // Fetch existing offer
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/application/${applicationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setOffer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch templates for the dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-templates?type=OFFER`)
      .then((res) => res.json())
      .then((data: DocumentTemplate[]) => {
        setTemplates(data);
        if (data.length > 0) {
          setTemplateId(data[0].id); // Default to the first template
        }
      });
  }, [applicationId]);

  // 2. Create Draft
  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          templateId,
          salary: Number(salary),
          equity,
          startDate
        }),
      });

      if (res.ok) {
        const newOffer = await res.json();
        setOffer(newOffer);
        if (onStatusChange) onStatusChange();
      } else {
        const errorData = await res.json();
        alert(`Failed to generate offer: ${errorData.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Send Email
  const handleSend = async () => {
    if (!offer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/${offer.id}/send`, {
        method: 'POST'
      });
      if (res.ok) {
        setOffer({ ...offer, status: 'SENT' });
        alert('Offer sent to candidate! 📧');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Mark Status
  const handleMarkStatus = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!offer) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/${offer.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOffer({ ...offer, status });
        if (onStatusChange) onStatusChange();
      }
    } catch (e) { console.error(e); }
  };

  // 5. Regenerate PDF
  const handleRegenerate = async () => {
    if (!offer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/${offer.id}/regenerate`, {
        method: 'POST',
      });
      if (res.ok) {
        setOffer({ ...offer, status: 'DRAFT', generatedOfferUrl: undefined });
        alert('PDF regeneration triggered! 🔄');
      } else {
        alert('Failed to trigger regeneration.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 text-sm text-[var(--color-slate)]">Checking offer status...</div>;

  // --- VIEW: NO OFFER YET ---
  if (!offer) {
    return (
      <div className="bg-white p-8 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)] h-full flex flex-col justify-center items-center text-center">
        <div className="w-16 h-16 bg-[var(--color-primary)]/5 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">💎</span>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-midnight)] mb-2">Generate Offer</h2>
        <p className="text-[var(--color-slate)] mb-8 max-w-sm">
          Create a formal offer for <strong className="text-[var(--color-gunmetal)]">{candidateName}</strong>. Select a template and define the compensation package.
        </p>

        <div className="w-full max-w-md space-y-5 text-left">
          <div>
            <label className="block text-[11px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1.5">Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-gunmetal)]"
              disabled={templates.length === 0}
            >
              {templates.length > 0 ? (
                templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
              ) : (
                <option>No offer templates found</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1.5">Annual Salary</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-slate)] font-bold">$</span>
                <input
                  type="number"
                  value={salary || ''}
                  onChange={e => setSalary(Number(e.target.value))}
                  className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] pl-8 pr-3 py-3 text-lg font-bold text-[var(--color-gunmetal)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="120000"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1.5">Equity / Options</label>
              <input
                type="text"
                value={equity}
                onChange={e => setEquity(e.target.value)}
                className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-gunmetal)]"
                placeholder="e.g. 0.1%"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-gunmetal)]"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={isSubmitting || !salary || !startDate || !templateId}
            className="w-full bg-black text-white py-3 rounded-[var(--radius-md)] font-bold hover:bg-gray-800 disabled:opacity-50 mt-4 shadow-[var(--shadow-md)] transition-all"
          >
            {isSubmitting ? 'Generating...' : 'Generate Draft'}
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: OFFER EXISTS ---
  return (
    <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-sm)] h-full flex flex-col overflow-hidden">

      {/* Status Banner */}
      {offer.status === 'SENT' && (
        <div className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-6 py-3 text-sm font-bold flex justify-between items-center border-b border-[var(--color-primary)]/20">
          <span>🚀 Offer Sent</span>
          <span className="text-xs uppercase tracking-wide opacity-80">Awaiting Response</span>
        </div>
      )}
      {offer.status === 'ACCEPTED' && (
        <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] px-6 py-3 text-sm font-bold flex justify-between items-center border-b border-[var(--color-success)]/20">
          <span>🎉 Offer Accepted</span>
          <span className="text-xs uppercase tracking-wide opacity-80">Hired</span>
        </div>
      )}
      {offer.status === 'DECLINED' && (
        <div className="bg-[var(--color-error)]/10 text-[var(--color-error)] px-6 py-3 text-sm font-bold flex justify-between items-center border-b border-[var(--color-error)]/20">
          <span>❌ Offer Declined</span>
          <span className="text-xs uppercase tracking-wide opacity-80">Closed</span>
        </div>
      )}
      {offer.status === 'FAILED' && (
        <div className="bg-red-100 text-red-700 px-6 py-3 text-sm font-bold flex justify-between items-center border-b border-red-200">
          <span>⚠️ PDF Generation Failed</span>
          <button
            onClick={handleRegenerate}
            disabled={isSubmitting}
            className="text-xs bg-white border border-red-300 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
          >
            {isSubmitting ? 'Retrying...' : '🔄 Retry Generation'}
          </button>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-midnight)]">Offer Details</h2>
            <p className="text-xs text-[var(--color-slate)] mt-1">Created for <span className="font-medium text-[var(--color-gunmetal)]">{jobTitle}</span></p>
          </div>
          {offer.status === 'DRAFT' && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--color-soft-grey)] text-[var(--color-slate)] border border-[var(--color-border-subtle)]">
              Draft
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 bg-[var(--color-soft-grey)]/50 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
          <div>
            <p className="text-[10px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1">Salary</p>
            <p className="text-lg font-bold text-[var(--color-gunmetal)]">${offer.salary.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-1">Start Date</p>
            <p className="text-lg font-bold text-[var(--color-gunmetal)]">{new Date(offer.startDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex-1 mb-6 min-h-[300px] flex flex-col">
          <label className="block text-[11px] font-bold text-[var(--color-slate)] uppercase tracking-widest mb-2">Offer Letter Preview</label>
          <div className="flex-1 bg-[var(--color-soft-grey)] rounded-[var(--radius-lg)] p-4 overflow-hidden relative">
            {/* PDF Page Effect */}
            <div className="bg-white shadow-[var(--shadow-lg)] w-full h-full max-w-2xl mx-auto p-8 overflow-y-auto text-sm text-[var(--color-gunmetal)] font-serif leading-relaxed border border-[var(--color-border-subtle)]">
              <div dangerouslySetInnerHTML={{ __html: offer.offerLetter }} />
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] pt-4 flex justify-between items-center">
          <div>
            {offer.generatedOfferUrl && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${offer.generatedOfferUrl.startsWith('/') ? '' : '/'}${offer.generatedOfferUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 uppercase tracking-wide"
              >
                📄 View PDF
              </a>
            )}
          </div>
          <div className="flex justify-end gap-3">
            {offer.status === 'DRAFT' && (
              <>
                {/* Show Regenerate if stuck in Draft without URL for a long time, or just allow it always if no URL?
                    Actually, if status is DRAFT and no URL, it might be generating.
                    But if it failed silently before we added FAILED status, user is stuck.
                    So let's adding a small "Regenerate" link if no URL.
                */}
                {!offer.generatedOfferUrl && (
                  <button
                    onClick={handleRegenerate}
                    disabled={isSubmitting}
                    className="text-[var(--color-slate)] text-xs hover:text-[var(--color-gunmetal)] mr-4 underline"
                  >
                    Regenerate PDF
                  </button>
                )}

                <button
                  onClick={handleSend}
                  disabled={isSubmitting || !offer.generatedOfferUrl}
                  className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-[var(--radius-md)] hover:bg-blue-700 font-bold shadow-[var(--shadow-sm)] disabled:opacity-50 transition-all text-sm"
                >
                  {isSubmitting ? 'Sending...' : '📧 Send to Candidate'}
                </button>
              </>
            )}

            {offer.status === 'SENT' && (
              <>
                <button
                  onClick={() => handleMarkStatus('DECLINED')}
                  className="bg-white border border-[var(--color-error)]/30 text-[var(--color-error)] px-4 py-2 rounded-[var(--radius-md)] hover:bg-red-50 font-bold text-xs uppercase tracking-wide transition-colors"
                >
                  Mark Declined
                </button>
                <button
                  onClick={() => handleMarkStatus('ACCEPTED')}
                  className="bg-[var(--color-success)] text-white px-6 py-2 rounded-[var(--radius-md)] hover:bg-green-700 font-bold shadow-[var(--shadow-sm)] text-xs uppercase tracking-wide transition-colors"
                >
                  ✓ Mark Accepted
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}