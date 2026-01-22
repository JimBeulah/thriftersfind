
"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Order, PaymentStatus, ShippingStatus, PaymentMethod, OrderRemark } from "@/lib/types";
import { getSmartSuggestions } from "../actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader, Lightbulb, WandSparkles } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface EditOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

const paymentStatuses: PaymentStatus[] = ["Hold", "Paid", "Unpaid", "PAID PENDING"];
const shippingStatuses: ShippingStatus[] = ["Pending", "Ready", "Shipped", "Delivered", "Cancelled", "Claimed"];
const paymentMethods: PaymentMethod[] = ["COD", "GCash", "Bank Transfer"];
const remarksOptions: OrderRemark[] = ["PLUS Branch 1", "PLUS Branch 2", "PLUS Warehouse"];


export function EditOrderDialog({
  isOpen,
  onClose,
  order,
}: EditOrderDialogProps) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [suggestion, setSuggestion] = useState<{ suggestedStatus: string; reasoning: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
        const batchId = order.paymentStatus === 'Hold' ? 'hold' : order.batchId;
        setCurrentOrder({ ...order, batchId });
    }
    setSuggestion(null); // Reset suggestion when a new order is opened
  }, [order]);

  const handleInputChange = (field: keyof Order, value: string | number | null | undefined | boolean) => {
    if (currentOrder) {
      let updatedOrder = { ...currentOrder, [field]: value };
       if (field === 'quantity' || field === 'price' || field === 'shippingFee' || field === 'rushShip') {
        const q = field === 'quantity' ? (typeof value === 'number' ? value : parseInt(String(value))) : updatedOrder.quantity;
        const p = field === 'price' ? (typeof value === 'number' ? value : parseFloat(String(value))) : updatedOrder.price;
        const sf = field === 'shippingFee' ? (typeof value === 'number' ? value : parseFloat(String(value))) : updatedOrder.shippingFee;
        const isRush = field === 'rushShip' ? value : updatedOrder.rushShip;
        const rushFee = isRush ? 50 : 0;
        updatedOrder.totalAmount = (q || 0) * (p || 0) + (sf || 0) + rushFee;
      }
      if (field === 'batchId') {
          if (value === 'hold') {
              updatedOrder.paymentStatus = 'Hold';
          } else if (currentOrder.paymentStatus === 'Hold') {
              updatedOrder.paymentStatus = 'Unpaid';
          }
      }
      setCurrentOrder(updatedOrder);
    }
  };
  
  const handlePaymentStatusChange = (value: PaymentStatus) => {
    if (currentOrder) {
      setCurrentOrder({ ...currentOrder, paymentStatus: value });
    }
  };
  
  const handleShippingStatusChange = (value: ShippingStatus) => {
    if (currentOrder) {
      setCurrentOrder({ ...currentOrder, shippingStatus: value });
    }
  };

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    if (currentOrder) {
      setCurrentOrder({ ...currentOrder, paymentMethod: value });
    }
  };
  
  const handleRemarkChange = (value: OrderRemark) => {
    if (currentOrder) {
      setCurrentOrder({ ...currentOrder, remarks: value });
    }
  };

  const handleSuggestion = () => {
    if (!currentOrder) return;
    startTransition(async () => {
      // @ts-ignore
      const result = await getSmartSuggestions(currentOrder);
      if (result.success && result.data) {
        setSuggestion(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch AI suggestion.",
        });
      }
    });
  };

  const applySuggestion = () => {
    if (suggestion) {
      handleShippingStatusChange(suggestion.suggestedStatus as ShippingStatus);
      setSuggestion(null);
    }
  };

  const handleSave = () => {
    if (currentOrder) {
      onClose();
      toast({
        title: "Order Updated",
        description: `Order ${currentOrder.id.substring(0,7)}... has been successfully updated.`,
      });
    }
  };
  
  if (!currentOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Order {order?.id.substring(0,7)}...</DialogTitle>
          <DialogDescription>
            Update order details and status. Use the AI assistant for smart status suggestions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer</Label>
              <Input id="customerName" value={currentOrder.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactNumber">Contact No.</Label>
              <Input id="contactNumber" value={currentOrder.contactNumber} onChange={(e) => handleInputChange('contactNumber', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={currentOrder.address} onChange={(e) => handleInputChange('address', e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="orderDate">Order Date</Label>
              <Input id="orderDate" type="date" value={currentOrder.orderDate} onChange={(e) => handleInputChange('orderDate', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input id="itemName" value={currentOrder.itemName} onChange={(e) => handleInputChange('itemName', e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" value={currentOrder.quantity} onChange={(e) => handleInputChange('quantity', parseInt(e.target.value, 10))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (PHP)</Label>
              <Input id="price" type="number" value={currentOrder.price} onChange={(e) => handleInputChange('price', parseFloat(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shippingFee">Shipping Fee</Label>
              <Input id="shippingFee" type="number" value={currentOrder.shippingFee} onChange={(e) => handleInputChange('shippingFee', parseFloat(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label>Total Amount</Label>
              <div className="font-bold text-lg pt-2">₱{currentOrder.totalAmount.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
              <Checkbox id="rushShip-edit" checked={currentOrder.rushShip} onCheckedChange={(checked) => handleInputChange('rushShip', Boolean(checked))} />
              <Label htmlFor="rushShip-edit">Rush Ship (+₱50)</Label>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="courierName">Courier Name</Label>
              <Input id="courierName" value={currentOrder.courierName || ''} onChange={(e) => handleInputChange('courierName', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input id="trackingNumber" value={currentOrder.trackingNumber || ''} onChange={(e) => handleInputChange('trackingNumber', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
              <Label htmlFor="remarks-edit">Remarks</Label>
              <Select onValueChange={handleRemarkChange} value={currentOrder.remarks || ''}>
                  <SelectTrigger>
                  <SelectValue placeholder="Select a remark (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                  {remarksOptions.map((r) => (
                      <SelectItem key={r} value={r}>
                      {r}
                      </SelectItem>
                  ))}
                  </SelectContent>
              </Select>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select onValueChange={handlePaymentMethodChange} value={currentOrder.paymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="border p-4 rounded-md grid gap-4">
             <h3 className="font-medium">Delivery & Status</h3>
             <div className="grid md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label htmlFor="batchId">Delivery Option</Label>
                    <Select onValueChange={(value) => handleInputChange('batchId', value)} value={currentOrder.batchId || ''}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select delivery option" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="hold">Hold for Next Batch</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="shippingStatus">Shipping Status</Label>
                    <Select onValueChange={handleShippingStatusChange} value={currentOrder.shippingStatus}>
                        <SelectTrigger>
                        <SelectValue placeholder="Select shipping status" />
                        </SelectTrigger>
                        <SelectContent>
                        {shippingStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                            {s}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select onValueChange={handlePaymentStatusChange} value={currentOrder.paymentStatus} disabled={currentOrder.batchId === 'hold'}>
                      <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                      {paymentStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                          {s}
                          </SelectItem>
                      ))}
                      </SelectContent>
                  </Select>
              </div>
            </div>
          </div>
          
          <div className="mt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSuggestion}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <WandSparkles className="mr-2 h-4 w-4" />
                  Suggest Shipping Status
                </>
              )}
            </Button>
          </div>

          {suggestion && (
            <div>
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>AI Suggestion: {suggestion.suggestedStatus}</AlertTitle>
                <AlertDescription>
                  {suggestion.reasoning}
                  <Button size="sm" variant="link" className="p-0 h-auto ml-2" onClick={applySuggestion}>
                    Apply Suggestion
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
