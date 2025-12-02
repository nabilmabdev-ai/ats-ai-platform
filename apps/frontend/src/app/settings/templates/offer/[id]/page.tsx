'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import OfferTemplateEditor, { OfferTemplateData } from '@/app/settings/OfferTemplateEditor';

export default function OfferTemplatePage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';

    const [template, setTemplate] = useState<OfferTemplateData | null>(null);
    const [loading, setLoading] = useState(!isNew);

    useEffect(() => {
        if (!isNew) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/document-templates/${id}`)
                .then(res => res.json())
                .then(data => {
                    setTemplate(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id, isNew]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-[var(--color-text-soft)]">
                Loading template...
            </div>
        );
    }

    return <OfferTemplateEditor initialData={template} />;
}
