
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const order = await prisma.order.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (!order) {
        console.log("No orders found.");
        return;
    }

    console.log("Order ID:", order.id);
    console.log("Shipping Status:", order.shippingStatus);
    console.log("Items (Raw Type):", typeof order.items);
    console.log("Items (Raw):", JSON.stringify(order.items, null, 2));

    let items: any = order.items;
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items);
        } catch (e) {
            console.error("Failed to parse items string:", e);
        }
    }

    console.log("Items (Parsed):", JSON.stringify(items, null, 2));

    if (Array.isArray(items)) {
        items.forEach((item: any, index: number) => {
            console.log(`Item ${index}:`);
            console.log(`  product?.id:`, item.product?.id);
            console.log(`  productId:`, item.productId);
            console.log(`  quantity:`, item.quantity);
        });
    } else {
        console.log("Items is not an array.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
