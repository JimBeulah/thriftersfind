
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Last 5 Orders ---");

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { batch: true }
    });

    orders.forEach(order => {
        console.log(`Order ID: ${order.id}`);
        console.log(`  Created At: ${order.createdAt}`);
        console.log(`  Customer: ${order.customerName}`);
        console.log(`  Batch: ${order.batchId ? `${order.batch.batchName} (${order.batchId})` : "NULL"}`);
        console.log(`  Total: ${order.totalAmount}`);
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
