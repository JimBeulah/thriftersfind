
"use client";

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart";
import { Order } from '@/lib/types';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface SalesChartProps {
  orders: Order[];
  timeframe: "week" | "month" | "year";
}

export default function SalesChart({ orders, timeframe }: SalesChartProps) {
  const salesData = React.useMemo(() => {
    if (!orders) return [];

    if (timeframe === 'week') {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const salesByDay: { [key: string]: number } = {};
      days.forEach(day => {
        salesByDay[format(day, 'E')] = 0;
      });

      orders.forEach(order => {
        const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
        if (isWithinInterval(orderDate, { start: weekStart, end: weekEnd })) {
            const dayOfWeek = format(orderDate, "E");
            salesByDay[dayOfWeek] += order.totalAmount;
        }
      });
      return Object.entries(salesByDay).map(([day, sales]) => ({ time: day, sales }));
    }
    
    if (timeframe === 'month') {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // Get all weeks in the current month
        const weeks = eachWeekOfInterval({
            start: monthStart,
            end: monthEnd
        }, { weekStartsOn: 1 }); // Monday as start of the week

        const salesByWeek: { [key: string]: number } = {};
        weeks.forEach((week, index) => {
            salesByWeek[`Week ${index + 1}`] = 0;
        });

        orders.forEach(order => {
            const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
            if (isWithinInterval(orderDate, { start: monthStart, end: monthEnd })) {
                const weekNumber = Math.ceil((orderDate.getDate() - (orderDate.getDay() || 7) + 1) / 7);
                const weekKey = `Week ${weekNumber}`;
                 if(salesByWeek.hasOwnProperty(weekKey)) {
                   salesByWeek[weekKey] += order.totalAmount;
                 }
            }
        });

        return Object.entries(salesByWeek).map(([week, sales]) => ({ time: week, sales }));
    }


    if (timeframe === 'year') {
        const monthlySales: { [key: string]: number } = {};
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        monthOrder.forEach(month => {
            monthlySales[month] = 0;
        });

        orders.forEach(order => {
            const orderDate = (order.createdAt as any)?.seconds ? new Date((order.createdAt as any).seconds * 1000) : new Date(order.orderDate);
            const month = format(orderDate, "MMM");
            if (monthlySales.hasOwnProperty(month)) {
                 monthlySales[month] += order.totalAmount;
            }
        });
        
        return monthOrder.map(month => ({
            time: month,
            sales: monthlySales[month],
        })).filter(d => d.sales > 0);
    }
    
    return [];

  }, [orders, timeframe]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={salesData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="time"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
