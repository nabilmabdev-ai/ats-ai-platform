'use client';

import React, { useState } from 'react';
import { DynamicDropdown, DropdownItem } from '@/components/ui/DynamicDropdown';

const smallItems = Array.from({ length: 10 }, (_, i) => ({ label: `Item ${i + 1}`, value: `item-${i + 1}` }));
const mediumItems = Array.from({ length: 30 }, (_, i) => ({ label: `Option ${i + 1}`, value: `option-${i + 1}` }));

// Mock async fetch
const fetchLargeItems = async (query: string): Promise<DropdownItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
    const allItems = Array.from({ length: 1000 }, (_, i) => ({ label: `User ${i + 1}`, value: `user-${i + 1}` }));
    if (!query) return allItems.slice(0, 20);
    return allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())).slice(0, 20);
};

export default function TestDropdownPage() {
    const [val1, setVal1] = useState('');
    const [val2, setVal2] = useState('');
    const [val3, setVal3] = useState('');

    return (
        <div className="min-h-screen bg-gray-50 p-10 space-y-12">
            <h1 className="text-3xl font-bold text-[var(--color-midnight)] mb-8">Dynamic Dropdown Test</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Small List */}
                <div className="bg-white p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">Small List (≤15)</h2>
                    <p className="text-sm text-gray-500 mb-4">Should render as a standard dropdown without search.</p>
                    <DynamicDropdown
                        label="Select Item"
                        items={smallItems}
                        onChange={setVal1}
                        initialValue={val1}
                        placeholder="Choose an item..."
                    />
                    <div className="mt-4 text-sm text-gray-600">Selected: {val1}</div>
                </div>

                {/* Medium List */}
                <div className="bg-white p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">Medium List (16-50)</h2>
                    <p className="text-sm text-gray-500 mb-4">Should include a search bar for easier filtering.</p>
                    <DynamicDropdown
                        label="Select Option"
                        items={mediumItems}
                        onChange={setVal2}
                        initialValue={val2}
                        placeholder="Search options..."
                    />
                    <div className="mt-4 text-sm text-gray-600">Selected: {val2}</div>
                </div>

                {/* Large List / Async */}
                <div className="bg-white p-6 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]">
                    <h2 className="text-lg font-semibold mb-4 text-[var(--color-primary)]">Large/Async List</h2>
                    <p className="text-sm text-gray-500 mb-4">Async fetching with search always visible.</p>
                    <DynamicDropdown
                        label="Search Users"
                        asyncFetch={fetchLargeItems}
                        onChange={setVal3}
                        initialValue={val3}
                        placeholder="Type to search users..."
                    />
                    <div className="mt-4 text-sm text-gray-600">Selected: {val3}</div>
                </div>

            </div>
        </div>
    );
}
