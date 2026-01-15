export interface Candidate {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedinUrl?: string;
    applications?: {
        id: string;
        status: string;
        jobId: string;
    }[];
}

export interface MatchReason {
    strategy: 'EMAIL' | 'PHONE_NAME' | 'LINKEDIN';
    confidence: 'EXACT' | 'HIGH' | 'MEDIUM';
    note?: string;
}

export interface DuplicateGroupMember {
    candidateId: string;
    candidate: Candidate;
    matchReason?: MatchReason;
    confidence: string;
}

export interface DuplicateGroup {
    id: string;
    createdAt: string;
    members: DuplicateGroupMember[];
}
