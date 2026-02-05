"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Customer } from '@/lib/types';
import { ApexOptions } from 'apexcharts';

// Dynamically import Chart to avoid SSR issues
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TopCustomersChartProps {
  customers: Customer[];
}

export default function TopCustomersChart({ customers }: TopCustomersChartProps) {
  const chartData = useMemo(() => {
    if (!customers) return { series: [], categories: [] };

    const sortedCustomers = [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10); // Show top 10

    const series = [{
      name: 'Total Spent',
      data: sortedCustomers.map(c => c.totalSpent)
    }];

    const categories = sortedCustomers.map(c => c.name);

    return { series, categories };
  }, [customers]);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: 'inherit'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: 'center', // inside bar
        },
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return typeof val === 'number' ? `₱${val.toFixed(2)}` : val;
      },
      style: {
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: chartData.categories,
      labels: {
        formatter: function (val) {
          return typeof val === 'number' ? `₱${val.toFixed(0)}` : val;
        }
      }
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return `₱${val.toFixed(2)}`;
        }
      }
    },
    colors: ['#0ea5e9'], // A nice blue similar to standard charts (Tailwind's sky-500)
    grid: {
      show: true,
      borderColor: '#e5e7eb',
      strokeDashArray: 0,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
    }
  };

  if (!customers || customers.length === 0) {
    return <div className="p-4 text-center text-gray-500">No customer data available</div>;
  }

  return (
    <div className="w-full min-h-[350px]">
      <ReactApexChart
        options={chartOptions}
        series={chartData.series}
        type="bar"
        height={350}
      />
    </div>
  );
}
