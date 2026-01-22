"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import CourierChart from "./components/courier-chart";
import SalesChart from "./components/sales-chart";
import TopCustomersChart from "./components/top-customers-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Order, Customer } from "@/lib/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfWeek, startOfMonth, startOfYear, endOfToday, isWithinInterval } from "date-fns";
import { getCustomers } from "../customers/actions";
import { getSalesData } from "../sales/actions";

type Timeframe = "week" | "month" | "year";

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("year");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      // For reports, we might want a larger range of data initially
      const ordersData = await getSalesData("year");
      const customersData = await getCustomers();
      setAllOrders(ordersData);
      setAllCustomers(customersData);
    };
    fetchData();
  }, []);

  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];

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

    return allOrders.filter(order => {
      const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
      return isWithinInterval(orderDate, { start: startDate, end: endDate });
    });
  }, [allOrders, timeframe]);

  const orders = filteredOrders || [];
  const customers = allCustomers || [];

  return (
    <div className="flex flex-col gap-8" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <Button variant="outline" onClick={() => window.open(`/reports/print?timeframe=${timeframe}`, '_blank')}>
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Total sales from all orders for the selected period.</CardDescription>
            </div>
            {isMounted && (
              <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </CardHeader>
          <CardContent>
            {isMounted && (
              <>
                <div className="sm:hidden mb-4">
                  <Tabs value={timeframe} onValueChange={(value) => setTimeframe(value as Timeframe)} className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="week" className="flex-1">Week</TabsTrigger>
                      <TabsTrigger value="month" className="flex-1">Month</TabsTrigger>
                      <TabsTrigger value="year" className="flex-1">Year</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <SalesChart orders={orders} timeframe={timeframe} />
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Top 5 customers by total spending.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && <TopCustomersChart customers={customers} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Courier Usage</CardTitle>
              <CardDescription>Distribution of couriers used for shipments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMounted && <CourierChart orders={allOrders || []} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
