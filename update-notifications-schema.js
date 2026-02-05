const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Adding userId column to notifications table...");
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE notifications ADD COLUMN userId VARCHAR(191) NULL`);
            console.log("Column userId added.");
        } catch (e) {
            if (e.message.includes("Duplicate column name")) {
                console.log("Column userId already exists.");
            } else {
                console.error("Error adding column:", e);
            }
        }

        console.log("Adding index on userId...");
        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX notifications_userId_idx ON notifications(userId)`);
            console.log("Index created.");
        } catch (e) {
            if (e.message.includes("Duplicate key")) {
                console.log("Index already exists.");
            } else {
                // MySQL specific error for duplicate index might vary, but we tread carefully
                console.warn("Error creating index (might already exist):", e.message);
            }
        }

    } catch (e) {
        console.error("Critical error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
