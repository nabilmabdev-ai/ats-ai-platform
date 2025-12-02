// --- Content from: src/app/loading.tsx ---

export default function Loading() {
    return (
        <div className="min-h-screen bg-[var(--color-background)] flex">
            {/* Sidebar Skeleton */}
            <div className="w-64 bg-white border-r border-[var(--color-border)] hidden md:flex flex-col p-6 gap-6">
                {/* Logo placeholder */}
                <div className="h-8 w-8 bg-gray-200 rounded-[var(--radius-md)] animate-pulse"></div>
                
                {/* Nav items */}
                <div className="space-y-4 mt-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 p-8">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-10">
                    <div className="space-y-3">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded-[var(--radius-md)] animate-pulse"></div>
                </div>

                {/* Grid Skeleton (Stats) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)] h-40 animate-pulse flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="h-10 w-10 bg-gray-200 rounded-[var(--radius-md)]"></div>
                                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table/List Skeleton */}
                <div className="mt-8 bg-white rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)] h-96 p-6 animate-pulse">
                    <div className="space-y-6">
                        {/* Fake Header Row */}
                        <div className="flex gap-4 mb-6 border-b border-gray-100 pb-4">
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                        </div>
                        {/* Rows */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex items-center gap-3 w-1/3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full shrink-0"></div>
                                    <div className="space-y-2 w-full">
                                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                        <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-1/6 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Brand Moment */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <div className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-[var(--radius-xl)] flex items-center justify-center text-2xl font-bold shadow-2xl animate-bounce">
                    A
                </div>
            </div>
        </div>
    );
}