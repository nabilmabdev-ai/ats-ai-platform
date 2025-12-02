import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import { AppStatus } from '@prisma/client';

@Processor('applications')
export class ApplicationsProcessor extends WorkerHost {
    constructor(private prisma: PrismaService) {
        super();
    }

    async process(job: Job<any>) {
        if (job.name === 'reindex-candidate') {
            const { candidateId } = job.data;
            console.log(`Processing re-index for candidate ${candidateId}`);
            const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
            if (!candidate) {
                console.error(`Candidate ${candidateId} not found for re-indexing`);
                return;
            }

            const semanticText = `Candidate: ${candidate.firstName} ${candidate.lastName}\n${candidate.resumeText || ''}`;

            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            try {
                await axios.post(`${aiServiceUrl}/vectorize-candidate`, {
                    candidate_id: candidate.id,
                    text: semanticText,
                    location: candidate.location || 'Unknown',
                    experience: candidate.experience || 0,
                });
                console.log(`✅ Re-indexed candidate ${candidateId}`);
            } catch (e: any) {
                console.error(`❌ Failed to re-index candidate ${candidateId}`, e.message);
            }
            return;
        }

        const { applicationId, filePath, jobId } = job.data;
        console.log(`Processing application ${applicationId} for job ${jobId}`);

        try {
            // 1. Fetch Application to ensure it exists and get relations if needed
            const application = await this.prisma.application.findUnique({
                where: { id: applicationId },
                include: { job: { include: { screeningTemplate: true } }, candidate: true },
            });

            if (!application) {
                throw new Error(`Application ${applicationId} not found`);
            }

            // 2. Parse CV (Basic Extraction)
            let aiData: any = {};
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            try {
                const formData = new FormData();
                formData.append('file', fs.createReadStream(filePath));
                const aiResponse = await axios.post(
                    `${aiServiceUrl}/parse-cv`,
                    formData,
                    {
                        headers: { ...formData.getHeaders() },
                    },
                );
                aiData = aiResponse.data;
            } catch (error: any) {
                console.error('AI Parsing Failed:', error.message);
                // Update application with error flag
                await this.prisma.application.update({
                    where: { id: applicationId },
                    data: { aiParsingError: true },
                });
            }

            // 3. Advanced Screening
            let screeningResult: any = null;
            const jobData = application.job;
            const isAutoRejected = application.isAutoRejected;

            if (!isAutoRejected && jobData.screeningTemplate && aiData.raw_text) {
                console.log(
                    `🧠 Performing Advanced Screening using template: ${jobData.screeningTemplate.name}`,
                );
                try {
                    const screenRes = await axios.post(
                        `${aiServiceUrl}/screen-candidate`,
                        {
                            resume_text: aiData.raw_text,
                            job_description: jobData.descriptionText || '',
                            criteria: {
                                requiredSkills: jobData.screeningTemplate.requiredSkills || [],
                                niceToHaves: jobData.screeningTemplate.niceToHaves || [],
                                scoringWeights: jobData.screeningTemplate.scoringWeights || {},
                            },
                        },
                    );
                    screeningResult = screenRes.data;
                } catch (e: any) {
                    console.error('Screening Failed:', e.message);
                }
            }

            // 4. Update Candidate with AI Data
            await this.prisma.candidate.update({
                where: { id: application.candidateId },
                data: {
                    location: aiData.location || null,
                    education: aiData.education_level || null,
                    experience:
                        typeof aiData.experience_years === 'number'
                            ? aiData.experience_years
                            : 0,
                    resumeText: aiData.raw_text || '',
                },
            });

            // 5. Determine Score and Status
            const distScore = screeningResult
                ? screeningResult.match_score / 100 // <--- DIVIDE BY 100 HERE
                : null;

            let newStatus: AppStatus = application.status;
            // If status is APPLIED, we keep it APPLIED. 
            // If it was auto-rejected, it is REJECTED.

            // 6. Update Application
            await this.prisma.application.update({
                where: { id: applicationId },
                data: {
                    status: newStatus,
                    aiParsingData: screeningResult
                        ? { ...aiData, screening: screeningResult }
                        : aiData,
                    aiScore: distScore,
                    aiSummary: screeningResult?.summary || aiData['summary'] || '',

                    // [FIX] IMPORTANT: Clear the error flag on success
                    aiParsingError: false,
                },
            });

            // 7. Vectorize Async
            const semanticText = `Candidate: ${application.candidate.firstName} ${application.candidate.lastName} Skills: ${aiData.skills?.join(', ')}`;
            try {
                await axios.post(`${aiServiceUrl}/vectorize-candidate`, {
                    candidate_id: application.candidateId,
                    text: semanticText,
                    location: aiData.location || 'Unknown',
                    experience: aiData.experience_years || 0,
                });
            } catch (e) {
                console.error('Vectorization Failed:', e);
            }

            console.log(`Finished processing application ${applicationId}`);

        } catch (error) {
            console.error(`Failed to process application ${applicationId}:`, error);
            throw error;
        }
    }
}
