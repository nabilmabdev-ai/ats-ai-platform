'use client';

import { useState, useEffect, use } from 'react';
import JobTemplateEditor, { JobTemplateData } from '../../../JobTemplateEditor';

export default function EditJobTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [template, setTemplate] = useState<JobTemplateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/job/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Template not found');
        return res.json();
      })
      .then(data => {
        setTemplate(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Template...</div>;
  }

  if (!template) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Template not found.</div>;
  }

  return <JobTemplateEditor initialData={template} />;
}