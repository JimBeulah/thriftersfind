const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const now = new Date();
        // Add a small buffer (e.g., 1 minute) to avoid deleting just-created valid ones if clocks are slightly off
        // But since the bad ones are 8 hours ahead, strict NOW() is fine.

        console.log("Deleting notifications created in the future (invalid timestamps)...");
        const { count } = await prisma.notification.deleteMany({
            where: {
                createdAt: {
                    gt: now
                }
            }
        });

        console.log(`Deleted ${count} invalid notifications.`);
    } catch (e) {
        console.error("Error cleaning up notifications:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
