"use client";

import { useState } from "react";
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
import { Image as ImageIcon, X, Loader2 } from "lucide-react";
import { createProduct } from "../../inventory/actions";

interface CreatePreOrderProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (product: any) => void;
}

export function CreatePreOrderProductDialog({ isOpen, onClose, onSuccess }: CreatePreOrderProductDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName("");
        setSku("");
        setImages([]);
        setImagePreviews([]);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setImages(prev => [...prev, ...filesArray]);

            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Product name is required.",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Convert uploaded files to data URLs (if any)
            const imageDataUrls: string[] = [];

            for (const file of images) {
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                imageDataUrls.push(dataUrl);
            }

            // Auto-generate a simple SKU if not provided
            const finalSku = sku.trim()
                ? sku
                : (name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));

            const productData = {
                name,
                sku: finalSku,
                description: "Created via Pre-order",
                quantity: 0,
                alertStock: 0,
                cost: 0,
                retailPrice: 0,
                images: imageDataUrls,
                warehouseId: null,
            };

            const newProduct = await createProduct(productData);

            toast({
                title: "Product Created",
                description: `"${name}" has been created.`,
            });

            resetForm();
            onSuccess(newProduct);
            onClose();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create product.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                    <DialogDescription>
                        Quickly add a new item name and picture for this pre-order.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Vintage Denim Jacket"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sku">SKU (Optional)</Label>
                        <Input
                            id="sku"
                            placeholder="Auto-generated if blank"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Images</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                            <Input
                                id="pre-order-images"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            <Label htmlFor="pre-order-images" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <ImageIcon className="h-6 w-6 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Click to upload photos</span>
                            </Label>
                        </div>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <img
                                            src={preview}
                                            alt={`Preview ${index}`}
                                            className="w-full h-full object-cover rounded-md border"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Item"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
