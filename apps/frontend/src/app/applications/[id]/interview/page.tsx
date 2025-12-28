'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/app/components/StarRating';
import { ArrowLeftIcon } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { QuestionTemplate } from '@/types/question-template';
import { useAutoSave } from '@/hooks/useAutoSave';

// --- Helper: Robust ID Generator ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

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
  const { addToast } = useToast();

  const [app, setApp] = useState<Application | null>(null);

  // Questions State
  interface Question {
    id: string;
    text: string;
    category: string;
  }
  const [questions, setQuestions] = useState<Question[]>([]);
  const [manualEntry, setManualEntry] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'NOTES' | 'SCORECARD' | 'QUESTIONS'>('NOTES');
  const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

  // Template State
  const [availableTemplates, setAvailableTemplates] = useState<QuestionTemplate[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');

  // Decision Confirmation State
  const [decisionConfirmation, setDecisionConfirmation] = useState<'ADVANCE' | 'REJECT' | null>(null);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);

  // Fetch templates
  useEffect(() => {
    fetch(`${API_URL}/templates/questions`)
      .then(res => res.json())
      .then(data => setAvailableTemplates(data))
      .catch(err => console.error('Failed to load templates', err));
  }, []);

  const handleLoadTemplate = (template: QuestionTemplate) => {
    // Append questions, avoiding duplicates if possible (simple check by text)
    const existingTexts = new Set(questions.map(q => q.text));
    const newQuestions = template.questions.filter(q => !existingTexts.has(q.text)).map(q => ({
      ...q,
      id: generateId() // Regenerate ID to avoid conflicts
    }));

    setQuestions(prev => [...prev, ...newQuestions]);
    setTemplateSearch('');
    setIsTemplateDropdownOpen(false);
    addToast(`Loaded ${newQuestions.length} questions from "${template.title}"`, 'success');
  };

  const handleSaveAsTemplate = async () => {
    if (questions.length === 0) {
      addToast('No questions to save!', 'warning');
      return;
    }

    const title = prompt('Enter a name for this new template:', `${app?.job.title} - Custom Script`);
    if (!title) return;

    try {
      const res = await fetch(`${API_URL}/templates/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          questions,
          createdById: 'system-user', // TODO: Replace with actual user
        }),
      });

      if (res.ok) {
        addToast('Template saved successfully!', 'success');
        // Refresh templates
        fetch(`${API_URL}/templates/questions`)
          .then(res => res.json())
          .then(data => setAvailableTemplates(data));
      } else {
        addToast('Failed to save template', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Error saving template', 'error');
    }
  };

  // AI Notes State
  const [notes, setNotes] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  const { isSaving } = useAutoSave(notes, async (currentNotes) => {
    if (!activeInterviewId) return;
    await fetch(`${API_URL}/interviews/${activeInterviewId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: currentNotes })
    });
  });

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

        // Load existing questions if any
        // We need to fetch the interview object to get the questions
        fetch(`${API_URL}/interviews/application/${appId}`)
          .then(res => res.json())
          .then(interviews => {
            if (interviews && interviews.length > 0) {
              const interview = interviews[0];
              setActiveInterviewId(interview.id);
              if (interview.questions) {
                setQuestions(interview.questions);
              }
              if (interview.humanNotes) {
                setNotes(interview.humanNotes);
              }
              if (interview.scorecard) {
                // Load AI scorecard if exists
                if (interview.scorecardType === 'AI') {
                  setAiScorecard(interview.scorecard);
                }
              }
            }
          });
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
        // Transform and append
        const newQuestions: Question[] = [];
        if (data.role_specific) data.role_specific.forEach((q: string) => newQuestions.push({ id: generateId(), text: q, category: 'Role Specific' }));
        if (data.behavioral) data.behavioral.forEach((q: string) => newQuestions.push({ id: generateId(), text: q, category: 'Behavioral' }));
        if (data.red_flags) data.red_flags.forEach((q: string) => newQuestions.push({ id: generateId(), text: q, category: 'Red Flags' }));

        setQuestions(prev => [...prev, ...newQuestions]);
        addToast('Questions generated successfully!', 'success');
      } else {
        console.error("Failed to generate questions", res.status, res.statusText);
        addToast("Failed to generate questions.", 'error');
      }
    } catch (err) {
      console.error(err);
      addToast("Error generating questions. Is the backend running?", 'error');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleManualAdd = () => {
    if (!manualEntry.trim()) return;
    const newQ: Question = {
      id: generateId(),
      text: manualEntry,
      category: 'Manual'
    };
    setQuestions(prev => [newQ, ...prev]);
    setManualEntry('');
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleEditQuestion = (id: string, newText: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, text: newText } : q));
  };

  const handleSaveQuestions = async () => {
    try {
      setIsSavingQuestions(true);
      const interviewsRes = await fetch(`${API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        addToast("No active interview session found. Please schedule one first.", 'warning');
        return;
      }

      const res = await fetch(`${API_URL}/interviews/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId,
          questions
        }),
      });

      if (res.ok) {
        addToast('Questions List Saved! 💾', 'success');
      } else {
        addToast('Failed to save questions.', 'error');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingQuestions(false);
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
        addToast("No active interview session found. Please schedule one first.", 'warning');
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
        addToast('AI Scorecard Saved Successfully! 💾', 'success');
        router.push('/dashboard');
      } else {
        addToast('Failed to save AI scorecard.', 'error');
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
        addToast("No active interview session found. Please schedule one first.", 'warning');
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
        addToast('Scorecard Saved Successfully! 💾', 'success');
        router.push('/dashboard');
      } else {
        addToast('Failed to save scorecard.', 'error');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingScorecard(false);
    }
  };

  // Removed state from here

  const handleDecision = async (decision: 'ADVANCE' | 'REJECT') => {
    // Removed native confirm, handling via Modal now

    try {
      const interviewsRes = await fetch(`${API_URL}/interviews/application/${appId}`);
      const interviews = await interviewsRes.json();
      const interviewId = interviews[0]?.id;

      if (!interviewId) {
        addToast("No active interview session found.", 'error');
        return;
      }

      const res = await fetch(`${API_URL}/interviews/${interviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });

      if (res.ok) {
        addToast(`Candidate ${decision === 'ADVANCE' ? 'Advanced to Offer' : 'Rejected'}`, 'success');
        router.push('/dashboard');
      } else {
        addToast('Failed to process decision', 'error');
      }
    } catch (e) {
      console.error(e);
      addToast('Error processing decision', 'error');
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

            {/* TAB 1: AI NOTES (Split View) */}
            {activeTab === 'NOTES' && (
              <div className="flex h-full overflow-hidden">

                {/* LEFT: Human Notes (Input) */}
                <div className={`flex flex-col border-r border-[var(--color-border)] transition-all duration-300 ${aiScorecard ? 'w-1/2' : 'w-full'}`}>
                  <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-[var(--color-text-dark)]">My Notes</h2>
                      {isSaving ? (
                        <span className="text-xs text-[var(--color-text-soft)] animate-pulse">Saving...</span>
                      ) : (
                        <span className="text-xs text-[var(--color-success-text)]">Saved</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toolbar */}
                      <div className="flex items-center gap-2 mr-4">
                        <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] font-bold text-sm">B</button>
                        <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] italic font-serif text-sm">I</button>
                        <button className="text-[var(--color-text-soft)] hover:text-[var(--color-primary)] underline text-sm">U</button>
                      </div>
                      <button
                        onClick={handleAiSubmit}
                        disabled={isProcessingAi || !notes}
                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-2"
                      >
                        {isProcessingAi ? 'Analyzing...' : 'Run AI Analysis →'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="flex-1 w-full p-6 outline-none text-sm text-[var(--color-text-dark)] resize-none bg-white leading-relaxed"
                    placeholder="Type interview notes here... (Auto-saved)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {/* RIGHT: AI Copilot (Output) - Only visible when data exists */}
                {aiScorecard && (
                  <div className="w-1/2 flex flex-col bg-[var(--color-neutral-50)] animate-in slide-in-from-right-10 duration-300">
                    <div className="p-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center bg-white">
                      <h2 className="font-bold text-[var(--color-primary)] flex items-center gap-2">
                        <span className="text-lg">✨</span> AI Insights
                      </h2>
                      <button onClick={() => setAiScorecard(null)} className="text-xs text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]">Close</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                      {/* Summary Block */}
                      <div className="bg-white p-4 rounded-lg border border-[var(--color-border)] shadow-sm">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-soft)] mb-2">Executive Summary</h4>
                        <p className="text-sm leading-relaxed">{aiScorecard.summary}</p>
                      </div>

                      {/* Pros/Cons */}
                      <div className="space-y-3">
                        {aiScorecard.pros?.map((pro, i) => (
                          <div key={`pro-${i}`} className="flex gap-2 text-sm text-[var(--color-text-dark)]">
                            <CheckIcon />
                            <span>{pro}</span>
                          </div>
                        ))}
                        {aiScorecard.cons?.map((con, i) => (
                          <div key={`con-${i}`} className="flex gap-2 text-sm text-[var(--color-text-dark)]">
                            <AlertIcon />
                            <span>{con}</span>
                          </div>
                        ))}
                      </div>

                      {/* Rating & Save */}
                      <div className="pt-4 border-t border-[var(--color-border)]">
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-bold text-sm">Suggested Rating</span>
                          <StarRating label="" value={aiScorecard.rating} readOnly />
                        </div>
                        <button
                          onClick={handleSaveAiScorecard}
                          disabled={isSavingAiScorecard}
                          className="w-full btn-secondary text-sm"
                        >
                          {isSavingAiScorecard ? 'Saving...' : 'Apply to Scorecard'}
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

                {/* --- DECISION WORKFLOW --- */}
                <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
                  <h3 className="text-lg font-bold text-[var(--color-text-dark)] mb-4 text-center">Final Decision</h3>
                  <p className="text-sm text-[var(--color-text-soft)] text-center mb-6">
                    Ready to move this candidate forward? This will update their application status immediately.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setDecisionConfirmation('REJECT')}
                      className="flex-1 py-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white text-[var(--color-text-soft)] font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                      Reject Candidate
                    </button>
                    <button
                      onClick={() => setDecisionConfirmation('ADVANCE')}
                      className="flex-1 py-3 rounded-[var(--radius-lg)] btn-primary flex items-center justify-center gap-2 shadow-[var(--shadow-glow)] transform hover:-translate-y-0.5 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      Advance to Offer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- DECISION CONFIRMATION MODAL --- */}
            {decisionConfirmation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] p-8 max-w-md w-full mx-4 transform transition-all animate-modal-in">
                  <div className="text-center mb-6">
                    <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                      ${decisionConfirmation === 'ADVANCE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                    `}>
                      {decisionConfirmation === 'ADVANCE' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-[var(--color-text-dark)] mb-2">
                      {decisionConfirmation === 'ADVANCE' ? 'Extend Offer?' : 'Reject Candidate?'}
                    </h3>
                    <p className="text-[var(--color-text-soft)] text-sm leading-relaxed">
                      {decisionConfirmation === 'ADVANCE'
                        ? 'This will update the status to OFFER and allow you to draft the offer letter. Are you sure?'
                        : 'This will update the status to REJECTED. This action is immediate. Are you sure?'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDecisionConfirmation(null)}
                      className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] text-[var(--color-text-soft)] font-bold hover:bg-[var(--color-neutral-50)] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleDecision(decisionConfirmation);
                        setDecisionConfirmation(null);
                      }}
                      className={`
                        flex-1 py-2.5 rounded-[var(--radius-lg)] text-white font-bold shadow-md transition-all
                        ${decisionConfirmation === 'ADVANCE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                      `}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: QUESTIONS */}
            {activeTab === 'QUESTIONS' && (
              <div className="flex flex-col h-full animate-fade-in">
                <div className="p-6 border-b border-[var(--color-border-subtle)] flex flex-col gap-4 bg-[var(--color-neutral-50)]/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-text-dark)]">Interview Questions</h2>
                      <p className="text-xs text-[var(--color-text-soft)]">Curate your list. Mix manual entry with AI suggestions.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerateQuestions}
                        disabled={isGeneratingQuestions}
                        className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm bg-white border border-[var(--color-border)] hover:bg-[var(--color-neutral-50)]"
                      >
                        {isGeneratingQuestions ? (
                          <><span className="animate-spin">✨</span> Generating...</>
                        ) : (
                          <><span className="text-lg">✨</span> AI Suggestions</>
                        )}
                      </button>
                      <button
                        onClick={handleSaveQuestions}
                        disabled={isSavingQuestions}
                        className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                      >
                        {isSavingQuestions ? 'Saving...' : 'Save List'}
                      </button>
                      <button
                        onClick={handleSaveAsTemplate}
                        className="p-2 text-[var(--color-text-soft)] hover:text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] rounded-md transition-colors"
                        title="Save as Template"
                      >
                        💾
                      </button>
                    </div>
                  </div>

                  {/* Template Search & Manual Entry */}
                  <div className="flex flex-col gap-3">
                    {/* Template Search */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search templates to load..."
                        className="w-full px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm pl-9"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        onFocus={() => setIsTemplateDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsTemplateDropdownOpen(false), 200)}
                      />
                      <span className="absolute left-3 top-2.5 text-[var(--color-text-soft)]">🔍</span>

                      {isTemplateDropdownOpen && availableTemplates.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg z-20 max-h-60 overflow-y-auto">
                          {availableTemplates
                            .filter(t => t.title.toLowerCase().includes(templateSearch.toLowerCase()))
                            .map(t => (
                              <button
                                key={t.id}
                                className="w-full text-left px-4 py-2 hover:bg-[var(--color-neutral-50)] text-sm flex justify-between items-center group"
                                onClick={() => handleLoadTemplate(t)}
                              >
                                <span className="font-medium text-[var(--color-text-dark)]">{t.title}</span>
                                <span className="text-xs text-[var(--color-text-soft)]">{t.questions.length} Qs</span>

                                {/* Preview Tooltip (Simple implementation) */}
                                <div className="hidden group-hover:block absolute left-full ml-2 top-0 w-64 bg-white border border-[var(--color-border)] p-3 rounded-[var(--radius-md)] shadow-xl">
                                  <p className="text-xs font-bold mb-2 text-[var(--color-text-soft)]">Preview:</p>
                                  <ul className="space-y-1">
                                    {t.questions.slice(0, 3).map((q, i) => (
                                      <li key={i} className="text-xs text-[var(--color-text-dark)] truncate">• {q.text}</li>
                                    ))}
                                  </ul>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Manual Entry */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm"
                        placeholder="Type a custom question here and press Enter..."
                        value={manualEntry}
                        onChange={(e) => setManualEntry(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
                      />
                      <button
                        onClick={handleManualAdd}
                        disabled={!manualEntry.trim()}
                        className="px-4 py-2 bg-[var(--color-text-dark)] text-white rounded-[var(--radius-md)] text-sm font-bold hover:bg-black disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-8 overflow-y-auto space-y-4 flex-1">
                  {questions.length > 0 ? (
                    questions.map((q, i) => (
                      <div key={q.id} className="group bg-white rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4 hover:shadow-sm transition-all flex gap-4 items-start">
                        <span className="font-mono text-[var(--color-text-soft)] text-sm font-bold mt-2.5">
                          {i + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`
                              text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full
                              ${q.category === 'Role Specific' ? 'bg-blue-50 text-blue-600' : ''}
                              ${q.category === 'Behavioral' ? 'bg-purple-50 text-purple-600' : ''}
                              ${q.category === 'Red Flags' ? 'bg-red-50 text-red-600' : ''}
                              ${q.category === 'Manual' ? 'bg-gray-100 text-gray-600' : ''}
                            `}>
                              {q.category}
                            </span>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-[var(--color-text-soft)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Delete Question"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          <textarea
                            className="w-full text-sm text-[var(--color-text-dark)] bg-transparent border-none focus:ring-0 p-0 resize-none leading-relaxed overflow-hidden"
                            value={q.text}
                            onChange={(e) => {
                              handleEditQuestion(q.id, e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = el.scrollHeight + 'px';
                              }
                            }}
                            rows={1}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-neutral-50)]/50">
                      <span className="text-4xl mb-4 grayscale opacity-50">✍️</span>
                      <p className="text-[var(--color-text-soft)] font-medium">Start typing or generate questions</p>
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
