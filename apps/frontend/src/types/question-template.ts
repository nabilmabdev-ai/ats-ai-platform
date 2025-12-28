export interface Question {
    id: string;
    text: string;
    category: 'Role Specific' | 'Behavioral' | 'Red Flags' | 'Manual';
}

export interface QuestionTemplate {
    id: string;
    title: string;
    questions: Question[];
    isGlobal: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy?: {
        fullName: string | null;
    };
}
