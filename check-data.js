const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            paymentStatus: true,
            createdBy: true,
            orderDate: true
        }
    });
    console.log('Recent 10 Orders:', JSON.stringify(orders, null, 2));

    const paidOrders = await prisma.order.count({
        where: { paymentStatus: 'Paid' }
    });
    console.log('Total Paid Orders:', paidOrders);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
