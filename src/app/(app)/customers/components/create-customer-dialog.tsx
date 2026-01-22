
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
import { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer } from "../actions";

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allCustomers: Customer[];
  onCustomerAdded?: () => void;
}

export function CreateCustomerDialog({
  isOpen,
  onClose,
  allCustomers,
  onCustomerAdded,
}: CreateCustomerDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const handleSave = async () => {
    if (!name || !email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out name and email.",
      });
      return;
    }

    try {
      const addressParts = address.split(',').map(s => s.trim());

      const newCustomerData: Omit<Customer, 'id'> = {
          name,
          email,
          phone,
          avatar: '',
          address: {
              street: addressParts[0] || 'N/A',
              city: addressParts[1] || 'N/A',
              state: addressParts[2] || 'N/A',
              zip: addressParts[3] || 'N/A'
          },
          orderHistory: [],
          totalSpent: 0
      };

      await createCustomer(newCustomerData);

      onClose();
      toast({
        title: "Customer Created",
        description: `Customer ${newCustomerData.name} has been successfully created.`,
      });
      resetForm();

      // Notify parent component to refresh the list
      if (onCustomerAdded) {
        onCustomerAdded();
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create customer. Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new customer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
           <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              id="address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="Street, City, State, Zip Code"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Add Customer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
