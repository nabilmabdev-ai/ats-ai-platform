
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function verify() {
    console.log('Verifying admin user...');
    const user = await prisma.user.findUnique({ where: { email: 'admin@iosolutions.com' } });

    if (!user) {
        console.log('❌ User admin@iosolutions.com NOT FOUND.');
        return;
    }

    console.log('✅ User Found:', user.id, user.role);

    const isMatch = await bcrypt.compare('password', user.passwordHash);
    if (isMatch) {
        console.log('✅ Password "password" is CORRECT.');
    } else {
        console.log('❌ Password "password" is INCORRECT.');
    }
}

verify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
