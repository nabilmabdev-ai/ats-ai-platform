import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { Readable } from 'stream';

// Mock pdfmake
const mockCreatePdfKitDocument = jest.fn();
jest.mock('pdfmake', () => {
    return jest.fn().mockImplementation(() => ({
        createPdfKitDocument: mockCreatePdfKitDocument,
    }));
});

describe('PdfService', () => {
    let service: PdfService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [PdfService],
        }).compile();

        service = module.get<PdfService>(PdfService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return a readable stream', () => {
        const mockStream = new Readable();
        mockStream.push('pdf-content');
        mockStream.push(null);
        mockCreatePdfKitDocument.mockReturnValue(mockStream);

        const docDefinition = { content: 'test' };
        const result = service.generatePdf(docDefinition);

        expect(mockCreatePdfKitDocument).toHaveBeenCalledWith(docDefinition, {});
        expect(result).toBeInstanceOf(Readable);
    });
});
