'use client';

import { useState, useEffect, useMemo } from 'react';
import PublicNavbar from './components/PublicNavbar';
import PublicJobCard from './components/PublicJobCard';
import { SearchIcon } from '@/components/ui/Icons';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  remoteType: string;
  status: string;
  createdAt: string;
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedLoc, setSelectedLoc] = useState('All');

  useEffect(() => {
    // Fetch all PUBLISHED jobs. 
    // Note: In a real app, we might want a specific public endpoint, but reuse works if secured.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?status=PUBLISHED&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        // Handle both paginated structure or flat array depending on API response
        const jobList = Array.isArray(data) ? data : (data.data || []);
        setJobs(jobList);
      })
      .catch((err) => console.error('Failed to load jobs', err))
      .finally(() => setLoading(false));
  }, []);

  // Derived Data for Filter Options
  const departments = useMemo(() => {
    const depts = new Set(jobs.map(j => j.department || 'General'));
    return ['All', ...Array.from(depts)];
  }, [jobs]);

  const locations = useMemo(() => {
    const locs = new Set(jobs.map(j => j.location || 'Remote'));
    return ['All', ...Array.from(locs)];
  }, [jobs]);

  // Filter Logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || (job.department || 'General') === selectedDept;
    const matchesLoc = selectedLoc === 'All' || (job.location || 'Remote') === selectedLoc;
    return matchesSearch && matchesDept && matchesLoc;
  });

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans selection:bg-[var(--color-primary)] selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <div className="bg-[var(--color-text-dark)] text-white py-24 px-6 relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-primary)]/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/2 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in text-[var(--color-secondary-mint)]">
            We are hiring
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight animate-slide-up">
            Join the mission to build <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-orange-300">the future of work.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            We&apos;re looking for thinkers, doers, and dreamers who want to make a dent in the universe. Explore our open roles below.
          </p>
        </div>
      </div>

      {/* Filter Section (Floating) */}
      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white p-3 rounded-[20px] shadow-xl border border-[var(--color-border)] flex flex-col md:flex-row gap-2 items-center backdrop-blur-xl">

          {/* Search */}
          <div className="relative flex-1 w-full md:w-auto group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Search roles (e.g. Designer)..."
              className="w-full pl-12 pr-4 py-4 bg-transparent rounded-[var(--radius-md)] focus:bg-[var(--color-neutral-50)] outline-none transition-all text-base placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Dropdowns */}
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="flex-1 md:w-48 py-3.5 px-4 bg-transparent rounded-xl font-medium text-sm cursor-pointer hover:bg-[var(--color-neutral-50)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-dark)] border-none"
            >
              {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
            </select>

            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="flex-1 md:w-48 py-3.5 px-4 bg-transparent rounded-xl font-medium text-sm cursor-pointer hover:bg-[var(--color-neutral-50)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all text-[var(--color-text-dark)] border-none"
            >
              {locations.map(l => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
            </select>
          </div>

          <button className="hidden md:block bg-[var(--color-text-dark)] text-white p-4 rounded-[14px] hover:bg-black transition-colors shadow-lg">
            <SearchIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-baseline justify-between mb-12">
          <h2 className="text-3xl font-bold text-[var(--color-text-dark)] tracking-tight">
            Open Positions <span className="text-[var(--color-neutral-400)] font-medium ml-2 text-xl">{filteredJobs.length}</span>
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white rounded-2xl border border-[var(--color-border)] animate-pulse"></div>)}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job, i) => (
              <div key={job.id} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <PublicJobCard job={job} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-[var(--color-border)]">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-bold text-[var(--color-text-dark)]">No jobs found</h3>
            <p className="text-[var(--color-text-soft)] mt-2">Try adjusting your search criteria or clear filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedDept('All'); setSelectedLoc('All'); }}
              className="mt-6 text-[var(--color-primary)] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--color-border)] py-16 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 bg-[var(--color-text-dark)] text-white rounded flex items-center justify-center font-bold text-xs">A</div>
            <span className="font-bold text-lg tracking-tight text-[var(--color-text-dark)]">AcmeCorp</span>
          </div>
          <p className="text-body-large text-[var(--color-text-soft)] max-w-2xl mx-auto">
            Join our mission to build the future of recruitment. We&apos;re looking for passionate individuals to help us scale.
          </p>
          <div className="text-[var(--color-text-soft)] text-sm flex gap-8">
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Terms</a>
            <a href="#" className="hover:text-[var(--color-primary)] transition-colors">Contact</a>
          </div>
          <p className="text-[var(--color-neutral-400)] text-xs">
            &copy; {new Date().getFullYear()} Acme Corp.
          </p>
        </div>
      </footer>
    </div>
  );
}