"use client";

import * as React from "react";
// import { Product, Batch } from "@/lib/types"; // No longer using Product
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreHorizontal, Image as ImageIcon, X, AlertTriangle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { deleteProduct } from "@/app/(app)/inventory/actions"; // Use local delete action if it exists or create one?
// For now, I will use a placeholder delete since I haven't created deletePreOrderProduct
import { useToast } from "@/hooks/use-toast";
import { AddPreOrderProductDialog } from "./add-pre-order-product-dialog";

// Define PreOrderProduct type locally to match Schema
interface PreOrderProduct {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    quantity: number;
    alertStock: number;
    cost: number;
    retailPrice: number | null;
    images: any; // Json type in Prisma
    createdAt: Date;
    updatedAt: Date;
}

interface PreOrderInventoryGridProps {
    products: PreOrderProduct[];
}

export default function PreOrderInventoryGrid({ products }: PreOrderInventoryGridProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [stockFilter, setStockFilter] = React.useState<string>("all");
    const [isAddProductOpen, setIsAddProductOpen] = React.useState(false);

    // const [editingProduct, setEditingProduct] = React.useState<PreOrderProduct | null>(null);

    const filteredProducts = React.useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase());

            const quantity = product.quantity || 0;
            let matchesStock = true;
            if (stockFilter === "low") {
                matchesStock = quantity > 0 && quantity <= product.alertStock;
            } else if (stockFilter === "out") {
                matchesStock = quantity === 0;
            } else if (stockFilter === "available") {
                matchesStock = quantity > product.alertStock;
            }

            return matchesSearch && matchesStock;
        });
    }, [products, searchTerm, stockFilter]);

    const getStockStatus = (product: PreOrderProduct) => {
        const quantity = product.quantity || 0;
        if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const, icon: X };
        if (quantity <= product.alertStock) return { label: "Low Stock", variant: "destructive" as const, icon: AlertTriangle };
        return { label: "In Stock", variant: "secondary" as const, icon: null };
    };

    const handleDelete = async (productId: string) => {
        // Implement delete later
        toast({
            title: "Not Implemented",
            description: "Delete functionality for Pre-Order products is coming soon.",
        });
    }

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

                <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            {/* Product Table */}
            <Card className="rounded-xl border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead className="w-[200px]">Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-center">Total Stock</TableHead>
                                <TableHead className="text-right">Retail Price</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => {
                                        const status = getStockStatus(product);
                                        const StatusIcon = status.icon;

                                        // Handle images safely
                                        const imageUrl = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;

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
                                                <TableCell>
                                                    <Avatar className="h-10 w-10 rounded-md">
                                                        <AvatarImage src={imageUrl} alt={product.name} />
                                                        <AvatarFallback className="rounded-md bg-muted">
                                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className="line-clamp-2">{product.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm text-muted-foreground">
                                                    {product.sku}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="font-bold tabular-nums">{product.quantity}</span>
                                                </TableCell>
                                                <TableCell className="text-right tabular-nums">
                                                    ₱{product.retailPrice?.toFixed(2) || "0.00"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={status.variant} className="flex items-center justify-center gap-1 w-fit mx-auto">
                                                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Toggle menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* <DropdownMenuItem onClick={() => setEditingProduct(product)}>Edit</DropdownMenuItem> */}
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete the product
                                                                    from the inventory.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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

            <AddPreOrderProductDialog
                isOpen={isAddProductOpen}
                onClose={() => setIsAddProductOpen(false)}
                onSuccess={() => {
                    setIsAddProductOpen(false);
                    router.refresh();
                }}
            />
        </div>
    );
}
