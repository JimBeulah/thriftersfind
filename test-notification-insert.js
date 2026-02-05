const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const notificationId = `n${Math.random().toString(36).substring(2, 15)}`;
        const now = new Date();

        // Pick an existing user to assign to (or first user found)
        const user = await prisma.user.findFirst();
        const userId = user ? user.id : 'test-user-id';

        console.log(`Attempting to insert notification with Date object: ${now} for user ${userId}`);

        await prisma.$executeRawUnsafe(
            `INSERT INTO notifications (id, title, message, type, \`read\`, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, 0, ?, ?, ?)`,
            notificationId,
            "Test Realtime",
            "This is a test notification to verify Date insert.",
            "test",
            now,
            now,
            userId
        );

        console.log("Insert successful.");

        const inserted = await prisma.$queryRawUnsafe(`SELECT * FROM notifications WHERE id = ?`, notificationId);
        console.log("Retrieved:", inserted);

    } catch (e) {
        console.error("Error inserting notification:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
