
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const batches = await prisma.batch.findMany({
        where: {
            batchName: {
                contains: 'test'
            }
        },
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

    console.log('Found batches:', JSON.stringify(batches, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
