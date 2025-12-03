import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fsPromises from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  constructor(
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(
    job: Job<{ offerId: string; docDefinition: TDocumentDefinitions }>,
  ) {
    if (job.name === 'generate-pdf') {
      const { offerId, docDefinition } = job.data;
      const pdfStream = this.pdfService.generatePdf(docDefinition);
      const pdfDir = path.join(process.cwd(), 'uploads', 'generated-offers');
      await fsPromises.mkdir(pdfDir, { recursive: true });
      const relativePdfPath = `/generated-offers/${offerId}.pdf`;
      const fullPdfPath = path.join(pdfDir, `${offerId}.pdf`);

      await pipeline(pdfStream, createWriteStream(fullPdfPath));

      await this.prisma.offer.update({
        where: { id: offerId },
        data: { generatedOfferUrl: relativePdfPath },
      });
    }
  }
}
