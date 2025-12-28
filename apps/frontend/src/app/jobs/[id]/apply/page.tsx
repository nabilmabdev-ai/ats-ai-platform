'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Building2, MapPin, Globe, Clock, ChevronRight, Briefcase, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useToast } from '@/components/ui/Toast';

interface KoQuestion {
  id: string;
  text: string;
  correctAnswer: string;
  options?: string[];
}

interface Job {
  id: string;
  title: string;
  descriptionText?: string;
  knockoutQuestions?: KoQuestion[];
  location?: string;
  type?: string;
}

interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  careerPageUrl?: string;
  defaultTimezone?: string;
  description?: string;
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export default function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToast } = useToast();
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getBaseUrl();
        const [jobRes, companyRes] = await Promise.all([
          fetch(`${apiUrl}/jobs/${jobId}`),
          fetch(`${apiUrl}/company`)
        ]);

        if (jobRes.ok) {
          const jobData = await jobRes.json();
          setJob(jobData);
        }

        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }
      } catch (error) {
        console.error("Failed to load data", error);
        addToast("Failed to load application details", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, addToast]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".doc") || droppedFile.name.endsWith(".docx")) {
        setFile(droppedFile);
      } else {
        addToast("Please upload a PDF or Word document", "warning");
      }
    }
  };

  const handleCoverLetterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // setDragActive(false); // We can manage separate drag states if we want, but simple is fine
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".doc") || droppedFile.name.endsWith(".docx")) {
        setCoverLetterFile(droppedFile);
      } else {
        addToast("Please upload a PDF or Word document", "warning");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return addToast('Please upload a CV', 'warning');

    // Validate KO questions
    if (job?.knockoutQuestions) {
      const missing = job.knockoutQuestions.find(q => !answers[q.id]);
      if (missing) {
        return addToast(`Please answer: ${missing.text}`, 'warning');
      }
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('resume', file);
    if (coverLetterFile) {
      formData.append('coverLetter', coverLetterFile);
    }
    formData.append('knockoutAnswers', JSON.stringify(answers));

    try {
      const apiUrl = getBaseUrl();
      const res = await fetch(`${apiUrl}/applications`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        addToast('Application Sent Successfully! 🚀', 'success');
        router.push('/jobs/thank-you');
      } else {
        const err = await res.json();
        addToast(`Error: ${err.message}`, 'error');
      }
    } catch {
      addToast('Upload failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) return <div className="min-h-screen flex items-center justify-center text-slate-500">Job not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero / Header Section */}
      <div className="bg-white/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-8 w-8 object-contain rounded-lg shadow-sm" />
            ) : (
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-200">
                {company?.name?.substring(0, 2).toUpperCase() || 'CO'}
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-slate-900">{company?.name || 'Company Name'}</span>
          </div>
          <a href={company?.careerPageUrl || '#'} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 group">
            Visit Website <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Left Column: Job Info & Company Context */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wide mb-6 border border-indigo-100">
                <Briefcase className="w-3 h-3" />
                Open Position
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm font-medium text-slate-500">
                {company?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {company.address}
                  </div>
                )}
                {company?.defaultTimezone && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    {company.defaultTimezone}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Full-time
                </div>
              </div>
            </div>

            <div className="prose prose-slate prose-lg max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 
              prose-p:text-slate-600 prose-p:leading-relaxed 
              prose-li:text-slate-600 
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
              <h3 className="text-xl font-bold text-slate-900 mb-4">About the Role</h3>
              {job.descriptionText ? (
                <ReactMarkdown>{job.descriptionText}</ReactMarkdown>
              ) : (
                <p className="text-slate-400 italic">No description provided.</p>
              )}
            </div>

            {company?.description && (
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200/60">
                <h3 className="text-slate-900 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  About {company.name}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {company.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Application Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden sticky top-24">
              <div className="p-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Apply for this job</h2>
                <p className="text-slate-500 mb-8 text-sm">Join our team and help us build the future.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jane Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. jane@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Resume / CV</label>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer group ${dragActive
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
                        }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-full transition-colors ${file ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                          {file ? <CheckCircle className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          {file ? (
                            <>
                              <p className="font-semibold text-slate-900">{file.name}</p>
                              <p className="text-xs text-green-600 font-medium">Ready to upload</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
                              <p className="text-xs text-slate-500">PDF, DOCX up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Cover Letter / Other (Optional)</label>
                    <div
                      className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 text-center transition-all cursor-pointer hover:border-indigo-400 hover:bg-slate-50 group"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleCoverLetterDrop}
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-3 rounded-full transition-colors ${coverLetterFile ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>
                          {coverLetterFile ? <CheckCircle className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div className="space-y-1">
                          {coverLetterFile ? (
                            <>
                              <p className="font-semibold text-slate-900">{coverLetterFile.name}</p>
                              <p className="text-xs text-green-600 font-medium">Ready to upload</p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">Click to upload or drag and drop</p>
                              <p className="text-xs text-slate-500">PDF, DOCX up to 10MB</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {job.knockoutQuestions && job.knockoutQuestions.length > 0 && (
                    <div className="space-y-6 pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-indigo-600" />
                        Application Questions
                      </h3>
                      <div className="space-y-5">
                        {job.knockoutQuestions.map((q) => (
                          <div key={q.id} className="space-y-3">
                            <label className="block text-sm font-medium text-slate-800">{q.text}</label>
                            {q.options && q.options.length > 0 ? (
                              <div className="relative">
                                <select
                                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                  defaultValue=""
                                  className="w-full appearance-none px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white text-slate-900 transition-all"
                                >
                                  <option value="" disabled>Select an option...</option>
                                  {q.options.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                  <ChevronRight className="w-4 h-4 rotate-90" />
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3">
                                {['Yes', 'No'].map((option) => (
                                  <label key={option} className="flex-1 cursor-pointer group">
                                    <input
                                      type="radio"
                                      name={q.id}
                                      value={option}
                                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                      className="peer hidden"
                                    />
                                    <div className="flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium transition-all peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 group-hover:border-indigo-300 shadow-sm">
                                      {option}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:shadow-slate-900/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} {company?.name || 'ATS.ai Inc'}. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}