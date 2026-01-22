"use client";

import * as React from 'react';
import { Pie, PieChart, Cell, Legend } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig
} from "@/components/ui/chart";
import { Batch } from '@/lib/types';

// Color palette for pie chart slices
const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

interface BatchesChartProps {
    batches: Batch[];
}

export default function BatchesChart({ batches }: BatchesChartProps) {
    const chartData = React.useMemo(() => {
        if (!batches || batches.length === 0) return [];

        // Take top 5 batches and format for chart
        return batches.map((batch, index) => ({
            name: batch.batchName,
            value: batch.totalSales || 0,
            fill: COLORS[index % COLORS.length],
        }));
    }, [batches]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        chartData.forEach((item, index) => {
            config[item.name] = {
                label: item.name,
                color: COLORS[index % COLORS.length],
            };
        });
        return config;
    }, [chartData]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No batch data available
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <PieChart>
                <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value) => `₱${Number(value).toLocaleString()}`}
                />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => {
                        const dataEntry = chartData.find(d => d.name === value);
                        return `${value}: ₱${dataEntry?.value.toLocaleString() || 0}`;
                    }}
                />
            </PieChart>
        </ChartContainer>
    );
}
