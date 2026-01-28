"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SalesLog } from "@prisma/client";
import { getSalesLogs, GetSalesLogsResult } from "@/actions/sales-logs";

export default function SalesLogsTable() {
    const [logsData, setLogsData] = React.useState<GetSalesLogsResult>({
        logs: [],
        totalLogs: 0,
        totalPages: 1,
        currentPage: 1
    });
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedLog, setSelectedLog] = React.useState<SalesLog | null>(null);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const result = await getSalesLogs(page);
            setLogsData(result);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage]);

    const handleRefresh = () => {
        fetchLogs(currentPage);
    }

    const handleViewDetails = (log: SalesLog) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    }

    const formatJSON = (data: any) => {
        if (!data) return "N/A";
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return "Invalid JSON";
        }
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Sales Logs</CardTitle>
                            <CardDescription>View all sales activities and history.</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Date</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logsData.logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logsData.logs.map((log) => (
                                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(log)}>
                                        <TableCell className="font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">{log.customerName || "-"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{log.orderId || log.preOrderId || "-"}</span>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={log.products || ""}>
                                            {log.products || "-"}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={log.description || ""}>
                                            {log.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(log.totalAmount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex items-center justify-between gap-4 p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Page {logsData.currentPage} of {logsData.totalPages} ({logsData.totalLogs} logs)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(logsData.totalPages, p + 1))}
                            disabled={currentPage === logsData.totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Sales Log Details</DialogTitle>
                        <DialogDescription>
                            {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Customer</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.customerName || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Total Amount</h4>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(selectedLog.totalAmount)}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Date</h4>
                                        <p className="text-sm text-muted-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Order ID</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.orderId || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Pre-Order ID</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.preOrderId || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.description}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Products (Action)</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.products}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 border-t pt-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Order Items (JSON)</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                                            {formatJSON(selectedLog.order_items)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Shipments (JSON)</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                                            {formatJSON(selectedLog.shipments)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">Orders Snapshot (JSON)</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
                                            {formatJSON(selectedLog.orders)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
