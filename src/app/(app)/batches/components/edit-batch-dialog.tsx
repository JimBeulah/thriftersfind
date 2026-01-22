
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Batch } from "@/lib/types";

interface EditBatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
}

type BatchStatus = "Open" | "Closed" | "Delivered" | "Cancelled";

export function EditBatchDialog({ isOpen, onClose, batch }: EditBatchDialogProps) {
  const { toast } = useToast();

  const [batchName, setBatchName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [status, setStatus] = useState<BatchStatus>("Open");

  useEffect(() => {
    if (batch) {
      setBatchName(batch.batchName);
      setDeliveryDate(batch.deliveryDate);
      setCutoffDate(batch.cutoffDate);
      setStatus(batch.status);
    }
  }, [batch]);

  const handleSave = () => {
    if (!batch) return;

    if (!batchName || !deliveryDate || !cutoffDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all fields.",
      });
      return;
    }

    toast({
        title: "Batch Updated",
        description: `Batch "${batchName}" has been updated successfully.`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Batch</DialogTitle>
          <DialogDescription>
            Update the details for this delivery batch cycle.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="batchName">Batch Name</Label>
            <Input id="batchName" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Week 42 - Saturday" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deliveryDate">Delivery Date</Label>
            <Input id="deliveryDate" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cutoffDate">Cutoff Date</Label>
            <Input id="cutoffDate" type="date" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
             <Select value={status} onValueChange={(value: BatchStatus) => setStatus(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
