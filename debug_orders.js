
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching recent orders...');

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { batch: true }
    });

    for (const order of orders) {
        console.log('---------------------------------------------------');
        console.log(`Order ID: ${order.id}`);
        console.log(`Customer: ${order.customerName}`);
        console.log(`Status: ${order.shippingStatus}`);
        console.log(`Remarks: "${order.remarks}"`);
        console.log(`Items (Raw Type): ${typeof order.items}`);
        console.log(`Items (Value):`, JSON.stringify(order.items, null, 2));

        // Attempt parse
        let parsedItems = [];
        try {
            const raw = order.items;
            parsedItems = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : [];
            console.log(`Parsed Items Count: ${parsedItems.length}`);
            parsedItems.forEach((item, idx) => {
                console.log(`  Item ${idx + 1}: ProductID=${item.product?.id || item.productId}, Qty=${item.quantity}`);
            });
        } catch (e) {
            console.log('  Error parsing items:', e.message);
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
