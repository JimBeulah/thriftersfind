
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
        const ordersResponse = await fetch('/api/orders');
        if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersResponse.json();
        setAllOrders(ordersData.success ? ordersData.data : []);

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
  const recentOrders = allOrders.slice(0, 5);

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
    // Show individual sales instead of merging
    return [...filteredOrders].sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.totalAmount - a.totalAmount;
    }).slice(0, 5);
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{totalSales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCustomers}</div>
            <p className="text-xs text-muted-foreground">For this {timeframe}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Held Orders</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{heldOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Total orders on hold</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart orders={filteredOrders || []} timeframe={timeframe} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders && recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {order.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={shippingStatusStyles[order.shippingStatus]}>{order.shippingStatus}</Badge>
                    </TableCell>
                    <TableCell className="text-right">₱{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewOrder(order)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Sales (By Item)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSales.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₱{item.totalAmount.toLocaleString()}</TableCell>
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Batches</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <BatchesChart batches={topBatches} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Batch Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground">Open Batches</p>
              <p className="text-2xl font-bold">{batchSummary.open}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full">
              <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-muted-foreground">Closed Batches</p>
              <p className="text-2xl font-bold">{batchSummary.closed}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground">Completed Batches</p>
              <p className="text-2xl font-bold">{batchSummary.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ViewOrderDialog
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />
    </div>
  );
}
