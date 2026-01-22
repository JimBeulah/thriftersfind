"use server";

import { prisma } from "@/lib/prisma";
import { Order } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { getCurrentUser } from "@/lib/auth-server";

export async function getSalesData(timeframe: "week" | "month" | "year"): Promise<Order[]> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return [];
        }

        const now = new Date();
        let startDate: Date;

        if (timeframe === 'week') {
            startDate = startOfWeek(now);
        } else if (timeframe === 'month') {
            startDate = startOfMonth(now);
        } else { // year
            startDate = startOfYear(now);
        }

        const endDate = endOfDay(now);

        const isSuperAdmin = user.role?.name === 'Super Admin';

        const orders = await prisma.order.findMany({
            where: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                paymentStatus: 'Paid',
            },
            orderBy: {
                orderDate: 'desc',
            },
        });

        // Filter orders based on user role
        const filteredOrders = isSuperAdmin
            ? orders
            : orders.filter(order => {
                if (!(order as any).createdBy) return false;
                const createdByData = (order as any).createdBy as any;
                return createdByData?.uid === user.id;
            });

        return filteredOrders.map((order: any) => ({
            id: order.id,
            customerName: order.customerName,
            contactNumber: order.contactNumber || "",
            address: order.address || "",
            orderDate: order.orderDate.toISOString(),
            itemName: order.itemName,
            quantity: order.quantity,
            price: order.price,
            shippingFee: order.shippingFee,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod as any,
            paymentStatus: order.paymentStatus as any,
            shippingStatus: order.shippingStatus as any,
            batchId: order.batchId,
            customerId: order.customerId,
            rushShip: order.rushShip,
            customerEmail: order.customerEmail || "",
            courierName: order.courierName || "",
            trackingNumber: order.trackingNumber || "",
            remarks: order.remarks as any,
        }));
    } catch (error) {
        console.error("Error fetching sales data:", error);
        return [];
    }
}
