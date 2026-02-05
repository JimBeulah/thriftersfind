const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking columns in products table...");
        const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM products`);
        console.log("Columns:", columns.map(c => c.Field));

        const hasBatchId = columns.some(c => c.Field === 'batchId');
        console.log("Has batchId:", hasBatchId);

        if (!hasBatchId) {
            console.log("Adding batchId column...");
            await prisma.$executeRawUnsafe(`ALTER TABLE products ADD COLUMN batchId VARCHAR(191) NULL`);
            console.log("batchId added.");

            console.log("Adding index for batchId...");
            await prisma.$executeRawUnsafe(`CREATE INDEX products_batchId_fkey ON products(batchId)`);
            console.log("Index created.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
