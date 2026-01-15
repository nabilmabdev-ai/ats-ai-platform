import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

export interface DeduplicationResult {
    matchFound: boolean;
    candidateId?: string;
    confidence: 'EXACT' | 'HIGH' | 'MEDIUM';
    strategyUsed: 'EMAIL' | 'PHONE_NAME' | 'LINKEDIN';
}

export interface CandidateInput {
    email?: string;
    phone?: string;
    name?: string;
    linkedinUrl?: string; // Phase 1: Not fully used for matching yet
}

@Injectable()
export class DeduplicationService {
    private readonly logger = new Logger(DeduplicationService.name);

    private phoneUtil = PhoneNumberUtil.getInstance();

    constructor(private prisma: PrismaService) { }

    async findMatch(input: CandidateInput): Promise<DeduplicationResult> {
        // 1. Strict Match: Email
        if (input.email) {
            const exactMatch = await this.prisma.candidate.findUnique({
                where: { email: input.email },
            });

            if (exactMatch) {
                this.logger.debug(`Exact match found for email: ${input.email}`);
                return {
                    matchFound: true,
                    candidateId: exactMatch.id,
                    confidence: 'EXACT',
                    strategyUsed: 'EMAIL',
                };
            }
        }

        // 2. Strict Match: LinkedIn URL
        if (input.linkedinUrl) {
            const linkedInMatch = await this.prisma.candidate.findFirst({
                where: { linkedinUrl: { equals: input.linkedinUrl, mode: 'insensitive' } }
            });

            if (linkedInMatch) {
                this.logger.debug(`Match found for LinkedIn URL: ${input.linkedinUrl}`);
                return {
                    matchFound: true,
                    candidateId: linkedInMatch.id,
                    confidence: 'HIGH',
                    strategyUsed: 'LINKEDIN'
                };
            }
        }

        // 3. Fuzzy Match: Name + Phone (E.164 Optimized)
        if (input.name && input.phone) {
            const match = await this.findFuzzyMatch(input.name, input.phone);
            if (match) {
                this.logger.debug(
                    `Fuzzy match found for ${input.name} / ${input.phone} -> ${match.id}`,
                );
                return {
                    matchFound: true,
                    candidateId: match.id,
                    confidence: 'HIGH', // Name + Phone is pretty high
                    strategyUsed: 'PHONE_NAME',
                };
            }
        }

        return { matchFound: false, confidence: 'EXACT', strategyUsed: 'EMAIL' };
    }

    public normalizePhone(phone: string): string | null {
        try {
            // Assume US/Canada if no country code provided (+), but google-libphonenumber handles '+' well.
            // If phone starts with 00, replace with +
            let phoneToParse = phone;
            if (phone.startsWith('00')) {
                phoneToParse = '+' + phone.substring(2);
            }
            // If it doesn't start with +, we might need a default region. Let's try 'US' or 'MA' (Morocco) as fallback?
            // ATS is international, but let's assume 'US' default if no code.
            // Actually, we should probably check if it starts with a known IDD or just try parsing.
            const number = this.phoneUtil.parseAndKeepRawInput(phoneToParse, 'US');

            if (this.phoneUtil.isValidNumber(number)) {
                return this.phoneUtil.format(number, PhoneNumberFormat.E164);
            }
            return null;
        } catch (e) {
            // Fallback to basic cleaning if parsing fails
            return null; // Or return cleaned string? Better return null to be strict.
        }
    }

    private async findFuzzyMatch(name: string, phone: string) {
        const lastName = name.split(' ')[1] || '';
        const normalizedInput = this.normalizePhone(phone);

        // Fallback if normalization fails (bad number), use legacy strip
        const searchPhone = normalizedInput ? normalizedInput : phone.replace(/\D/g, '');

        if (searchPhone.length > 5 && lastName.length > 2) {
            const candidates = await this.prisma.candidate.findMany({
                where: {
                    lastName: { equals: lastName, mode: 'insensitive' },
                },
            });

            const match = candidates.find((c) => {
                if (!c.phone) return false;

                // Normalize DB phone on the fly
                const dbPhoneNormalized = this.normalizePhone(c.phone);
                const dbPhoneRaw = c.phone.replace(/\D/g, '');

                // Compare Normalized to Normalized (Best)
                if (normalizedInput && dbPhoneNormalized) {
                    return normalizedInput === dbPhoneNormalized;
                }

                // Fallback: Compare Raw if one failed normalization
                return dbPhoneRaw === searchPhone.replace(/\D/g, ''); // Ensure searchPhone is raw digits if not normalized
            });

            return match;
        }
        return null;
    }
    /**
     * Comparison logic strictly for candidates already loaded in memory.
     * Used by ScanService for batch processing.
     */
    public checkFuzzyMatchOffline(
        source: { firstName?: string; lastName?: string; phone?: string },
        target: { firstName?: string; lastName?: string; phone?: string }
    ): boolean {
        // 1. Last Name Check
        const sourceLast = (source.lastName || '').trim().toLowerCase();
        const targetLast = (target.lastName || '').trim().toLowerCase();
        if (!sourceLast || !targetLast || sourceLast !== targetLast) {
            return false;
        }

        // 2. Phone Check
        if (!source.phone || !target.phone) return false;

        const sourceNorm = this.normalizePhone(source.phone);
        const targetNorm = this.normalizePhone(target.phone);

        if (sourceNorm && targetNorm) {
            return sourceNorm === targetNorm;
        }

        // Fallback: Raw digits
        const sourceRaw = source.phone.replace(/\D/g, '');
        const targetRaw = target.phone.replace(/\D/g, '');

        // Only match if phone has significant length
        if (sourceRaw.length > 5 && sourceRaw === targetRaw) {
            return true;
        }

        return false;
    }
}
