const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'chelsea.superadmin@gmail.com';
    const roleName = 'Super Admin';

    // 1. Find or Create the Role
    let role = await prisma.role.findUnique({
        where: { name: roleName },
    });

    if (!role) {
        console.log(`Role '${roleName}' not found. Creating it...`);
        role = await prisma.role.create({
            data: { name: roleName },
        });
    }

    // 2. Update the User
    const user = await prisma.user.update({
        where: { email: email },
        data: {
            roleId: role.id,
            // We also update the legacy string column just in case
            role: roleName,
            // Update permissions to true for everything for Super Admin if needed
            permissions: {
                dashboard: true,
                orders: true,
                batches: true,
                inventory: true,
                customers: true,
                reports: true,
                users: true,
                settings: true
            }
        },
    });

    console.log(`Updated user ${user.email} with role ${role.name}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
