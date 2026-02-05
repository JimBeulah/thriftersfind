const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to drop unique index on Product.sku...");
        // Try dropping the standard named index
        try {
            await prisma.$executeRawUnsafe(`DROP INDEX products_sku_key ON products`);
            console.log("Index 'products_sku_key' dropped.");
        } catch (e1) {
            console.log("Could not drop 'products_sku_key', attempting 'sku'...");
            try {
                await prisma.$executeRawUnsafe(`DROP INDEX sku ON products`);
                console.log("Index 'sku' dropped.");
            } catch (e2) {
                console.log("Could not drop 'sku' either. Checking what indexes exist...");
                const indexes = await prisma.$queryRawUnsafe(`SHOW INDEX FROM products`);
                console.log("Indexes on products table:", indexes);

                // Try to find the unique index on SKU
                const skuIndex = indexes.find(idx => idx.Column_name === 'sku' && idx.Non_unique === 0);
                if (skuIndex) {
                    console.log(`Found unique index '${skuIndex.Key_name}', dropping it...`);
                    await prisma.$executeRawUnsafe(`DROP INDEX ${skuIndex.Key_name} ON products`);
                    console.log("Dropped.");
                } else {
                    console.log("No unique index found on 'sku'. It might have been already dropped.");
                }
            }
        }
    } catch (e) {
        console.error("Critical error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
