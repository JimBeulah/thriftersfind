
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting "batches 1"...');

    const batch = await prisma.batch.findFirst({
        where: { batchName: 'batches 1' }
    });

    if (!batch) {
        console.log('Batch "batches 1" not found.');
        return;
    }

    // Double check dependencies just in case
    const dependencies = await prisma.batch.findUnique({
        where: { id: batch.id },
        include: {
            _count: {
                select: {
                    orders: true,
                    preOrders: true,
                    warehouseProducts: true,
                    products: true
                }
            }
        }
    });

    if (dependencies._count.orders > 0 || dependencies._count.preOrders > 0 || dependencies._count.warehouseProducts > 0 || dependencies._count.products > 0) {
        console.error('Cannot delete: Batch has dependencies.');
        console.error(JSON.stringify(dependencies._count, null, 2));
        return;
    }

    await prisma.batch.delete({
        where: { id: batch.id }
    });

    console.log(`Batch "${batch.batchName}" (${batch.id}) successfully deleted.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
