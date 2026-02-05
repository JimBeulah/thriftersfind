
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Restoring "batch test"...');

    // 1. Re-create the batch
    // Note: We can't reuse the old ID, so we create a new one.
    // We'll try to match the original details as best as possible from the logs.
    const newBatch = await prisma.batch.create({
        data: {
            batchName: 'batch test',
            status: 'Open',
            manufactureDate: new Date('2026-01-30T00:00:00.000Z'), // From logs
            createdBy: {
                uid: "cml0g8gnr0005vd61ieo7ylav", // From logs
                name: "Super Admin",
                email: "superadmin@gmail.com"
            },
            // We can't easily force createdAt/updatedAt without direct SQL or model changes usually, 
            // but standard create is fine.
        }
    });

    console.log(`Created new batch with ID: ${newBatch.id}`);

    // 2. Re-link PreOrder
    const preOrderId = 'cml5wof9f0002r1yakt062qwf';
    const updatedPreOrder = await prisma.preOrder.update({
        where: { id: preOrderId },
        data: { batchId: newBatch.id }
    });
    console.log(`Re-linked PreOrder ${updatedPreOrder.id} to new batch.`);

    // 3. Re-link WarehouseProduct
    const warehouseProductId = 'cml4m35vw0001qskjh03es58s';
    const updatedProduct = await prisma.warehouseProduct.update({
        where: { id: warehouseProductId },
        data: { batchId: newBatch.id }
    });
    console.log(`Re-linked WarehouseProduct ${updatedProduct.id} to new batch.`);

    // 4. Verify Order is NOT linked
    const orderId = 'ojnrsv1q8jl';
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, batchId: true }
    });

    if (order && order.batchId === null) {
        console.log(`Verified Order ${order.id} remains unlinked (batchId: null).`);
    } else {
        console.warn(`WARNING: Order ${orderId} has batchId: ${order?.batchId}`);
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
