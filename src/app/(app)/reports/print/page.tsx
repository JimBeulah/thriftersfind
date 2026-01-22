"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Order, Customer } from "@/lib/types";
import { getCustomers } from "../../customers/actions";
import { getSalesData } from "../../sales/actions";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SalesChart from "../components/sales-chart";
import CourierChart from "../components/courier-chart";
import TopCustomersChart from "../components/top-customers-chart";

function PrintReportContent() {
    const searchParams = useSearchParams();
    const timeframe = (searchParams.get("timeframe") as "week" | "month" | "year") || "month";
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const ordersData = await getSalesData("year");
            const customersData = await getCustomers();
            setAllOrders(ordersData);
            setAllCustomers(customersData);
            setIsLoaded(true);
        };
        fetchData();
    }, []);

    const filteredOrders = useMemo(() => {
        if (!allOrders) return [];
        const now = new Date();
        let startDate: Date;
        if (timeframe === 'week') startDate = startOfWeek(now);
        else if (timeframe === 'month') startDate = startOfMonth(now);
        else startDate = startOfYear(now);
        const endDate = endOfToday();

        return allOrders.filter(order => {
            const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
            return isWithinInterval(orderDate, { start: startDate, end: endDate });
        });
    }, [allOrders, timeframe]);

    useEffect(() => {
        if (isLoaded) {
            // Small delay to ensure charts are rendered before print
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoaded]);

    const totalSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const topProducts = useMemo(() => {
        const map = new Map<string, { name: string; qty: number; sales: number }>();
        filteredOrders.forEach(o => {
            const existing = map.get(o.itemName) || { name: o.itemName, qty: 0, sales: 0 };
            existing.qty += o.quantity;
            existing.sales += o.totalAmount;
            map.set(o.itemName, existing);
        });
        return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 10);
    }, [filteredOrders]);

    if (!isLoaded) return <div className="p-8 text-center">Preparing report...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto bg-white text-black min-h-screen print:p-0">
            <div className="flex justify-between items-start mb-8 border-b pb-4">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tighter">Sales Report</h1>
                    <p className="text-gray-500 mt-1">Generated on {format(new Date(), "PPPpp")}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-xl">ThriftersFind</p>
                    <p className="text-sm text-gray-500">Analytics Dashboard</p>
                    <p className="text-sm bg-gray-100 px-2 py-1 rounded inline-block mt-2 capitalize">{timeframe} View</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <Card className="shadow-none border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₱{totalSales.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-none border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalOrders}</div>
                    </CardContent>
                </Card>
                <Card className="shadow-none border-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase">Avg. Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">₱{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                <div>
                    <h2 className="text-xl font-bold mb-4 border-l-4 border-black pl-2">Sales Over Time</h2>
                    <div className="h-64 border rounded p-4">
                        <SalesChart orders={filteredOrders} timeframe={timeframe} />
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-4 border-l-4 border-black pl-2">Courier Distribution</h2>
                    <div className="h-64 border rounded p-4">
                        <CourierChart orders={filteredOrders} />
                    </div>
                </div>
            </div>

            <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-bold mb-4 border-l-4 border-black pl-2">Top Selling Products</h2>
                <Table className="border">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="font-bold">Product Name</TableHead>
                            <TableHead className="text-right font-bold">Quantity SOLD</TableHead>
                            <TableHead className="text-right font-bold">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topProducts.map((p) => (
                            <TableRow key={p.name}>
                                <TableCell className="font-medium text-lg">{p.name}</TableCell>
                                <TableCell className="text-right text-lg">{p.qty}</TableCell>
                                <TableCell className="text-right text-lg font-bold">₱{p.sales.toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="break-inside-avoid">
                <h2 className="text-xl font-bold mb-4 border-l-4 border-black pl-2">Top Customers</h2>
                <div className="h-80 border rounded p-4">
                    <TopCustomersChart customers={allCustomers} />
                </div>
            </div>

            <footer className="mt-12 pt-8 border-t text-center text-gray-400 text-xs">
                <p>Confidential Business Report - ThriftersFind &copy; {new Date().getFullYear()}</p>
                <p className="mt-1 italic">Note: Data reflects the selected {timeframe} period.</p>
            </footer>
        </div>
    );
}

export default function PrintReportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <PrintReportContent />
        </Suspense>
    );
}
