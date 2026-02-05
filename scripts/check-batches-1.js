
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const batch = await prisma.batch.findFirst({
        where: { batchName: 'batches 1' },
        include: {
            _count: {
                select: {
                    orders: true,
                    preOrders: true,
                    products: true,
                    warehouseProducts: true
                }
            }
        }
    });

    console.log('Batch details:', JSON.stringify(batch, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
