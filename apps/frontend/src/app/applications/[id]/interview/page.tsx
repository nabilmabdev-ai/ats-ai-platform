'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/app/components/StarRating';

// --- Helper Icons ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--color-success-text)]">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[var(--color-warning-text)]">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);
// --- End Helper Icons ---


interface Application {
  id: string;
  candidate: {
    firstName: string;
    lastName: string;
  };
  job: {
    title: string;
    requirements: string[];
  };
}

interface AiScorecard {
  summary: string;
  pros: string[];
  cons: string[];
  rating: number;
}

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const appId = resolvedParams.id;

  const [app, setApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'SCORECARD'>('NOTES');

  // AI Notes State
  const [notes, setNotes] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Human Scorecard State
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [isSavingScorecard, setIsSavingScorecard] = useState(false);
  const [isSavingAiScorecard, setIsSavingAiScorecard] = useState(false);

  // AI Scorecard State
  const [aiScorecard, setAiScorecard] = useState<AiScorecard | null>(null);

  // 1. Fetch Context
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/${appId}`)
      .then((res) => res.json())
      .then((data) => {
        setApp(data);
        const initialRatings: Record<string, number> = {};
        data.job.requirements?.forEach((req: string) => {
          initialRatings[req] = 0;
        });
        initialRatings['Communication'] = 0;
        initialRatings['Cultural Fit'] = 0;
        setRatings(initialRatings);
      })
      .catch((err) => console.error("Failed to load app context", err));
  }, [appId]);

  // 2. Handle AI Analysis Submit
  const handleAiSubmit = async () => {
    if (!notes) return;
    setIsProcessingAi(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiScorecard(data.aiScorecard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingAi(false);
    }
  };

  const handleSaveAiScorecard = async () => {
    if (!aiScorecard) return;

    try {
      setIsSavingAiScorecard(true);
      const interviewsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        alert("No active interview session found. Please schedule one first.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/save-ai-scorecard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          scorecard: aiScorecard,
        }),
      });

      if (res.ok) {
        alert('AI Scorecard Saved Successfully! 💾');
        router.push('/dashboard');
      } else {
        alert('Failed to save AI scorecard.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingAiScorecard(false);
    }
  };

  // 3. Handle Human Scorecard Submit
  const handleScorecardSubmit = async () => {
    try {
      setIsSavingScorecard(true);
      const interviewsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        alert("No active interview session found. Please schedule one first.");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interviews/scorecard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          notes: generalFeedback,
          scorecard: ratings
        }),
      });

      if (res.ok) {
        alert('Scorecard Saved Successfully! 💾');
        router.push('/dashboard');
      } else {
        alert('Failed to save scorecard.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingScorecard(false);
    }
  };

  if (!app) return <div className="p-10 text-center text-[var(--color-text-soft)]">Loading Interview Context...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3">

        {/* --- LEFT COL: CONTEXT (Sticky) --- */}
        <div className="md:col-span-1 bg-white border-r border-[var(--color-border)] md:sticky top-0 h-screen overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="mb-4 border-b border-[var(--color-border)] pb-4">
              <span className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">Candidate</span>
              <h2 className="text-xl font-bold text-[var(--color-text-dark)]">{app.candidate.firstName} {app.candidate.lastName}</h2>
            </div>
            <div className="mb-6">
              <span className="text-xs font-bold text-[var(--color-info-text)] uppercase tracking-wider">Role</span>
              <h3 className="text-lg font-semibold text-[var(--color-text-dark)]">{app.job.title}</h3>
            </div>
            <div>
              <h4 className="font-bold text-[var(--color-text-dark)] mb-3 flex items-center gap-2">🎯 Skills to Verify</h4>
              <div className="flex flex-wrap gap-2">
                {app.job.requirements && app.job.requirements.map((req, i) => (
                  <span key={i} className="tag tag-neutral">
                    {req}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COL: WORKSPACE --- */}
        <div className="md:col-span-2 flex flex-col min-h-screen">

          {/* Segmented Control Tabs */}
          <div className="p-4 border-b border-[var(--color-border)] bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="relative flex w-full max-w-sm mx-auto p-1 bg-[var(--color-neutral-100)] rounded-[var(--radius-lg)]">
              <div
                className="absolute top-1 left-1 h-[calc(100%-8px)] bg-white rounded-[var(--radius-md)] shadow-sm transition-transform duration-300 ease-in-out"
                style={{
                  width: 'calc(50% - 4px)',
                  transform: activeTab === 'SCORECARD' ? 'translateX(calc(100% + 8px))' : 'translateX(0)',
                }}
              />
              <button
                onClick={() => setActiveTab('NOTES')}
                className={`relative flex-1 py-2 text-sm font-bold text-center z-10 transition-colors ${activeTab === 'NOTES' ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-soft)]'}`}
              >
                🤖 AI Copilot
              </button>
              <button
                onClick={() => setActiveTab('SCORECARD')}
                className={`relative flex-1 py-2 text-sm font-bold text-center z-10 transition-colors ${activeTab === 'SCORECARD' ? 'text-[var(--color-text-dark)]' : 'text-[var(--color-text-soft)]'}`}
              >
                ⭐ Human Scorecard
              </button>
            </div>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">

            {/* TAB 1: AI NOTES */}
            {activeTab === 'NOTES' && (
              <div className="flex flex-col h-full max-w-3xl mx-auto animate-fade-in">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Interview Copilot 🎙️</h1>
                  <p className="text-[var(--color-text-soft)] text-sm">Take rough notes. The AI will analyze them for you.</p>
                </div>

                {/* Rich Text Toolbar (Visual Only) */}
                <div className="flex items-center gap-4 px-4 py-2 border border-b-0 border-[var(--color-border)] rounded-t-[var(--radius-md)] bg-[var(--color-neutral-50)]">
                  <span className="text-sm font-bold text-[var(--color-neutral-400)] cursor-pointer hover:text-[var(--color-primary)]">B</span>
                  <span className="text-sm italic font-serif text-[var(--color-neutral-400)] cursor-pointer hover:text-[var(--color-primary)]">I</span>
                  <span className="text-sm underline text-[var(--color-neutral-400)] cursor-pointer hover:text-[var(--color-primary)]">U</span>
                </div>
                <textarea
                  className="flex-1 w-full p-6 outline-none font-mono text-sm resize-none bg-white border border-[var(--color-border)] rounded-b-[var(--radius-md)] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                  placeholder="- Candidate mentioned experience with..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ minHeight: '300px' }}
                />
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAiSubmit}
                    disabled={isProcessingAi || !notes}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isProcessingAi ? (
                      <>
                        <span className="animate-spin">✨</span> Analyzing...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Generate AI Scorecard
                      </>
                    )}
                  </button>
                </div>

                {aiScorecard && (
                  <div className="mt-8 p-0.5 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary-lilac)]/20 animate-modal-in">
                    <div className="bg-white/90 backdrop-blur-md rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-glow)]">
                      <h3 className="text-lg font-bold text-[var(--color-text-dark)] mb-6 flex items-center gap-2">
                        🤖 AI Analysis Complete
                      </h3>
                      <div className="space-y-6">
                        <div className="prose prose-sm max-w-none">
                          <h4 className="font-semibold text-[var(--color-text-dark)]">Summary</h4>
                          <p className="text-[var(--color-text-soft)] leading-relaxed">{aiScorecard.summary}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[var(--color-success)]/10 p-4 rounded-[var(--radius-md)] border border-[var(--color-success)]/20">
                            <h4 className="font-semibold text-[var(--color-success-text)] mb-3 flex items-center gap-2"><CheckIcon /> Pros</h4>
                            <ul className="space-y-2 text-[var(--color-text-soft)] text-sm">
                              {aiScorecard.pros?.map((pro: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="opacity-50">•</span> {pro}</li>)}
                            </ul>
                          </div>
                          <div className="bg-[var(--color-warning)]/10 p-4 rounded-[var(--radius-md)] border border-[var(--color-warning)]/20">
                            <h4 className="font-semibold text-[var(--color-warning-text)] mb-3 flex items-center gap-2"><AlertIcon /> Cons</h4>
                            <ul className="space-y-2 text-[var(--color-text-soft)] text-sm">
                              {aiScorecard.cons?.map((con: string, i: number) => <li key={i} className="flex items-start gap-2"><span className="opacity-50">•</span> {con}</li>)}
                            </ul>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                          <StarRating label="Overall AI Rating" value={aiScorecard.rating} readOnly />
                          <button
                            onClick={handleSaveAiScorecard}
                            disabled={isSavingAiScorecard}
                            className="btn-primary"
                          >
                            {isSavingAiScorecard ? 'Saving...' : 'Save AI Scorecard'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HUMAN SCORECARD */}
            {activeTab === 'SCORECARD' && (
              <div className="flex flex-col h-full max-w-lg mx-auto animate-fade-in">
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Your Evaluation 📝</h1>
                  <p className="text-[var(--color-text-soft)] text-sm">Rate the candidate based on specific criteria.</p>
                </div>

                <div className="space-y-4 bg-white p-8 rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-soft)] mb-8">
                  {Object.keys(ratings).map((skill) => (
                    <div key={skill} className="flex items-center justify-between p-2 hover:bg-[var(--color-neutral-50)] rounded-[var(--radius-sm)] transition-colors">
                      <StarRating
                        label={skill}
                        value={ratings[skill]}
                        onChange={(val) => setRatings(prev => ({ ...prev, [skill]: val }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-bold text-[var(--color-text-dark)] mb-2">General Feedback</label>
                  <textarea
                    className="input-base min-h-[120px]"
                    placeholder="Overall thoughts on the candidate..."
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleScorecardSubmit}
                  disabled={isSavingScorecard}
                  className="btn-primary w-full py-3 text-lg shadow-[var(--shadow-glow)]"
                >
                  {isSavingScorecard ? 'Saving...' : 'Save Scorecard'}
                </button>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
