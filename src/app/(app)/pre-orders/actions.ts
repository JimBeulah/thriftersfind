"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export interface PreOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
}

export interface CreatePreOrderData {
    customerName: string;
    contactNumber?: string;
    address?: string;
    orderDate?: string;
    totalAmount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    depositAmount?: number;
    batchId?: string;
    customerId: string;
    customerEmail?: string;
    remarks?: string;
    items: PreOrderItem[];
}

export async function getPreOrders() {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const isSuperAdmin = user.role === "Super Admin";

        const preOrders = await prisma.preOrder.findMany({
            where: isSuperAdmin
                ? {}
                : {
                    createdBy: {
                        path: "$.uid",
                        equals: user.id,
                    },
                },
            include: {
                customer: true,
                batch: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                inventory: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return preOrders;
    } catch (error) {
        console.error("Failed to fetch pre-orders:", error);
        throw new Error("Failed to fetch pre-orders");
    }
}

export async function createPreOrder(data: CreatePreOrderData) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, name: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Create pre-order with items and inventory allocations in a transaction
        const preOrder = await prisma.$transaction(async (tx) => {
            // Create the pre-order
            const newPreOrder = await tx.preOrder.create({
                data: {
                    customerName: data.customerName,
                    contactNumber: data.contactNumber,
                    address: data.address,
                    orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
                    totalAmount: data.totalAmount,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus || "Unpaid",
                    depositAmount: data.depositAmount || 0,
                    batchId: data.batchId,
                    customerId: data.customerId,
                    customerEmail: data.customerEmail,
                    remarks: data.remarks,
                    createdBy: {
                        uid: user.id,
                        name: user.name,
                    },
                },
            });

            // Create pre-order items
            const itemsData = data.items.map((item) => ({
                preOrderId: newPreOrder.id,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                totalPrice: item.quantity * item.pricePerUnit,
            }));

            await tx.preOrderItem.createMany({
                data: itemsData,
            });

            // Create inventory allocations
            const inventoryData = data.items.map((item) => ({
                productId: item.productId,
                batchId: data.batchId,
                preOrderId: newPreOrder.id,
                quantityReserved: item.quantity,
                status: "Reserved",
            }));

            await tx.preOrderInventory.createMany({
                data: inventoryData,
            });

            return newPreOrder;
        });

        revalidatePath("/pre-orders");
        return preOrder;
    } catch (error) {
        console.error("Failed to create pre-order:", error);
        throw new Error("Failed to create pre-order");
    }
}

export async function updatePreOrder(
    id: string,
    data: Partial<CreatePreOrderData>
) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const preOrder = await prisma.preOrder.update({
            where: { id },
            data: {
                customerName: data.customerName,
                contactNumber: data.contactNumber,
                address: data.address,
                orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
                totalAmount: data.totalAmount,
                paymentMethod: data.paymentMethod,
                paymentStatus: data.paymentStatus,
                depositAmount: data.depositAmount,
                batchId: data.batchId,
                customerEmail: data.customerEmail,
                remarks: data.remarks,
            },
        });

        revalidatePath("/pre-orders");
        return preOrder;
    } catch (error) {
        console.error("Failed to update pre-order:", error);
        throw new Error("Failed to update pre-order");
    }
}

export async function deletePreOrder(id: string) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        // Delete pre-order (items and inventory will be cascade deleted)
        await prisma.preOrder.delete({
            where: { id },
        });

        revalidatePath("/pre-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete pre-order:", error);
        throw new Error("Failed to delete pre-order");
    }
}

export async function getPreOrderInventory() {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const inventory = await prisma.preOrderInventory.findMany({
            include: {
                product: true,
                batch: true,
                preOrder: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return inventory;
    } catch (error) {
        console.error("Failed to fetch pre-order inventory:", error);
        throw new Error("Failed to fetch pre-order inventory");
    }
}

export async function updatePreOrderInventoryStatus(
    id: string,
    status: "Reserved" | "Fulfilled" | "Cancelled"
) {
    try {
        const session = await auth();
        if (!session?.user) {
            throw new Error("Unauthorized");
        }

        const inventory = await prisma.preOrderInventory.update({
            where: { id },
            data: { status },
        });

        revalidatePath("/pre-orders");
        return inventory;
    } catch (error) {
        console.error("Failed to update inventory status:", error);
        throw new Error("Failed to update inventory status");
    }
}
