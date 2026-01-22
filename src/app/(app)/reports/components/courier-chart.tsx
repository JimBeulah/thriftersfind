
"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig
} from "@/components/ui/chart";
import { Order } from "@/lib/types";

interface CourierChartProps {
  orders: Order[];
}

export default function CourierChart({ orders }: CourierChartProps) {
  const { chartConfig, courierUsageData } = React.useMemo(() => {
    const usage: { [key: string]: number } = {};
    orders.forEach(order => {
      // Use "Unassigned" if courierName is missing or empty
      const courier = order.courierName || "Unassigned";
      usage[courier] = (usage[courier] || 0) + 1;
    });

    const data = Object.entries(usage).map(([name, count]) => ({ name, count }));
    
    const config: ChartConfig = {
      count: { label: 'Count' },
    };
    data.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: `hsl(var(--chart-${index + 1}))`,
      };
    });

    return { chartConfig: config, courierUsageData: data };
  }, [orders]);

  if (courierUsageData.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No courier data available</div>
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[300px]"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={courierUsageData}
          dataKey="count"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
