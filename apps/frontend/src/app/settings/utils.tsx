'use client';
import React from 'react';

export const getBaseUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange?: (val: boolean) => void }) => {
    return (
        <button
            type="button"
            onClick={() => onChange && onChange(!enabled)}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );
};
