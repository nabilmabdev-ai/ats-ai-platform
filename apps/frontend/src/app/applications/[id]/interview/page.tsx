'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/app/components/StarRating';
import { ArrowLeftIcon } from '@/components/ui/Icons';

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
  // Questions State
  const [questions, setQuestions] = useState<any | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'SCORECARD' | 'QUESTIONS'>('NOTES');

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Fetch Context
  useEffect(() => {
    fetch(`${API_URL}/applications/${appId}`)
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

  // Handle Question Generation
  const handleGenerateQuestions = async () => {
    if (!app) return;
    setIsGeneratingQuestions(true);
    try {
      const res = await fetch(`${API_URL}/interviews/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: app.job.title,
          jobDescription: '', // Optional, can fetch if needed
          skills: app.job.requirements,
          candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      } else {
        console.error("Failed to generate questions", res.status, res.statusText);
        alert("Failed to generate questions. Please check the console.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating questions. Is the backend running?");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // 2. Handle AI Analysis Submit
  const handleAiSubmit = async () => {
    if (!notes) return;
    setIsProcessingAi(true);
    try {
      const res = await fetch(`${API_URL}/interviews/analyze`, {
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
      const interviewsRes = await fetch(`${API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        alert("No active interview session found. Please schedule one first.");
        return;
      }

      const res = await fetch(`${API_URL}/interviews/save-ai-scorecard`, {
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
      const interviewsRes = await fetch(`${API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        alert("No active interview session found. Please schedule one first.");
        return;
      }

      const res = await fetch(`${API_URL}/interviews/scorecard`, {
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

  if (!app) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--color-text-soft)] font-medium">Loading Interview Context...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans">

      {/* Sticky Header */}
      <header className="sticky top-0 z-20 h-20 bg-white border-b border-[var(--color-border)] px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-lg text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-text-dark)] transition-colors">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-dark)]">Interview Session</h1>
            <p className="text-xs text-[var(--color-text-soft)]">Evaluate candidate performance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider rounded-md border border-[var(--color-primary)]/20">
            Live Mode
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT COL: CONTEXT --- */}
        <div className="lg:col-span-4 space-y-6">

          {/* Candidate Card */}
          <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm p-6 hover:shadow-[var(--shadow-hover)] transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-neutral-100)] flex items-center justify-center text-2xl font-bold text-[var(--color-text-soft)]">
                {app.candidate.firstName[0]}{app.candidate.lastName[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-dark)]">{app.candidate.firstName} {app.candidate.lastName}</h2>
                <p className="text-sm text-[var(--color-text-soft)]">Candidate</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider block mb-1">Applying For</span>
                <h3 className="text-base font-semibold text-[var(--color-text-dark)]">{app.job.title}</h3>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <span className="text-xs font-bold text-[var(--color-text-soft)] uppercase tracking-wider block mb-3">Skills to Verify</span>
                <div className="flex flex-wrap gap-2">
                  {app.job.requirements && app.job.requirements.map((req, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary)]/20">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Optional placeholder for future) */}
          <div className="bg-[var(--color-secondary-lilac)]/10 rounded-[var(--radius-xl)] border border-[var(--color-secondary-lilac)]/20 p-6">
            <h3 className="text-sm font-bold text-[var(--color-text-dark)] mb-2">💡 Interview Tip</h3>
            <p className="text-sm text-[var(--color-text-soft)]">
              Focus on behavioral questions to assess cultural fit. Use the "Questions" tab to generate ideas.
            </p>
          </div>

        </div>

        {/* --- RIGHT COL: WORKSPACE --- */}
        <div className="lg:col-span-8 flex flex-col min-h-[600px]">

          {/* Tabs */}
          <div className="mb-6">
            <div className="inline-flex p-1 bg-[var(--color-neutral-100)] rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              {(['NOTES', 'SCORECARD', 'QUESTIONS'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-6 py-2.5 text-sm font-bold rounded-[var(--radius-md)] transition-all duration-200
                    ${activeTab === tab
                      ? 'bg-white text-[var(--color-text-dark)] shadow-sm'
                      : 'text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] hover:bg-[var(--color-neutral-50)]'
                    }
                  `}
                >
                  {tab === 'NOTES' && '🤖 AI Copilot'}
                  {tab === 'SCORECARD' && '⭐ Scorecard'}
                  {tab === 'QUESTIONS' && '❓ Questions'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm min-h-[500px] overflow-hidden relative">

            {/* TAB 1: AI NOTES */}
            {activeTab === 'NOTES' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-[var(--color-neutral-50)]/50">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-dark)]">Interview Notes</h2>
                    <p className="text-xs text-[var(--color-text-soft)]">Jot down thoughts. AI will summarize them.</p>
                  </div>
                  <button
                    onClick={handleAiSubmit}
                    disabled={isProcessingAi || !notes}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {isProcessingAi ? (
                      <><span className="animate-spin">✨</span> Analyzing...</>
                    ) : (
                      <><span className="text-lg">✨</span> Generate Analysis</>
                    )}
                  </button>
                </div>

                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="flex items-center gap-4 px-6 py-2 border-b border-[var(--color-border-subtle)] bg-white">
                    <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] font-bold text-sm">B</button>
                    <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] italic font-serif text-sm">I</button>
                    <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] underline text-sm">U</button>
                  </div>
                  <textarea
                    className="flex-1 w-full p-6 outline-none text-sm text-[var(--color-text-dark)] resize-none bg-transparent placeholder:text-[var(--color-neutral-300)] leading-relaxed"
                    placeholder="- Candidate demonstrated strong knowledge in..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* AI Result Overlay/Modal */}
                {aiScorecard && (
                  <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm p-8 overflow-y-auto animate-fade-in">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-[var(--color-text-dark)] flex items-center gap-2">
                          <span className="text-2xl">🤖</span> AI Analysis
                        </h3>
                        <button onClick={() => setAiScorecard(null)} className="text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]">
                          Close
                        </button>
                      </div>

                      <div className="bg-[var(--color-neutral-50)] p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
                        <h4 className="font-bold text-[var(--color-text-dark)] mb-2">Summary</h4>
                        <p className="text-sm text-[var(--color-text-soft)] leading-relaxed">{aiScorecard.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[var(--color-success)]/5 p-5 rounded-[var(--radius-lg)] border border-[var(--color-success)]/10">
                          <h4 className="font-bold text-[var(--color-success-text)] mb-3 flex items-center gap-2 text-sm"><CheckIcon /> Pros</h4>
                          <ul className="space-y-2">
                            {aiScorecard.pros?.map((pro, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-dark)] flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--color-success-text)] mt-1.5"></span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-[var(--color-warning)]/5 p-5 rounded-[var(--radius-lg)] border border-[var(--color-warning)]/10">
                          <h4 className="font-bold text-[var(--color-warning-text)] mb-3 flex items-center gap-2 text-sm"><AlertIcon /> Cons</h4>
                          <ul className="space-y-2">
                            {aiScorecard.cons?.map((con, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-dark)] flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--color-warning-text)] mt-1.5"></span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-[var(--color-text-soft)]">AI Rating</span>
                          <StarRating label="" value={aiScorecard.rating} readOnly />
                        </div>
                        <button
                          onClick={handleSaveAiScorecard}
                          disabled={isSavingAiScorecard}
                          className="btn-primary px-6 py-2 text-sm"
                        >
                          {isSavingAiScorecard ? 'Saving...' : 'Save to Profile'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HUMAN SCORECARD */}
            {activeTab === 'SCORECARD' && (
              <div className="p-8 animate-fade-in max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[var(--color-text-dark)]">Your Evaluation</h2>
                  <p className="text-sm text-[var(--color-text-soft)]">Rate the candidate on key competencies.</p>
                </div>

                <div className="space-y-1 mb-8">
                  {Object.keys(ratings).map((skill) => (
                    <div key={skill} className="hover:bg-[var(--color-neutral-50)] rounded-[var(--radius-md)] px-4 transition-colors">
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
                    className="w-full p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-neutral-50)] focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all text-sm min-h-[120px]"
                    placeholder="Share your overall thoughts..."
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleScorecardSubmit}
                  disabled={isSavingScorecard}
                  className="btn-primary w-full py-3 text-base shadow-[var(--shadow-glow)]"
                >
                  {isSavingScorecard ? 'Saving Scorecard...' : 'Submit Evaluation'}
                </button>
              </div>
            )}

            {/* TAB 3: QUESTIONS */}
            {activeTab === 'QUESTIONS' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-[var(--color-neutral-50)]/50">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-dark)]">Suggested Questions</h2>
                    <p className="text-xs text-[var(--color-text-soft)]">Tailored to the role and candidate profile.</p>
                  </div>
                  <button
                    onClick={handleGenerateQuestions}
                    disabled={isGeneratingQuestions}
                    className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    {isGeneratingQuestions ? (
                      <><span className="animate-spin">✨</span> Generating...</>
                    ) : (
                      <><span className="text-lg">✨</span> Generate New</>
                    )}
                  </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-6">
                  {questions ? (
                    <>
                      {/* Role Specific */}
                      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                        <div className="bg-blue-50/50 px-6 py-3 border-b border-blue-100">
                          <h3 className="font-bold text-blue-700 text-sm flex items-center gap-2">🛠️ Role-Specific</h3>
                        </div>
                        <ul className="p-6 space-y-4">
                          {questions.role_specific?.map((q: string, i: number) => (
                            <li key={i} className="flex gap-4 text-sm text-[var(--color-text-dark)]">
                              <span className="font-mono text-blue-300 font-bold">{i + 1}.</span>
                              <span className="leading-relaxed">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Behavioral */}
                      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                        <div className="bg-purple-50/50 px-6 py-3 border-b border-purple-100">
                          <h3 className="font-bold text-purple-700 text-sm flex items-center gap-2">🧠 Behavioral (STAR)</h3>
                        </div>
                        <ul className="p-6 space-y-4">
                          {questions.behavioral?.map((q: string, i: number) => (
                            <li key={i} className="flex gap-4 text-sm text-[var(--color-text-dark)]">
                              <span className="font-mono text-purple-300 font-bold">{i + 1}.</span>
                              <span className="leading-relaxed">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Red Flags */}
                      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
                        <div className="bg-red-50/50 px-6 py-3 border-b border-red-100">
                          <h3 className="font-bold text-red-700 text-sm flex items-center gap-2">🚩 Red Flag Detectors</h3>
                        </div>
                        <ul className="p-6 space-y-4">
                          {questions.red_flags?.map((q: string, i: number) => (
                            <li key={i} className="flex gap-4 text-sm text-[var(--color-text-dark)]">
                              <span className="font-mono text-red-300 font-bold">{i + 1}.</span>
                              <span className="leading-relaxed">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-neutral-50)]/50">
                      <span className="text-4xl mb-4 grayscale opacity-50">🤖</span>
                      <p className="text-[var(--color-text-soft)] font-medium">Click "Generate New" to get started</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
