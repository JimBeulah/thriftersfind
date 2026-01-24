"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Customer, Order, PaymentStatus, ShippingStatus, PaymentMethod, Batch, OrderRemark, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check, Copy, Package, Trash2, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectProductDialog } from "../../orders/components/select-product-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon } from "lucide-react";
import { createOrder } from "../../orders/actions";
import { useRouter } from "next/navigation";
import { createCustomer } from "../../customers/actions";
import { Station } from "../../stations/actions";
import { format } from "date-fns";

interface CreatePreOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    customers: Customer[];
    products: Product[];
    stations: Station[];
    batches: Batch[];
}

const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];

export function CreatePreOrderDialog({
    isOpen,
    onClose,
    customers,
    products,
    stations,
    batches,
}: CreatePreOrderDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form States
    const [customerName, setCustomerName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [address, setAddress] = useState("");
    const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number | string }[]>([]);
    const [batchId, setBatchId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
    const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isProductSelectOpen, setProductSelectOpen] = useState(false);

    useEffect(() => {
        const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.product.retailPrice * (typeof item.quantity === 'string' ? 0 : item.quantity)), 0);
        setTotalAmount(itemsTotal);
    }, [selectedItems]);

    const resetForm = () => {
        setCustomerName("");
        setContactNumber("");
        setAddress("");
        setSelectedItems([]);
        setBatchId("");
        setPaymentMethod("COD");
        setTotalAmount(0);
        setOrderDate(new Date().toISOString().split('T')[0]);
        setIsSubmitting(false);
    };

    const handleSave = async () => {
        if (!customerName || selectedItems.length === 0 || !batchId) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please select a customer, batch, and at least one item.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
            let finalCustomerId = existingCustomer?.id;
            let finalCustomerEmail = existingCustomer?.email || `${customerName.split(' ').join('.').toLowerCase()}@example.com`;

            if (!existingCustomer) {
                // Auto-create customer if not exists
                const newCustomer = await createCustomer({
                    name: customerName,
                    email: finalCustomerEmail,
                    phone: contactNumber,
                    avatar: "",
                    address: {
                        street: address.split(',')[0] || "",
                        city: address.split(',')[1]?.trim() || "",
                        state: address.split(',')[2]?.trim() || "",
                        zip: "",
                    },
                    orderHistory: [],
                    totalSpent: 0,
                });
                finalCustomerId = newCustomer.id;
            }

            const combinedItemName = selectedItems.map(item => `${item.product.name} (x${item.quantity})`).join(', ');

            const orderData: Omit<Order, 'id' | 'createdAt'> = {
                customerId: finalCustomerId!,
                customerName: customerName,
                customerEmail: finalCustomerEmail,
                contactNumber: contactNumber || (existingCustomer ? existingCustomer.phone : ''),
                address: address || (existingCustomer ? `${existingCustomer.address.street}, ${existingCustomer.address.city}`.trim() : ''),
                orderDate: orderDate,
                itemName: combinedItemName,
                quantity: selectedItems.reduce((sum, item) => sum + (typeof item.quantity === 'string' ? 0 : item.quantity), 0),
                price: selectedItems[0]?.product.retailPrice || 0,
                shippingFee: 0, // Pre-orders usually TBD shipping
                totalAmount: totalAmount || 0,
                paymentMethod,
                paymentStatus: 'Unpaid',
                shippingStatus: 'Pending',
                batchId: batchId,
                courierName: '',
                trackingNumber: '',
                remarks: '',
                rushShip: false,
                createdBy: { uid: 'user-id', name: 'Current User' },
                items: selectedItems.map(item => ({
                    product: { id: item.product.id, name: item.product.name } as any,
                    quantity: typeof item.quantity === 'string' ? 0 : item.quantity
                })),
            };

            await createOrder(orderData);

            toast({
                title: "Pre-order Created",
                description: `Successfully added pre-order for ${customerName} to batch.`,
            });
            handleClose();
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Creating Pre-order",
                description: error instanceof Error ? error.message : "Something went wrong.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    }

    const handleCustomerSelect = (customer: Customer) => {
        setCustomerName(customer.name);
        setContactNumber(customer.phone);
        setAddress([customer.address.street, customer.address.city, customer.address.state].filter(Boolean).join(', '));
        setComboboxOpen(false);
    }

    const handleProductSelect = (newSelectedItems: { product: Product; quantity: number | string }[]) => {
        setSelectedItems(prev => {
            const updated = [...prev];
            newSelectedItems.forEach(newItem => {
                const existingIndex = updated.findIndex(item => item.product.id === newItem.product.id);
                if (existingIndex > -1) {
                    const currentQty = typeof updated[existingIndex].quantity === 'string' ? 0 : updated[existingIndex].quantity;
                    const newQty = typeof newItem.quantity === 'string' ? 0 : newItem.quantity;
                    updated[existingIndex].quantity = currentQty + newQty;
                } else {
                    updated.push(newItem);
                }
            });
            return updated;
        });
        setProductSelectOpen(false);
    };

    const removeItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateItemQuantity = (productId: string, quantity: string) => {
        setSelectedItems(prev => prev.map(item =>
            item.product.id === productId ? { ...item, quantity: quantity === "" ? "" : Math.max(0, parseInt(quantity) || 0) } : item
        ));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Package className="h-5 w-5 text-indigo-500" />
                            Create Pre-order
                        </DialogTitle>
                        <DialogDescription>
                            Add a new pre-order and assign it to a delivery batch.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {/* Batch Selection - Prominent for Pre-orders */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">1. Select Batch</Label>
                            <Select onValueChange={setBatchId} value={batchId}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select a batch..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.length === 0 && <SelectItem value="none" disabled>No active batches found</SelectItem>}
                                    {batches.map(batch => (
                                        <SelectItem key={batch.id} value={batch.id}>
                                            <span className="font-medium">{batch.batchName}</span>
                                            <span className="text-muted-foreground ml-2 text-xs">
                                                (Cutoff: {format(new Date(batch.cutoffDate), 'MMM d')})
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Customer Selection */}
                        <div className="space-y-3">
                            <Label className="text-base font-semibold">2. Customer Details</Label>
                            <div className="grid gap-4">
                                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={comboboxOpen} className="w-full justify-between h-10">
                                            {customerName || "Select or type customer name..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search customer..." value={customerName} onValueChange={setCustomerName} />
                                            <CommandList>
                                                <CommandEmpty>No customer found. Type name to create.</CommandEmpty>
                                                <CommandGroup>
                                                    {customers.map((customer) => (
                                                        <CommandItem key={customer.id} value={customer.name} onSelect={() => handleCustomerSelect(customer)}>
                                                            <Check className={cn("mr-2 h-4 w-4", customerName.toLowerCase() === customer.name.toLowerCase() ? "opacity-100" : "opacity-0")} />
                                                            {customer.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Phone Number" />
                                    <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
                                </div>
                            </div>
                        </div>

                        {/* Items Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">3. Order Items</Label>
                                <Button variant="secondary" size="sm" onClick={() => setProductSelectOpen(true)} className="h-8">
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Add Items
                                </Button>
                            </div>

                            {selectedItems.length === 0 ? (
                                <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground bg-muted/30">
                                    No items selected. Click "Add Items" to browse inventory.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedItems.map((item) => (
                                        <div key={item.product.id} className="flex items-center gap-3 p-2 bg-card border rounded-md">
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={item.product.images?.[0]} />
                                                <AvatarFallback><ImageIcon className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{item.product.name}</div>
                                                <div className="text-secondary-foreground text-xs">₱{item.product.retailPrice} each</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="w-16 h-8 text-center"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItemQuantity(item.product.id, e.target.value)}
                                                />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.product.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment & Date */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="grid gap-2">
                                <Label>Payment Method</Label>
                                <Select onValueChange={(v: PaymentMethod) => setPaymentMethod(v)} value={paymentMethod}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Estimated Total</Label>
                                <div className="h-10 px-3 flex items-center bg-muted font-bold rounded-md">
                                    ₱{totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t bg-muted/20">
                        <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[120px]">
                            {isSubmitting ? "Creating..." : "Confirm Pre-order"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SelectProductDialog
                isOpen={isProductSelectOpen}
                onClose={() => setProductSelectOpen(false)}
                onProductSelect={handleProductSelect}
                products={products}
            />
        </>
    );
}
