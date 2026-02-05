
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Orders by Batch (Last 10) ---");

    // Get orders that have a batchId
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: {
            batchId: {
                not: null
            }
        },
        include: { batch: true }
    });

    orders.forEach(order => {
        console.log(`Order ID: ${order.id}`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Batch: ${order.batch.batchName} (${order.batchId})`);
        console.log(`  Total: ${order.totalAmount}`);
        console.log(`  Payment: ${order.paymentStatus}`);
        console.log(`  Shipping: ${order.shippingStatus}`);
        console.log("------------------------------------------------");
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
