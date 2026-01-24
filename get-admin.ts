
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: {
            role: {
                name: {
                    in: ['Super Admin', 'super admin', 'Admin', 'admin']
                }
            }
        },
        include: {
            role: true
        }
    });

    console.log('Found Admins:');
    admins.forEach(admin => {
        console.log(`Email: ${admin.email}, Name: ${admin.name}, Role: ${admin.role?.name}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
