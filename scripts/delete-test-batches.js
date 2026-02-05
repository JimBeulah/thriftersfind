
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Batch IDs identified from the finding script
    const batchIdsToDelete = [
        'cml0isrcg0000l0ts3st809xz', // "Batch test" (empty)
        'cml0jlgrh0001l0tsynxnz0k9'  // "batch test" (has relations)
    ];

    console.log(`Processing ${batchIdsToDelete.length} batches...`);

    for (const id of batchIdsToDelete) {
        const batch = await prisma.batch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        orders: true,
                        preOrders: true,
                        warehouseProducts: true
                    }
                }
            }
        });

        if (!batch) {
            console.log(`Batch ${id} not found, skipping.`);
            continue;
        }

        console.log(`Processing batch: ${batch.batchName} (${id})`);

        // Unlink Orders
        if (batch._count.orders > 0) {
            const updatedOrders = await prisma.order.updateMany({
                where: { batchId: id },
                data: { batchId: null }
            });
            console.log(`  Unlinked ${updatedOrders.count} orders.`);
        }

        // Unlink PreOrders
        if (batch._count.preOrders > 0) {
            const updatedPreOrders = await prisma.preOrder.updateMany({
                where: { batchId: id },
                data: { batchId: null }
            });
            console.log(`  Unlinked ${updatedPreOrders.count} pre-orders.`);
        }

        // Unlink WarehouseProducts
        if (batch._count.warehouseProducts > 0) {
            const updatedProducts = await prisma.warehouseProduct.updateMany({
                where: { batchId: id },
                data: { batchId: null }
            });
            console.log(`  Unlinked ${updatedProducts.count} warehouse products.`);
        }

        // Delete the batch
        await prisma.batch.delete({
            where: { id }
        });
        console.log(`  Batch deleted.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
