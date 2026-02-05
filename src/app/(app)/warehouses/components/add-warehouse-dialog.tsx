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
import { useToast } from "@/hooks/use-toast";
import { createWarehouseProduct } from "@/app/(app)/warehouses/server-actions";

import { Package, MapPin, Calendar, Image as ImageIcon, DollarSign, Hash, X, RefreshCw } from "lucide-react";

interface AddWarehouseDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddWarehouseDialog({ isOpen, onClose, onSuccess }: AddWarehouseDialogProps) {
    const { toast } = useToast();

    const [productName, setProductName] = useState("");
    const [baseSku, setBaseSku] = useState(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    const [variantColor, setVariantColor] = useState("");
    const [manufacture_date, setManufactureDate] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [location, setLocation] = useState("");
    const [quantity, setQuantity] = useState("");
    const [alertStock, setAlertStock] = useState("");
    const [cost, setCost] = useState("");
    const [retailPrice, setRetailPrice] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);



    const regenerateSku = () => {
        setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    };

    const resetForm = () => {
        setProductName("");
        regenerateSku();
        setVariantColor("");
        setManufactureDate("");
        setImageFile(null);
        setImagePreview(null);
        setLocation("");
        setQuantity("");
        setAlertStock("");
        setCost("");
        setRetailPrice("");

    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };



    const handleSave = async () => {
        const generatedSku = baseSku + (variantColor ? "-" + variantColor : "");

        if (!productName || !generatedSku) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Product Name and SKU are required.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageDataUrl = null;

            if (imageFile) {
                imageDataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            }

            const result = await createWarehouseProduct({
                productName,
                sku: generatedSku,
                manufacture_date: manufacture_date || null,
                image: imageDataUrl,
                location: location || null,
                quantity: quantity ? parseInt(quantity) : 0,
                alertStock: alertStock ? parseInt(alertStock) : 0,
                cost: cost ? parseFloat(cost) : 0,
                retailPrice: retailPrice ? parseFloat(retailPrice) : null,

            });

            if (result.success) {
                toast({
                    title: "Product Created",
                    description: `Product "${productName}" has been created successfully.`,
                });
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create product.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Add Warehouse Product</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new product to your warehouse inventory.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Basic Information
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="productName" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Product Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="productName"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="e.g. Vintage Shirt"
                                    className="w-full"
                                />
                            </div>


                            <div className="space-y-2">
                                <Label htmlFor="sku" className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    SKU <span className="text-red-500">*</span>
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        value={baseSku}
                                        readOnly
                                        className="bg-muted"
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Variant Color"
                                            value={variantColor}
                                            onChange={(e) => setVariantColor(e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            onClick={regenerateSku}
                                            size="icon"
                                            variant="outline"
                                            className="w-10 shrink-0"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image" className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Product Image
                            </Label>

                            {!imagePreview ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                                    <Input
                                        id="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-3 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                                            <ImageIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">
                                            Click to upload image
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            PNG, JPG up to 10MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 h-8 w-8 shadow-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                    <div className="absolute bottom-2 right-2 flex gap-2">
                                        <label htmlFor="change-image" className="cursor-pointer">
                                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 py-1">
                                                Change
                                            </div>
                                            <Input
                                                id="change-image"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inventory Details Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Inventory Details
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="manufacture_date" className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Manufacture Date
                                </Label>
                                <Input
                                    id="manufacture_date"
                                    type="date"
                                    value={manufacture_date}
                                    onChange={(e) => setManufactureDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location" className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g. Aisle 1, Shelf B"
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="quantity" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Quantity
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alertStock" className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Stock Alert
                                </Label>
                                <Input
                                    id="alertStock"
                                    type="number"
                                    min="0"
                                    value={alertStock}
                                    onChange={(e) => setAlertStock(e.target.value)}
                                    placeholder="0"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Pricing
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="cost" className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Cost
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <Input
                                        id="cost"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={cost}
                                        onChange={(e) => setCost(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="retailPrice" className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Retail Price
                                    <span className="text-xs text-gray-500 font-normal">(Optional)</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <Input
                                        id="retailPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={retailPrice}
                                        onChange={(e) => setRetailPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Add Product"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddWarehouseDialog;