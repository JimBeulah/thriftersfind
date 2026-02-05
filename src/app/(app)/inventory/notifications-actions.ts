"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth-server";
import { unstable_noStore as noStore } from "next/cache";

export async function getNotifications() {
    noStore();
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const notifications = await prisma.$queryRawUnsafe(
            `SELECT * FROM notifications WHERE userId = ? OR userId IS NULL ORDER BY createdAt DESC LIMIT 20`,
            user.id
        );
        return notifications as any[];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

export async function markAllNotificationsAsRead() {
    try {
        await prisma.$executeRawUnsafe(
            `UPDATE notifications SET \`read\` = 1 WHERE \`read\` = 0`
        );
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, error: "Failed to mark notifications as read" };
    }
}

export async function createNotification(data: { title: string; message: string; type: string }) {
    try {
        const id = `n${Math.random().toString(36).substring(2, 15)}`;
        const now = new Date();
        await prisma.$executeRawUnsafe(
            `INSERT INTO notifications (id, title, message, type, \`read\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, ?, ?)`,
            id, data.title, data.message, data.type, now, now
        );
        revalidatePath("/");
        return { id, ...data, read: false, createdAt: now, updatedAt: now };
    } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error("Failed to create notification");
    }
}

