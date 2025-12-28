import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvImportService } from './csv-import.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('csv-import')
export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) { }

  @Get()
  async getBatches() {
    return this.csvImportService.getBatches();
  }

  @Get(':id')
  async getBatch(@Param('id') id: string) {
    return this.csvImportService.getBatch(id);
  }

  @Delete(':id')
  async deleteBatch(@Param('id') id: string) {
    return this.csvImportService.deleteBatch(id);
  }

  @Post(':id/cancel')
  async cancelBatch(@Param('id') id: string) {
    return this.csvImportService.cancelBatch(id);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    // Return batch ID immediately
    const batchId = await this.csvImportService.importCsv(file.path, file.originalname);
    return { batchId, message: 'Import started in background' };
  }

  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(
            new BadRequestException('Only CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async analyzeCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.csvImportService.analyzeCsv(file.path);
  }
}
