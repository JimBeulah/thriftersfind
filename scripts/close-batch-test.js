
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Closing "batch test"...');

    const batch = await prisma.batch.findFirst({
        where: { batchName: 'batch test' }
    });

    if (!batch) {
        console.log('Batch not found.');
        return;
    }

    const updatedBatch = await prisma.batch.update({
        where: { id: batch.id },
        data: { status: 'Closed' }
    });

    console.log(`Batch "${updatedBatch.batchName}" (${updatedBatch.id}) status updated to: ${updatedBatch.status}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
