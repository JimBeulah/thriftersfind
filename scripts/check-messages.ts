
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.message.count();
        console.log(`Total messages in DB: ${count}`);

        const lastMessages = await prisma.message.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            }
        });

        console.log("Last 5 messages:");
        lastMessages.forEach(msg => {
            console.log(`[${msg.createdAt.toISOString()}] ${msg.sender.name} -> ${msg.receiver.name}: ${msg.content}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
