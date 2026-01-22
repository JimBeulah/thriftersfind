"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getSalesData } from "../actions";
import { Order } from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalesReportPage() {
    const searchParams = useSearchParams();
    const timeframe = (searchParams.get("timeframe") as "week" | "month" | "year") || "month";
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getSalesData(timeframe);
            setOrders(data);
            setIsLoading(false);
            // Trigger print after data is loaded and rendered
            setTimeout(() => {
                window.print();
            }, 1000);
        };
        fetchData();
    }, [timeframe]);

    const metrics = useMemo(() => {
        const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;

        const productMap = new Map<string, { name: string; sales: number; quantity: number }>();
        orders.forEach(order => {
            const existing = productMap.get(order.itemName) || { name: order.itemName, sales: 0, quantity: 0 };
            existing.sales += order.totalAmount;
            existing.quantity += order.quantity;
            productMap.set(order.itemName, existing);
        });
        const topProducts = Array.from(productMap.values()).sort((a, b) => b.sales - a.sales);

        return { totalSales, totalOrders, topProducts };
    }, [orders]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p>Loading report data...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto bg-white text-black print:p-0">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h1 className="text-4xl font-bold">Sales Report</h1>
                    <p className="text-gray-500 capitalize">Timeframe: {timeframe}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xl">ThriftersFind</p>
                    <p>{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border p-4 rounded-lg">
                    <p className="text-sm text-gray-500 uppercase font-bold">Total Sales</p>
                    <p className="text-3xl font-bold">₱{metrics.totalSales.toLocaleString()}</p>
                </div>
                <div className="border p-4 rounded-lg">
                    <p className="text-sm text-gray-500 uppercase font-bold">Total Orders</p>
                    <p className="text-3xl font-bold">{metrics.totalOrders}</p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Product Performance</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {metrics.topProducts.map((product) => (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">{product.quantity}</TableCell>
                                <TableCell className="text-right">₱{product.sales.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell>{order.itemName}</TableCell>
                                <TableCell className="text-right">₱{order.totalAmount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-16 text-center text-sm text-gray-400 border-t pt-4">
                <p>© {new Date().getFullYear()} ThriftersFind. All rights reserved.</p>
                <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>

            <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
           nav, aside, button {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}
