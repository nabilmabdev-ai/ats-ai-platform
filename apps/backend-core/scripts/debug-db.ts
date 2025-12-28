import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('Checking database connection...');
    // Mask the password for security in logs
    const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    console.log('Database URL (env):', maskedUrl);

    try {
        console.log(' querying information_schema...');
        const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'googleCalendarId';
    `;
        console.log('Column check result:', result);

        console.log('Attempting simple User fetch...');
        const users = await prisma.user.findMany({ take: 1 });
        console.log('Users found:', users.length);

    } catch (e) {
        console.error('Diagnostic Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
