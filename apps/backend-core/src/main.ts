import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: /http:\/\/localhost:\d+$/,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Resolve the uploads directory relative to the project root (where package.json is)
  // rather than the dist folder.
  const uploadDir = join(process.cwd(), 'uploads');

  // Ensure the folder exists to prevent startup errors if it's missing
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Static assets serving removed for security.
  // Uploads are now served via UploadsController with AuthGuard.

  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`📂 Static assets serving from: ${uploadDir}`);
}
bootstrap();
