import { prisma as db } from "@/lib/prisma";
import { InventoryLogsTable } from "./components/inventory-logs-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InventoryLogsPage() {
    const branches = await db.branch.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Inventory Logs
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track inventory movement and adjustments.
                    </p>
                </div>
            </div>

            <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Log History</CardTitle>
                </CardHeader>
                <CardContent>
                    <InventoryLogsTable branches={branches.map(b => ({
                        id: b.id,
                        name: b.name,
                        createdAt: b.createdAt.toISOString(),
                        updatedAt: b.updatedAt.toISOString()
                    }))} />
                </CardContent>
            </Card>
        </div>
    );
}
