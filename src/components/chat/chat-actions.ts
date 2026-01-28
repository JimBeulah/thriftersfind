"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function sendMessage(receiverId: string, content: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: currentUser.id,
                receiverId,
            },
        });

        // Revalidate the path to update the UI
        // Ideally we would use a more granular revalidation or a subscription
        revalidatePath("/");

        return { success: true, message };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

export async function getMessages(otherUserId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, error: "Unauthorized" };
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUser.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUser.id },
                ],
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                sender: {
                    select: { name: true },
                },
            },
        });

        return { success: true, data: messages };
    } catch (error: any) {
        console.error("Failed to fetch messages detailed error:", error);
        if (error instanceof Error) {
            console.error("Stack:", error.stack);
        }
        return { success: false, error: `Failed to fetch messages: ${error.message || "Unknown error"}` };
    }
}

export async function getUnreadCounts() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return {};

        const unreadMessages = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: currentUser.id,
                read: false,
            },
            _count: {
                id: true
            }
        });

        const counts: Record<string, number> = {};
        unreadMessages.forEach(group => {
            counts[group.senderId] = group._count.id;
        });

        return counts;
    } catch (error) {
        console.error("Failed to get unread counts:", error);
        return {};
    }
}

export async function markMessagesAsRead(senderId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { success: false };

        await prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: currentUser.id,
                read: false
            },
            data: {
                read: true
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark messages as read:", error);
        return { success: false };
    }
}

export async function getAllWarehouseProducts() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const products = await prisma.warehouseProduct.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50 for now to avoid overload
        });
        return products;
    } catch (error) {
        console.error("Failed to fetch warehouse products:", error);
        return [];
    }
}

export async function transferStock(
    warehouseProductId: string,
    destination: "quantity" | "warehouse",
    quantity: number
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const warehouseProduct = await prisma.warehouseProduct.findUnique({
            where: { id: warehouseProductId }
        });

        if (!warehouseProduct) {
            return { success: false, error: "Warehouse product not found" };
        }

        if (quantity <= 0 || quantity > warehouseProduct.quantity) {
            return { success: false, error: "Invalid transfer quantity" };
        }

        // Check if product exists in inventory by SKU
        const inventoryProduct = await prisma.product.findUnique({
            where: { sku: warehouseProduct.sku }
        });

        if (inventoryProduct) {
            // Update existing product quantity
            const updateData: any = {};
            updateData[destination] = (inventoryProduct as any)[destination] + quantity;

            await prisma.product.update({
                where: { id: inventoryProduct.id },
                data: updateData
            });
        } else {
            // Create new product in inventory
            const productData: any = {
                name: warehouseProduct.productName,
                sku: warehouseProduct.sku,
                cost: warehouseProduct.cost,
                retailPrice: warehouseProduct.retailPrice || 0,
                images: warehouseProduct.images,
                quantity: 0,
                // branch2 removed
                warehouse: 0, // specific warehouse field in Product table
                alertStock: 0,
                description: `Transferred from Warehouse Product`,
            };
            productData[destination] = quantity;

            await prisma.product.create({ data: productData });
        }

        // Reduce quantity in warehouse
        const newQuantity = warehouseProduct.quantity - quantity;

        if (newQuantity === 0) {
            // Delete warehouse product if quantity reaches 0
            await prisma.warehouseProduct.delete({
                where: { id: warehouseProductId }
            });
        } else {
            // Update warehouse product quantity
            await prisma.warehouseProduct.update({
                where: { id: warehouseProductId },
                data: { quantity: newQuantity }
            });
        }

        revalidatePath('/'); // Revalidate everything to be safe
        return { success: true };
    } catch (error: any) {
        console.error("Error transferring stock:", error);
        return { success: false, error: error.message || "Failed to transfer product" };
    }
}

export async function getProductBySku(sku: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { sku }
        });
        return product;
    } catch (error) {
        console.error("Error fetching product by SKU:", error);
        return null;
    }
}
