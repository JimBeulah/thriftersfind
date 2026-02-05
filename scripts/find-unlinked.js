
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000); // Look back 15 mins

    console.log('Checking for items modified after:', tenMinutesAgo);

    const preOrders = await prisma.preOrder.findMany({
        where: {
            updatedAt: { gte: tenMinutesAgo },
            batchId: null
        },
        select: { id: true, customerName: true, updatedAt: true }
    });

    const warehouseProducts = await prisma.warehouseProduct.findMany({
        where: {
            updatedAt: { gte: tenMinutesAgo },
            batchId: null
        },
        select: { id: true, productName: true, updatedAt: true }
    });

    const orders = await prisma.order.findMany({
        where: {
            updatedAt: { gte: tenMinutesAgo },
            batchId: null
        },
        select: { id: true, customerName: true, updatedAt: true }
    });

    console.log('Found potentially unlinked PreOrders:', preOrders);
    console.log('Found potentially unlinked WarehouseProducts:', warehouseProducts);
    console.log('Found potentially unlinked Orders:', orders);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
