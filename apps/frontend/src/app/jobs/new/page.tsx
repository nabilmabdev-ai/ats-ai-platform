'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TemplateLibraryModal from '@/components/jobs/builder/TemplateLibraryModal';
import JobInputPanel from '@/components/jobs/builder/JobInputPanel';
import JobPreviewPanel from '@/components/jobs/builder/JobPreviewPanel';
import { useToast } from '@/components/ui/Toast';

interface JobTemplate {
  id: string;
  name: string;
  structure: string;
  defaultScreeningTemplateId?: string;
  aiTone?: string;
}

interface KoQuestion {
  id: string;
  text: string;
  correctAnswer: 'Yes' | 'No';
}

export default function NewJobPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // Form State
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState<string>('FR');
  const [tone, setTone] = useState<string>(''); // New Tone State
  const [companyTone, setCompanyTone] = useState<string>('');

  // Configuration
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Data
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<{ min: number; max: number } | null>(null);
  const [koQuestions, setKoQuestions] = useState<KoQuestion[]>([]);
  const [templates, setTemplates] = useState<JobTemplate[]>([]);

  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // 1. Fetch Templates
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/templates`)
      .then(res => res.json())
      .then(data => {
        setTemplates(data);
      })
      .catch(() => {
        addToast("Failed to load templates.", "error");
      });

    // 2. Fetch Job Config (Company Tone)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/config`)
      .then(res => res.json())
      .then(data => {
        if (data.companyTone) setCompanyTone(data.companyTone);
      })
      .catch(err => console.error("Failed to load config", err));
  }, [addToast]);

  const handleTemplateSelect = (template: JobTemplate) => {
    setSelectedTemplate(template.id ? template : null);
    setIsTemplateModalOpen(false);
    addToast(`Template "${template.name}" selected.`, "info");
  };

  const addKoQuestion = () => {
    setKoQuestions([...koQuestions, { id: Math.random().toString(36).substr(2, 9), text: 'Valid Work Visa?', correctAnswer: 'Yes' }]);
  };

  const removeKoQuestion = (index: number) => {
    const newQ = [...koQuestions];
    newQ.splice(index, 1);
    setKoQuestions(newQ);
  };

  const updateKoQuestion = (index: number, field: string, value: string) => {
    const newQ = [...koQuestions];
    newQ[index] = { ...newQ[index], [field]: value };
    setKoQuestions(newQ);
  };

  const handleGenerateAI = async () => {
    if (!title) {
      addToast("Please enter a job title first!", "warning");
      return;
    }
    setIsGenerating(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes,
          templateId: selectedTemplate?.id, // Sends ID so backend uses the specific structure
          region,
          tone: tone || undefined // Pass tone if set
        }),
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();

      // The backend now returns the merged string (Static Template Text + AI Generated placeholders)
      if (data.description && data.description.trim() !== '') {
        setDescription(data.description);
        addToast("Description generated based on template.", "success");
      } else {
        addToast("AI returned an empty description. Try adding more context in the notes.", "warning");
      }

      if (data.requirements) setExtractedSkills(data.requirements);
      if (data.salary_range) setSalaryRange(data.salary_range);

    } catch (e) {
      console.error(e);
      addToast("Error generating description. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (status: 'DRAFT' | 'PENDING_APPROVAL' = 'PENDING_APPROVAL') => {
    setErrors({});

    if (!title) {
      setErrors(prev => ({ ...prev, title: 'Job title is required' }));
      addToast("Please enter a job title.", "error");
      return;
    }

    // For Draft, we might be more lenient, but let's keep description required for now
    if (status !== 'DRAFT' && (!description || description.trim() === '')) {
      setErrors(prev => ({ ...prev, description: 'Job description is required' }));
      addToast("Please generate or write a job description.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        descriptionText: description,
        requirements: extractedSkills,
        salaryMin: salaryRange?.min,
        salaryMax: salaryRange?.max,
        location: region === 'FR' ? 'Paris, France' : 'Casablanca, Morocco',
        remoteType: 'HYBRID',
        knockoutQuestions: koQuestions,
        templateId: selectedTemplate?.id,
        status, // Pass the status
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        addToast(status === 'DRAFT' ? "Job saved as draft!" : "Job published successfully!", "success");

        // If draft, maybe redirect to edit page? Or just vacancies.
        // Let's redirect to edit page so they can continue working.
        if (status === 'DRAFT') {
          router.push(`/jobs/${data.id}/edit`);
        } else {
          router.push('/vacancies');
        }
        router.refresh();
      } else {
        const errorData = await res.json();
        addToast(errorData.message || "Failed to save job.", "error");
      }
    } catch {
      addToast("Failed to create job. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-auto min-h-screen w-full flex-col bg-[var(--color-background)] font-sans">

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-[var(--color-border)] bg-white px-8 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-soft)] hover:bg-[var(--color-neutral-50)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-dark)]">Create New Job</h1>
            <p className="text-sm text-[var(--color-text-soft)]">AI Job Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 px-4 text-base font-bold text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)] transition-colors">
            Discard
          </button>
          <button
            onClick={() => handleSubmit('DRAFT')}
            disabled={isSaving}
            className="h-10 px-4 text-base font-bold text-[var(--color-primary)] hover:bg-[var(--color-surface)] rounded-lg transition-colors border border-[var(--color-primary)]"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit('PENDING_APPROVAL')}
            disabled={isSaving}
            className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 text-base font-bold text-white shadow-[var(--shadow-glow)] hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 w-full h-[calc(100vh-80px)] overflow-hidden">

        {/* Left Panel: Inputs */}
        <aside className="w-[480px] min-w-[480px] flex-shrink-0 border-r border-[var(--color-border)] bg-white h-full overflow-y-auto">
          <JobInputPanel
            title={title} setTitle={setTitle}
            notes={notes} setNotes={setNotes}
            region={region} setRegion={setRegion}
            selectedTemplate={selectedTemplate}
            onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
            onGenerate={handleGenerateAI}
            isGenerating={isGenerating}
            errors={errors}
            koQuestions={koQuestions}
            addKoQuestion={addKoQuestion}
            removeKoQuestion={removeKoQuestion}
            updateKoQuestion={updateKoQuestion}
            tone={tone} setTone={setTone} // Pass tone props
            companyTone={companyTone}
          />
        </aside>

        {/* Right Panel: Preview */}
        <main className="flex-1 bg-[var(--color-background)] p-8 flex items-start justify-center h-full overflow-y-auto">
          <JobPreviewPanel
            description={description}
            setDescription={setDescription}
            isGenerating={isGenerating}
            extractedSkills={extractedSkills}
            setExtractedSkills={setExtractedSkills}
            salaryRange={salaryRange}
            setSalaryRange={setSalaryRange}
            errors={errors}
          />
        </main>
      </div>

      {/* Modals */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelect={handleTemplateSelect}
        templates={templates}
      />
    </div>
  );
}