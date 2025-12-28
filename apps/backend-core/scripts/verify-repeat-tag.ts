
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ApplicationsService } from './src/applications/applications.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const service = app.get(ApplicationsService);

    console.log('🔍 Fetching applications...');
    const result = await service.findAll(undefined, 'all', 1, 1);

    if (result.data.length > 0) {
        const app = result.data[0];
        console.log('📋 First Application Candidate:', app.candidate.email);
        console.log('🔢 Application Count:', (app.candidate as any)._count?.applications);

        if ((app.candidate as any)._count?.applications !== undefined) {
            console.log('✅ SUCCESS: Application count is present.');
        } else {
            console.error('❌ FAILURE: Application count is MISSING.');
            process.exit(1);
        }
    } else {
        console.log('⚠️ No applications found to verify.');
    }

    await app.close();
}

bootstrap();
