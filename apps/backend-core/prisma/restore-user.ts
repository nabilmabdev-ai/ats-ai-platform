import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'nabilmabdev@gmail.com';
    console.log(`Creating user ${email}...`);

    const passwordHash = await bcrypt.hash('password', 10);
    const defaultAvailability = {
        timezone: "Africa/Casablanca",
        schedule: {
            monday: [{ start: "09:00", end: "18:00" }],
            tuesday: [{ start: "09:00", end: "18:00" }],
            wednesday: [{ start: "09:00", end: "18:00" }],
            thursday: [{ start: "09:00", end: "18:00" }],
            friday: [{ start: "09:00", end: "18:00" }]
        }
    };

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash, // Reset password to known value
            role: Role.ADMIN, // Ensure ample permissions
        },
        create: {
            email,
            fullName: 'Nabil Mab',
            role: Role.ADMIN,
            passwordHash,
            availability: defaultAvailability
        }
    });

    console.log(`✅ User ${user.email} created/updated with password 'password'`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
