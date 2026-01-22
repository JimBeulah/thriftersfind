
"use client";

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart";
import { Customer } from '@/lib/types';

const chartConfig = {
  totalSpent: {
    label: "Total Spent",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface TopCustomersChartProps {
  customers: Customer[];
}

export default function TopCustomersChart({ customers }: TopCustomersChartProps) {
  const topCustomersData = React.useMemo(() => {
    if (!customers) return [];
    
    return customers
      .map(c => ({ name: c.name, totalSpent: c.totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [customers]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={topCustomersData}
        layout="vertical"
        margin={{ left: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="capitalize"
          width={80}
        />
        <XAxis dataKey="totalSpent" type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="totalSpent" fill="var(--color-totalSpent)" radius={5} layout="vertical" />
      </BarChart>
    </ChartContainer>
  );
}
