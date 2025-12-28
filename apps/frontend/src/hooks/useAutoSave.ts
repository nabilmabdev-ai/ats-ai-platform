import { useState, useEffect } from 'react';

export function useAutoSave(value: string, saveFunction: (val: string) => Promise<void>, delay = 2000) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedValue, setLastSavedValue] = useState(value);

    useEffect(() => {
        if (value === lastSavedValue) return;

        const handler = setTimeout(async () => {
            setIsSaving(true);
            try {
                await saveFunction(value);
                setLastSavedValue(value);
            } catch (error) {
                console.error("Auto-save failed", error);
            } finally {
                setIsSaving(false);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [value, lastSavedValue, delay, saveFunction]);

    return { isSaving };
}
