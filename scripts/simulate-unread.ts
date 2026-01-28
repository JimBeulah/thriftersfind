
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Get the last message
        const lastMessage = await prisma.message.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (lastMessage) {
            // Mark it as UNREAD
            await prisma.message.update({
                where: { id: lastMessage.id },
                data: { read: false }
            });
            console.log(`Marked message ${lastMessage.id} as UNREAD for testing.`);
            console.log(`Sender: ${lastMessage.senderId}, Receiver: ${lastMessage.receiverId}`);
        } else {
            console.log("No messages found to test.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
