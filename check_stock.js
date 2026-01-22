
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent orders timestamps and stock...');

    const orders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
    });

    for (const order of orders) {
        if (order.shippingStatus === 'Cancelled') {
            console.log(`Order ID: ${order.id}`);
            console.log(`  UpdatedAt: ${order.updatedAt}`);
            console.log(`  Remarks: ${order.remarks}`);

            const rawItems = order.items;
            const items = rawItems ? (typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems) : [];

            for (const item of items) {
                const productId = item.product?.id || item.productId;
                const product = await prisma.product.findUnique({ where: { id: productId } });
                if (product) {
                    console.log(`  Product: ${product.name}`);
                    console.log(`    Branch 1: ${product.branch1}`);
                    console.log(`    Branch 2: ${product.branch2}`);
                    console.log(`    Warehouse: ${product.warehouse}`);
                }
            }
            console.log('-----------------------------------');
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
