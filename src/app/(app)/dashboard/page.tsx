
"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, Users, ShoppingCart, Archive, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import charts to disable SSR and prevent hydration mismatches
const SalesChart = dynamic(() => import("../reports/components/sales-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
      Loading chart...
    </div>
  ),
});

const BatchesChart = dynamic(() => import("./components/batches-chart"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
      Loading chart...
    </div>
  ),
});
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShippingStatus, Order, Customer, Batch } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval } from "date-fns";
import { getBatches } from "../batches/actions";
import { getAllOrders } from "../orders/actions";
import { ViewOrderDialog } from "../orders/components/view-order-dialog";

const shippingStatusStyles: Record<ShippingStatus, string> = {
  Pending: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  Ready: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  Shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  Delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  Claimed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  "Rush Ship": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
};


type Timeframe = "week" | "month" | "year";

export default function DashboardPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders
        // Fetch ALL orders (for dashboard aggregation)
        const ordersData = await getAllOrders();
        setAllOrders(ordersData);

        // Fetch customers
        const customersResponse = await fetch('/api/customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        setAllCustomers(customersData.success ? customersData.data : []);

        // Fetch batches using server action
        const batchesData = await getBatches();
        setAllBatches(batchesData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const heldOrders = allOrders.filter(order => order.paymentStatus === 'Hold');


  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (timeframe === 'week') {
      startDate = startOfWeek(now);
    } else if (timeframe === 'month') {
      startDate = startOfMonth(now);
    } else { // year
      startDate = startOfYear(now);
    }
    const endDate = endOfToday();

    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });

    const filteredCustomers = allCustomers.filter(customer => {
      const firstOrder = (customer.orderHistory || []).reduce((earliest, current) => {
        if (!earliest) return current;
        return new Date(current.date) < new Date(earliest.date) ? current : earliest;
      }, null as { date: string } | null);

      if (!firstOrder) return false;

      const creationDate = new Date(firstOrder.date);
      return isWithinInterval(creationDate, { start: startDate, end: endDate });
    });

    return { orders: filteredOrders, customers: filteredCustomers };

  }, [timeframe, allOrders, allCustomers]);

  const batchSummary = useMemo(() => {
    return allBatches.reduce((acc, batch) => {
      if (batch.status === 'Open') acc.open++;
      if (batch.status === 'Closed') acc.closed++;
      if (batch.status === 'Delivered') acc.completed++;
      return acc;
    }, { open: 0, closed: 0, completed: 0 });
  }, [allBatches]);

  const { orders: filteredOrders, customers: filteredCustomers } = filteredData;

  const topSales = useMemo(() => {
    const salesByProduct: Record<string, { id: string, itemName: string, quantity: number, totalAmount: number }> = {};

    filteredOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const name = item.product?.name || item.productName || "Unknown Item";
          const price = item.product?.retailPrice || item.product?.cost || 0;
          const amount = item.quantity * price;

          if (!salesByProduct[name]) {
            salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
          }
          salesByProduct[name].quantity += item.quantity;
          salesByProduct[name].totalAmount += amount;
        });
      } else {
        const name = order.itemName;
        if (!salesByProduct[name]) {
          salesByProduct[name] = { id: name, itemName: name, quantity: 0, totalAmount: 0 };
        }
        salesByProduct[name].quantity += order.quantity;
        salesByProduct[name].totalAmount += order.totalAmount;
      }
    });

    return Object.values(salesByProduct)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }, [filteredOrders]);

  const topBatches = useMemo(() => {
    return [...allBatches].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0)).slice(0, 5);
  }, [allBatches]);

  const totalSales = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = filteredOrders.length;
  const newCustomers = filteredCustomers.length;
  const heldOrdersCount = heldOrders.length;

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your store's performance
          </p>
        </div>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <div className="h-8 w-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              ₱{totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-pink-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{newCustomers}</div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Held Orders</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
              <Archive className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{heldOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Total orders on hold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-t-4 border-t-cyan-500/50 shadow-sm">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart orders={filteredOrders || []} timeframe={timeframe} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-t-4 border-t-pink-500/50 shadow-sm">
          <CardHeader>
            <CardTitle>Top Batches</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <BatchesChart batches={topBatches} height={350} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-t-4 border-t-purple-500/50">
          <CardHeader>
            <CardTitle>Top Sales (By Item)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="text-right font-semibold">Quantity</TableHead>
                  <TableHead className="text-right font-semibold">Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSales.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-cyan-700 dark:text-cyan-400">{item.itemName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-bold text-foreground">₱{item.totalAmount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {topSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                      No sales data for this period
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 shadow-sm border-t-4 border-t-emerald-500/50">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const recentItems = allOrders
                    .flatMap(order => {
                      if (order.items && order.items.length > 0) {
                        return order.items.map((item: any, index: number) => ({
                          id: `${order.id}-${index}`,
                          itemName: item.product?.name || item.productName || "Unknown Item",
                          quantity: item.quantity,
                          totalAmount: item.quantity * (item.product?.retailPrice || item.product?.cost || 0),
                          shippingStatus: order.shippingStatus,
                          customerName: order.customerName,
                          orderDate: order.orderDate
                        }));
                      } else {
                        return [{
                          id: order.id,
                          itemName: order.itemName,
                          quantity: order.quantity,
                          totalAmount: order.totalAmount,
                          shippingStatus: order.shippingStatus,
                          customerName: order.customerName,
                          orderDate: order.orderDate
                        }];
                      }
                    })
                    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                    .slice(0, 5);

                  return recentItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-medium text-pink-600 dark:text-pink-400">{item.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={shippingStatusStyles[item.shippingStatus as ShippingStatus]}>{item.shippingStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold">₱{item.totalAmount.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.quantity} pcs</div>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
                {allOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                      No recent sales
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl">Batch Summary</CardTitle>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/10 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Open Batches</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{batchSummary.open}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-900/10 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full">
                <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Closed Batches</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">{batchSummary.closed}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/10 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Completed Batches</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{batchSummary.completed}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>

      <ViewOrderDialog
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />
    </div>
  );
}
