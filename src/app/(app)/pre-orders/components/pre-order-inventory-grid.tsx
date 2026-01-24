"use client";

import * as React from "react";
import { Product, Batch } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface PreOrderInventoryGridProps {
    products: Product[];
    batches: Batch[];
}

export default function PreOrderInventoryGrid({ products, batches }: PreOrderInventoryGridProps) {
    const [searchTerm, setSearchTerm] = React.useState("");
    const [batchFilter, setBatchFilter] = React.useState<string>("all");
    const [stockFilter, setStockFilter] = React.useState<string>("all");

    const filteredProducts = React.useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesBatch = batchFilter === "all" || product.batchId === batchFilter;

            const totalStock = (product.branch1 || 0) + (product.branch2 || 0) + (product.warehouse || 0);
            let matchesStock = true;
            if (stockFilter === "low") {
                matchesStock = totalStock > 0 && totalStock <= product.alertStock;
            } else if (stockFilter === "out") {
                matchesStock = totalStock === 0;
            } else if (stockFilter === "available") {
                matchesStock = totalStock > product.alertStock;
            }

            return matchesSearch && matchesBatch && matchesStock;
        });
    }, [products, searchTerm, batchFilter, stockFilter]);

    const getStockStatus = (product: Product) => {
        const totalStock = (product.branch1 || 0) + (product.branch2 || 0) + (product.warehouse || 0);
        if (totalStock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300" };
        if (totalStock <= product.alertStock) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300" };
        return { label: "In Stock", color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300" };
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl shadow-sm border">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={batchFilter} onValueChange={setBatchFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by batch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Batches</SelectItem>
                            {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.batchName}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={stockFilter} onValueChange={setStockFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Stock status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stock</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="low">Low Stock</SelectItem>
                            <SelectItem value="out">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Product Table */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[250px]">Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead className="text-center">Branch 1</TableHead>
                                <TableHead className="text-center">Branch 2</TableHead>
                                <TableHead className="text-center">Warehouse</TableHead>
                                <TableHead className="text-center">Total Stock</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => {
                                        const totalStock = (product.branch1 || 0) + (product.branch2 || 0) + (product.warehouse || 0);
                                        const status = getStockStatus(product);
                                        const batch = batches.find(b => b.id === product.batchId);

                                        return (
                                            <motion.tr
                                                key={product.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-primary flex-shrink-0" />
                                                        <span className="line-clamp-2">{product.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-muted-foreground">
                                                    {product.sku}
                                                </TableCell>
                                                <TableCell>
                                                    {batch ? (
                                                        <span className="text-sm">{batch.batchName}</span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center tabular-nums">
                                                    {product.branch1 || 0}
                                                </TableCell>
                                                <TableCell className="text-center tabular-nums">
                                                    {product.branch2 || 0}
                                                </TableCell>
                                                <TableCell className="text-center tabular-nums">
                                                    {product.warehouse || 0}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold tabular-nums">{totalStock}</span>
                                                    {totalStock <= product.alertStock && totalStock > 0 && (
                                                        <AlertCircle className="inline-block ml-2 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={status.color}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="text-xs text-center text-muted-foreground">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
