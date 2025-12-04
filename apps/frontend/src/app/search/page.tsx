'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import DiscoveryView, { DiscoveryFilters } from './DiscoveryView';
import DatabaseView, { DatabaseFilters } from './DatabaseView';
import AddCandidateModal from '../components/AddCandidateModal';

const PAGE_SIZE = 10;

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  aiScore: number;
  resumeS3Key: string;
  location?: string;
  experience?: number;
  applications: {
    job: { title: string };
    status: string;
    createdAt: string;
    tags: string[];
  }[];
  createdAt: string;
}

interface Job {
  id: string;
  title: string;
}

type SearchFilters = DiscoveryFilters & DatabaseFilters;

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'database'>('discovery');

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    minExp: '',
    keywords: '',
    relocation: false,
    // Database Filters
    jobId: '',
    status: '',
    fromDate: '',
    toDate: '',
    tags: ''
  });

  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);

  // Fetch Jobs for Filters
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs?limit=100`);
        const data = await res.json();
        if (data.data) {
          setJobs(data.data);
        } else if (Array.isArray(data)) {
          setJobs(data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs', err);
      }
    };
    fetchJobs();
  }, []);

  const performSearch = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setHasSearched(true);
      setResults([]);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const params = new URLSearchParams();

      // Common Params
      if (query) params.append('q', query);
      if (filters.location) params.append('location', filters.location);
      if (filters.minExp) params.append('minExp', filters.minExp);
      if (filters.keywords) params.append('keywords', filters.keywords);

      // Database Params
      if (filters.jobId) params.append('jobId', filters.jobId);
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.tags) params.append('tags', filters.tags);

      params.append('page', currentPage.toString());
      params.append('limit', PAGE_SIZE.toString());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidates/search?${params.toString()}`);
      const rawData = await res.json() as Candidate[];
      const data = Array.from(new Map(rawData.map((item: Candidate) => [item.id, item])).values());

      if (isLoadMore) {
        setResults(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = data.filter((c: Candidate) => !existingIds.has(c.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setResults(data);
      }

      setHasMore(rawData.length === PAGE_SIZE);
      if (isLoadMore) setPage(currentPage);

    } catch (err) {
      console.error(err);
      alert('Search failed');
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [query, filters, page]);

  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performSearch(false);
  }, [performSearch]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadMore = useCallback(() => {
    performSearch(true);
  }, [performSearch]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 h-20 bg-white border-b border-[var(--color-border)] flex items-center px-8 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Talent Intelligence</h1>
            <p className="text-sm text-[var(--color-text-soft)]">AI-Powered Sourcing & Database Management</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Candidate
            </button>

            <div className="flex bg-[var(--color-neutral-100)] p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'discovery'
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                  }`}
              >
                ✨ Discovery
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'database'
                  ? 'bg-white text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-text-soft)] hover:text-[var(--color-text-dark)]'
                  }`}
              >
                🗄️ Database
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Content Views */}
        {activeTab === 'discovery' ? (
          <DiscoveryView
            query={query}
            setQuery={setQuery}
            filters={filters}
            setFilters={setFilters as unknown as (f: DiscoveryFilters) => void}
            results={results}
            loading={loading}
            hasSearched={hasSearched}
            handleSearch={handleSearch}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        ) : (
          <DatabaseView
            filters={filters}
            setFilters={setFilters as unknown as (f: DatabaseFilters) => void}
            results={results}
            loading={loading}
            handleSearch={handleSearch}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            jobs={jobs}
          />
        )}
      </div>

      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          performSearch(false);
        }}
      />
    </div>
  );
}