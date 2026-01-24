const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            role_rel: true,
        },
    });
    console.log('--- USERS START ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- USERS END ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
