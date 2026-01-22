const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding branches and roles...');

    const branches = ['Branch 1', 'Branch 2'];
    const roles = ['super admin', 'staff'];

    for (const branchName of branches) {
        await prisma.branch.upsert({
            where: { name: branchName },
            update: {},
            create: { name: branchName },
        });
    }

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
