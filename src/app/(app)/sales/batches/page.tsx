import { getBatchAnalytics } from "../actions";
import { BatchAnalyticsTable } from "./components/batch-analytics-table";
import { BatchSalesChart } from "./components/batch-sales-chart";
import { BatchAnalyticsFilter } from "./components/batch-analytics-filter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BatchAnalyticsPageProps {
    searchParams: {
        from?: string;
        to?: string;
    }
}

export default async function BatchAnalyticsPage({ searchParams }: BatchAnalyticsPageProps) {
    const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
    const toDate = searchParams.to ? new Date(searchParams.to) : undefined;

    const analyticsData = await getBatchAnalytics(fromDate, toDate);

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/sales">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                            Batch Analytics
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed sales performance and capital analysis per batch.
                        </p>
                    </div>
                </div>
                <BatchAnalyticsFilter />
            </div>

            <BatchSalesChart data={analyticsData} />

            <BatchAnalyticsTable data={analyticsData} />
        </div>
    );
}
