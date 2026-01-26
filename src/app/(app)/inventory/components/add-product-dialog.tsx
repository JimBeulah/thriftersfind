
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { Image as ImageIcon, X, RefreshCw } from "lucide-react";
import { createProduct } from "../actions";
import { getBatches } from "../../batches/actions";
import { Batch } from "@/lib/types";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddProductDialog({ isOpen, onClose, onSuccess }: AddProductDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [variantColor, setVariantColor] = useState("");
  const [description, setDescription] = useState("");
  const [baseSku, setBaseSku] = useState(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
  const [branch1Qty, setBranch1Qty] = useState("0");
  const [cost, setCost] = useState("0.00");
  const [retailPrice, setRetailPrice] = useState("0.00");
  const [alertStock, setAlertStock] = useState("0");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  useEffect(() => {
    const fetchBatches = async () => {
      const data = await getBatches();
      setBatches(data);
    };
    if (isOpen) {
      fetchBatches();
    }
  }, [isOpen]);

  const sku = baseSku + (variantColor ? "-" + variantColor : "");

  const regenerateSku = () => {
    setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
  };

  const resetForm = () => {
    setName("");
    setVariantColor("");
    setBaseSku(String.fromCharCode(65 + Math.floor(Math.random() * 26)) + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0'));
    setDescription("");
    setBranch1Qty("0");
    setCost("0.00");
    setRetailPrice("0.00");
    setAlertStock("0");
    setImages([]);
    setImagePreviews([]);
    setSelectedBatchId("");
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
    const missingFields = [];
    if (!name) missingFields.push("Product Name");
    if (!description) missingFields.push("Description");
    if (!cost || parseFloat(cost) <= 0) missingFields.push("Cost");
    if (!retailPrice || parseFloat(retailPrice) <= 0) missingFields.push("Retail Price");
    if (!branch1Qty && branch1Qty !== "0") missingFields.push("Branch 1 Qty");
    if (!alertStock && alertStock !== "0") missingFields.push("Alert Stock");
    if (images.length === 0) missingFields.push("Product Images");

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: `Please fill in the following fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert uploaded files to data URLs
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

      const productData = {
        name,
        sku,
        description,
        branch1: parseInt(branch1Qty) || 0,
        branch2: 0, // No longer used in UI, set to 0
        alertStock: parseInt(alertStock) || 0,
        cost: parseFloat(cost) || 0,
        retailPrice: parseFloat(retailPrice) || 0,
        images: imageDataUrls,
        batchId: selectedBatchId || null,
      };

      await createProduct(productData);

      toast({
        title: "Product Added",
        description: `Product "${name}" has been added to the inventory.`,
      });

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details for the new product to add it to your inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input value={baseSku} readOnly />
                <div className="flex gap-2">
                  <Input placeholder="Variant Color" value={variantColor} onChange={(e) => setVariantColor(e.target.value)} />
                  <Button type="button" onClick={regenerateSku} size="icon" variant="outline" className="w-10">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="batch">Batch (Optional)</Label>
            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Batch</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batchName} ({new Date(batch.deliveryDate).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="branch1Qty">Branch 1 Quantity</Label>
              <Input id="branch1Qty" type="number" value={branch1Qty} onChange={(e) => setBranch1Qty(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alertStock">Alert Stock</Label>
              <Input id="alertStock" type="number" value={alertStock} onChange={(e) => setAlertStock(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (PHP)</Label>
              <Input id="cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="retailPrice">Retail Price (PHP)</Label>
              <Input id="retailPrice" type="number" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="images">Product Images</Label>
            <div className="border-2 border-dashed border-muted-foreground/50 rounded-md p-4 text-center">
              <Input
                id="images"
                type="file"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <Label htmlFor="images" className="cursor-pointer">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <span className="mt-2 block text-sm font-medium text-muted-foreground">Click to upload images</span>
              </Label>
            </div>
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">The first image will be used as the primary display image.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
