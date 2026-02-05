
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Batch Stats ---");

    // 1. Get the most recent order
    const latestOrder = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { batch: true }
    });

    if (!latestOrder) {
        console.log("No orders found.");
    } else {
        console.log("Latest Order:");
        console.log(`  ID: ${latestOrder.id}`);
        console.log(`  Customer: ${latestOrder.customerName}`);
        console.log(`  Batch ID: ${latestOrder.batchId}`);
        console.log(`  Batch Name: ${latestOrder.batch?.batchName}`);
        console.log(`  Total Amount: ${latestOrder.totalAmount}`);
        console.log(`  Shipping Status: ${latestOrder.shippingStatus}`);
    }

    // 2. Get Batches with raw counts
    if (latestOrder && latestOrder.batchId) {
        const batch = await prisma.batch.findUnique({
            where: { id: latestOrder.batchId },
            include: {
                _count: {
                    select: { orders: true }
                },
                orders: {
                    select: { totalAmount: true }
                }
            }
        });

        if (batch) {
            console.log("\nBatch Data (Raw from DB):");
            console.log(`  ID: ${batch.id}`);
            console.log(`  Name: ${batch.batchName}`);
            console.log(`  Stored Total Orders: ${batch.totalOrders}`);
            console.log(`  Stored Total Sales: ${batch.totalSales}`);
            console.log(`  Calculated Order Count (_count.orders): ${batch._count.orders}`);

            const calculatedSales = batch.orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            console.log(`  Calculated Sales (sum of orders): ${calculatedSales}`);
        } else {
            console.log("\nBatch not found for latest order.");
        }
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
