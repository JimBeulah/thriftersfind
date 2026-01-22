"use server";

import { prisma } from "@/lib/prisma";
import { Batch } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";

export async function getBatches(): Promise<Batch[]> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return [];
        }

        const isSuperAdmin = user.role?.name === 'Super Admin';

        const batches = await prisma.batch.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                _count: {
                    select: { orders: true }
                },
                orders: {
                    select: { totalAmount: true }
                }
            }
        });

        // Filter batches based on user role
        const filteredBatches = isSuperAdmin
            ? batches
            : batches.filter(batch => {
                if (!(batch as any).createdBy) return false;
                const createdByData = (batch as any).createdBy as any;
                return createdByData?.uid === user.id;
            });

        return filteredBatches.map((batch: any) => ({
            id: batch.id,
            batchName: batch.batchName,
            deliveryDate: batch.deliveryDate.toISOString(),
            cutoffDate: batch.cutoffDate.toISOString(),
            status: batch.status as any,
            totalOrders: batch._count.orders,
            totalSales: batch.orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0),
        }));
    } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
    }
}

export async function createBatch(data: {
    batchName: string;
    deliveryDate: string;
    cutoffDate: string;
    status: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        const createdBy = user ? {
            uid: user.id,
            name: user.name,
            email: user.email
        } : { uid: "system", name: "System" };

        await prisma.batch.create({
            data: {
                batchName: data.batchName,
                deliveryDate: new Date(data.deliveryDate),
                cutoffDate: new Date(data.cutoffDate),
                status: data.status,
                createdBy: createdBy as any,
            },
        });

        revalidatePath("/batches");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating batch:", error);
        return { success: false, error: error.message || "Failed to create batch" };
    }
}
