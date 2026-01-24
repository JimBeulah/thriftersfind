"use client";

import * as React from "react";
import { Order, PaymentStatus, ShippingStatus, Customer, Product, Station, Batch } from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, Truck, Calendar, Filter, Archive, User, Package, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

import { CreatePreOrderDialog } from "./create-pre-order-dialog";

interface PreOrderTableProps {
    orders: Order[];
    customers: Customer[];
    products: Product[];
    stations: Station[];
    batches: Batch[];
}

const statusBadgeStyles: Record<ShippingStatus, string> = {
    Pending: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
    Ready: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
    Shipped: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    Delivered: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    Claimed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    Cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    "Rush Ship": "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function PreOrderTable({ orders, customers, products, stations, batches }: PreOrderTableProps) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState<string>("all");
    const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);

    const filteredOrders = React.useMemo(() => {
        return orders.filter((order) => {
            const matchesSearch =
                order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.batch?.batchName || "").toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || order.shippingStatus === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm border">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        placeholder="Search orders, items, or batches..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Ready">Ready</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Rush Ship">Rush Ship</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button className="w-full sm:w-auto" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Pre order
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px]">Item Details</TableHead>
                            <TableHead className="w-[180px]">Batch Info</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <motion.tr
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                    >
                                        {/* Item Details Column */}
                                        <TableCell className="align-top py-4">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2 text-foreground">
                                                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                                                    <span className="line-clamp-1" title={order.itemName}>{order.itemName}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground pl-5.5">
                                                    Qty: {order.quantity} • {order.id.substring(0, 8)}
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Batch Info Column - Unique to Pre-orders */}
                                        <TableCell className="align-top py-4">
                                            {order.batch ? (
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 font-medium text-sm">
                                                        <Package className="h-3.5 w-3.5 text-indigo-500" />
                                                        {order.batch.batchName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Cutoff: {format(new Date(order.batch.cutoffDate), 'MMM d')}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic flex items-center gap-2 h-full py-2">
                                                    <Archive className="h-3.5 w-3.5" /> Unassigned
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Customer Column */}
                                        <TableCell className="align-top py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border">
                                                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                                        {getInitials(order.customerName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="grid gap-0.5">
                                                    <span className="font-medium text-sm leading-none">{order.customerName}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{order.paymentMethod}</span>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Status Column */}
                                        <TableCell className="align-top py-4">
                                            <Badge variant="outline" className={`font-normal ${statusBadgeStyles[order.shippingStatus]}`}>
                                                {order.shippingStatus}
                                            </Badge>
                                            {order.rushShip && (
                                                <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5">Rush</Badge>
                                            )}
                                        </TableCell>

                                        {/* Total Column */}
                                        <TableCell className="align-top text-right py-4 font-medium tabular-nums">
                                            ₱{order.totalAmount.toLocaleString()}
                                        </TableCell>

                                        {/* Action Column */}
                                        <TableCell className="align-top py-4">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="sr-only">Menu</span>
                                                <div className="bg-primary/20 p-1.5 rounded-md">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                            </Button>
                                        </TableCell>
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No pre-orders found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>
            <div className="text-xs text-center text-muted-foreground">
                Showing {filteredOrders.length} records • Data focuses on items and batch fulfillment.
            </div>

            <CreatePreOrderDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                customers={customers}
                products={products}
                stations={stations}
                batches={batches}
            />
        </div>
    );
}
