export interface JobTemplate { id: string; name: string; structure: string; }
export interface ScreeningTemplate { id: string; name: string; requiredSkills: string[]; }
export interface OfferTemplate { id: string; name: string; type: string; }

export interface Company {
    id: string;
    name: string;
    logoUrl?: string;
    headerImageUrl?: string;
    showEmailHeader?: boolean;
    footerImageUrl?: string;
    showEmailFooter?: boolean;
    address?: string;
    showCompanyAddress?: boolean;
    careerPageUrl?: string;
    defaultTimezone?: string;
    aiTone?: string;
    enableAutoMerge?: boolean;
    emailTemplates?: Record<string, { subject: string; body: string }>;
    description?: string;
}
