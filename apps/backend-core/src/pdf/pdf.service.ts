import { Injectable } from '@nestjs/common';
import PdfPrinter = require('pdfmake');
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class PdfService {
  private printer: PdfPrinter;

  constructor() {
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  generatePdf(docDefinition: TDocumentDefinitions): NodeJS.ReadableStream {
    return this.printer.createPdfKitDocument(docDefinition, {});
  }
}
