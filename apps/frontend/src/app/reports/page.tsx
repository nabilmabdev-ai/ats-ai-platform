'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';
import { Loader2, AlertCircle, TrendingUp, Users, Filter, Download } from 'lucide-react';

// --- Types ---
interface FunnelData {
    name: string;
    value: number;
}

interface PerformanceData {
    name: string;
    interviews: number;
}

interface TimeToHireData {
    date: string;
    days: number;
}

interface SourceData {
    name: string;
    value: number;
    [key: string]: any;
}

interface RejectionData {
    name: string;
    value: number;
}

interface StatsData {
    totalApplications: number;
    activeInterviews: number;
    outstandingOffers: number;
}

// --- Fetcher ---
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Colors ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportsPage() {
    const [period, setPeriod] = useState('30d'); // 7d, 30d, 90d, all

    // Calculate dates based on period
    const query = useMemo(() => {
        const end = new Date();
        const start = new Date();
        if (period === '7d') start.setDate(end.getDate() - 7);
        if (period === '30d') start.setDate(end.getDate() - 30);
        if (period === '90d') start.setDate(end.getDate() - 90);
        if (period === 'all') start.setFullYear(2000); // Far past

        return `startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
    }, [period]);
    // Force localhost:3001 to resolve environmental issues immediately
    const API_URL = 'http://localhost:3001';
    const fetcher = (url: string) => fetch(url).then(res => res.json());

    // 1. Fetch Integration
    const { data: funnel, error: funnelError } = useSWR<FunnelData[]>(`${API_URL}/reporting/funnel?${query}`, fetcher);
    const { data: performance, error: perfError } = useSWR<PerformanceData[]>(`${API_URL}/reporting/performance?${query}`, fetcher);
    const { data: timeToHire, error: timeError } = useSWR<TimeToHireData[]>(`${API_URL}/reporting/time-to-hire?${query}`, fetcher);
    const { data: source, error: sourceError } = useSWR<SourceData[]>(`${API_URL}/reporting/source?${query}`, fetcher);
    const { data: rejections, error: rejectError } = useSWR<RejectionData[]>(`${API_URL}/reporting/rejection-reasons?${query}`, fetcher);
    const { data: stats, error: statsError } = useSWR<StatsData>(`${API_URL}/reporting/stats?${query}`, fetcher);

    // 2. Loading State Calculation
    const isLoading = !funnel || !performance || !timeToHire || !source || !rejections || !stats;
    const isError = funnelError || perfError || timeError || sourceError || rejectError || statsError;

    if (isError) {
        return (
            <div className="flex h-screen flex-col items-center justify-center text-red-500">
                <AlertCircle className="mb-2 h-10 w-10" />
                <p>Failed to load analytics data.</p>
                <p className="text-sm text-gray-500">Ensure the backend Reporting Analysis is enabled.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 pb-32">
            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                    <p className="text-gray-500">Real-time insights into your recruitment pipeline.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border bg-white p-1 shadow-sm">
                        {['7d', '30d', '90d', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${period === p ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {p === 'all' ? 'All Time' : `Last ${p.replace('d', ' Days')}`}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 border">
                        <Download className="h-4 w-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Applications</p>
                            <h3 className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalApplications}</h3>
                        </div>
                        <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" /> +12% from previous period
                    </p>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Interviews</p>
                            <h3 className="mt-2 text-3xl font-bold text-gray-900">{stats?.activeInterviews}</h3>
                        </div>
                        <div className="rounded-full bg-purple-50 p-3 text-purple-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Scheduled in selected range</p>
                </div>

                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Outstanding Offers</p>
                            <h3 className="mt-2 text-3xl font-bold text-gray-900">{stats?.outstandingOffers}</h3>
                        </div>
                        <div className="rounded-full bg-green-50 p-3 text-green-600">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Pending acceptance</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

                {/* Recruitment Funnel */}
                <div className="col-span-1 rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">Recruitment Funnel</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={funnel}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Source Effectiveness (ROI) */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">Source Effectiveness (ROI)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={source}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {source?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Time to Hire Trends */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">Time to Hire (Avg Days)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeToHire}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="days"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recruiter Performance */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">Top Recruiters (Interviews Held)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="interviews" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Rejection Reasons */}
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                    <h3 className="mb-6 text-lg font-bold text-gray-900">Why Candidates are Rejected</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rejections}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
