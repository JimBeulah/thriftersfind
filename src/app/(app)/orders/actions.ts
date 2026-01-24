"use server";

import { Order, PaymentMethod, PaymentStatus, ShippingStatus, OrderRemark } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";

export async function getOrders(): Promise<Order[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const isSuperAdmin = user.role?.name === 'Super Admin';

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      batch: true,
    }
  });

  // Filter orders based on user role
  const filteredOrders = isSuperAdmin
    ? orders
    : orders.filter(order => {
      if (!(order as any).createdBy) return false;
      const createdByData = (order as any).createdBy as any;
      return createdByData?.uid === user.id;
    });

  return filteredOrders.map(order => ({
    id: order.id,
    customerName: order.customerName,
    contactNumber: order.contactNumber || "",
    address: order.address || "",
    orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : "",
    itemName: order.itemName,
    items: (order as any).items ? (typeof (order as any).items === 'string' ? JSON.parse((order as any).items) : (order as any).items) : [],
    quantity: order.quantity,
    price: order.price,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentMethod: (order.paymentMethod as PaymentMethod) || "COD",
    paymentStatus: (order.paymentStatus as PaymentStatus) || "Unpaid",
    shippingStatus: (order.shippingStatus as ShippingStatus) || "Pending",
    batchId: order.batchId,
    createdAt: order.createdAt,
    createdBy: (order.createdBy as any) || { uid: "system", name: "System" },
    customerId: order.customerId,
    customerEmail: order.customerEmail || "",
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    remarks: (order.remarks as OrderRemark) || "",
    rushShip: order.rushShip,
    batch: order.batch ? {
      ...order.batch,
      deliveryDate: order.batch.deliveryDate.toISOString().split('T')[0],
      cutoffDate: order.batch.cutoffDate.toISOString().split('T')[0],
      status: order.batch.status as any,
      totalOrders: order.batch.totalOrders || 0,
      totalSales: order.batch.totalSales || 0,
    } : undefined,
  }));
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'> & { items?: any[] }): Promise<Order> {
  try {
    const user = await getCurrentUser();
    const createdBy = user ? {
      uid: user.id, // Match the 'uid' expected by types and filter
      id: user.id,  // Also store 'id' for clarity
      name: user.name,
      email: user.email
    } : { uid: "system", name: "System" };

    const orderId = `o${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create the order using raw SQL to bypass Prisma client validation
      await tx.$executeRawUnsafe(
        `INSERT INTO orders (id, customerName, contactNumber, address, orderDate, itemName, items, quantity, price, shippingFee, totalAmount, paymentMethod, paymentStatus, shippingStatus, batchId, createdAt, updatedAt, customerId, customerEmail, courierName, trackingNumber, remarks, rushShip, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orderId,
        orderData.customerName,
        orderData.contactNumber || null,
        orderData.address || null,
        orderData.orderDate ? new Date(orderData.orderDate) : null,
        orderData.itemName,
        orderData.items ? JSON.stringify(orderData.items) : null,
        orderData.quantity,
        orderData.price,
        orderData.shippingFee,
        orderData.totalAmount,
        orderData.paymentMethod,
        orderData.paymentStatus,
        orderData.shippingStatus,
        orderData.batchId,
        now,
        now,
        orderData.customerId,
        orderData.customerEmail || null,
        orderData.courierName || null,
        orderData.trackingNumber || null,
        orderData.remarks || null,
        orderData.rushShip ? 1 : 0,
        JSON.stringify(createdBy)
      );

      // 2. Deduct from inventory if items are provided
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          const productId = item.product.id;
          const quantityToDeduct = item.quantity;
          const remark = orderData.remarks;

          let updateData: any = {};
          if (remark === "PLUS Branch 1") {
            updateData = { branch1: { decrement: quantityToDeduct } };
          } else if (remark === "PLUS Branch 2") {
            updateData = { branch2: { decrement: quantityToDeduct } };
          } else if (remark === "PLUS Warehouse" || !remark) {
            updateData = { warehouse: { decrement: quantityToDeduct } };
          }

          const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: updateData,
          });

          // 3. Create notifications if stock is low or out using raw SQL
          const totalStock = updatedProduct.branch1 + updatedProduct.branch2 + updatedProduct.warehouse;
          if (totalStock <= 0 || totalStock <= updatedProduct.alertStock) {
            const notifId = `n${Math.random().toString(36).substring(2, 15)}`;
            const title = totalStock <= 0 ? "Out of Stock Alert" : "Low Stock Alert";
            const message = totalStock <= 0
              ? `Product "${updatedProduct.name}" is now out of stock!`
              : `Product "${updatedProduct.name}" has only ${totalStock} left in stock.`;
            const type = totalStock <= 0 ? "out_of_stock" : "low_stock";

            await tx.$executeRawUnsafe(
              `INSERT INTO notifications (id, title, message, type, \`read\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, ?, ?)`,
              notifId, title, message, type, now, now
            );
          }
        }
      }

      // 4. Create Sales Log (Raw SQL)
      const logId = `sl${Math.random().toString(36).substring(2, 15)}`;
      const ordersJson = JSON.stringify({
        id: orderId,
        orderDate: orderData.orderDate,
        paymentStatus: orderData.paymentStatus,
        paymentMethod: orderData.paymentMethod,
        shippingStatus: orderData.shippingStatus,
        createdBy: createdBy
      });
      const shipmentsJson = JSON.stringify({
        address: orderData.address,
        courier: orderData.courierName,
        tracking: orderData.trackingNumber,
        shippingFee: orderData.shippingFee
      });
      const orderItemsJson = orderData.items ? JSON.stringify(orderData.items) : null;

      await tx.$executeRawUnsafe(
        `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        logId,
        orderId,
        "Order Created",
        orderData.itemName,
        ordersJson,
        orderData.customerName,
        orderData.totalAmount,
        shipmentsJson,
        orderItemsJson,
        now
      );

      return { id: orderId, createdAt: now };
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    return {
      ...orderData,
      id: newOrder.id,
      createdAt: newOrder.createdAt,
      createdBy: createdBy // Return correct creator
    };
  } catch (error: any) {
    console.error("CRITICAL ERROR in createOrder:", error);
    throw new Error(error.message || "Failed to create order due to a server error.");
  }
}



export async function updateOrder(id: string, data: Partial<Order>): Promise<Order> {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        customerName: data.customerName,
        contactNumber: data.contactNumber,
        address: data.address,
        orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
        itemName: data.itemName,
        quantity: data.quantity,
        price: data.price,
        shippingFee: data.shippingFee,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentStatus,
        shippingStatus: data.shippingStatus,
        batchId: data.batchId,
        customerId: data.customerId,
        customerEmail: data.customerEmail,
        courierName: data.courierName,
        trackingNumber: data.trackingNumber,
        remarks: data.remarks,
        rushShip: data.rushShip,
        createdBy: data.createdBy as any,
      },
    });

    // Create Sales Log for Update
    const now = new Date();
    const logId = `sl${Math.random().toString(36).substring(2, 15)}`;

    // Parse items if string
    const items = (updatedOrder as any).items ? (typeof (updatedOrder as any).items === 'string' ? JSON.parse((updatedOrder as any).items) : (updatedOrder as any).items) : [];

    const ordersJson = JSON.stringify({
      id: updatedOrder.id,
      orderDate: updatedOrder.orderDate,
      paymentStatus: updatedOrder.paymentStatus,
      paymentMethod: updatedOrder.paymentMethod,
      shippingStatus: updatedOrder.shippingStatus,
      createdBy: (updatedOrder as any).createdBy
    });
    const shipmentsJson = JSON.stringify({
      address: updatedOrder.address,
      courier: updatedOrder.courierName,
      tracking: updatedOrder.trackingNumber,
      shippingFee: updatedOrder.shippingFee
    });
    const orderItemsJson = JSON.stringify(items);

    await prisma.$executeRawUnsafe(
      `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      logId,
      updatedOrder.id,
      "Order Updated",
      updatedOrder.itemName,
      ordersJson,
      updatedOrder.customerName,
      updatedOrder.totalAmount,
      shipmentsJson,
      orderItemsJson,
      now
    );

    revalidatePath("/orders");
    revalidatePath("/customers");
    return {
      id: updatedOrder.id,
      customerName: updatedOrder.customerName,
      contactNumber: updatedOrder.contactNumber || "",
      address: updatedOrder.address || "",
      orderDate: updatedOrder.orderDate ? updatedOrder.orderDate.toISOString().split('T')[0] : "",
      itemName: updatedOrder.itemName,
      quantity: updatedOrder.quantity,
      price: updatedOrder.price,
      shippingFee: updatedOrder.shippingFee,
      totalAmount: updatedOrder.totalAmount,
      paymentMethod: (updatedOrder.paymentMethod as PaymentMethod) || "COD",
      paymentStatus: (updatedOrder.paymentStatus as PaymentStatus) || "Unpaid",
      shippingStatus: (updatedOrder.shippingStatus as ShippingStatus) || "Pending",
      batchId: updatedOrder.batchId,
      createdAt: updatedOrder.createdAt,
      createdBy: (updatedOrder.createdBy as any) || { uid: "system", name: "System" },
      customerId: updatedOrder.customerId,
      customerEmail: updatedOrder.customerEmail || "",
      courierName: updatedOrder.courierName || "",
      trackingNumber: updatedOrder.trackingNumber || "",
      remarks: (updatedOrder.remarks as OrderRemark) || "",
      rushShip: updatedOrder.rushShip,
    };
  } catch (error: any) {
    console.error("Error in updateOrder:", error);
    throw new Error(error.message || "Failed to update order.");
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  console.log(`Starting cancellation for order: ${orderId}`);
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get the order with items
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        console.error(`Order ${orderId} not found`);
        throw new Error("Order not found");
      }

      if (order.shippingStatus === "Cancelled") {
        console.log(`Order ${orderId} is already cancelled`);
        return;
      }

      // 2. Parse items
      const rawItems = (order as any).items;
      let items: any[] = [];
      try {
        items = rawItems ? (typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems) : [];
      } catch (parseError) {
        console.error(`Error parsing items for order ${orderId}:`, parseError);
      }

      console.log(`Order ${orderId} has ${items.length} items to restock`);

      if (!Array.isArray(items) || items.length === 0) {
        console.warn(`No items found for order ${orderId} in structured 'items' field.`);
      }

      // 3. Restock inventory
      for (const item of items) {
        const productId = item.product?.id || item.productId;
        // Robustly parse quantity, handling strings like "2", "2.0", etc.
        const rawQuantity = item.quantity;
        const quantityToIncrement = typeof rawQuantity === 'number' ? rawQuantity : parseInt(String(rawQuantity), 10);

        console.log(`Processing restock Item - ProductID: ${productId}, Quantity: ${quantityToIncrement} (Raw: ${rawQuantity})`);

        if (!productId) {
          console.error("Missing product ID in item:", JSON.stringify(item));
          continue;
        }

        if (isNaN(quantityToIncrement) || quantityToIncrement <= 0) {
          console.warn(`Skipping item with zero, invalid or missing quantity for product ${productId}. Parsed qty: ${quantityToIncrement}`);
          continue;
        }

        const remark = order.remarks ? order.remarks.trim() : "";
        let updateData: any = {};
        let location = "Warehouse";

        if (remark === "PLUS Branch 1") {
          updateData = { branch1: { increment: quantityToIncrement } };
          location = "Branch 1";
        } else if (remark === "PLUS Branch 2") {
          updateData = { branch2: { increment: quantityToIncrement } };
          location = "Branch 2";
        } else {
          // Default to warehouse for "PLUS Warehouse", null, or anything else
          // Also explicitly log that we are falling back to warehouse
          console.log(`Remark '${remark}' did not match Branch 1 or 2, defaulting to Warehouse.`);
          updateData = { warehouse: { increment: quantityToIncrement } };
        }

        console.log(`Restocking ${quantityToIncrement} of product ${productId} to ${location} (Remark: '${remark}')`);

        try {
          const updatedProd = await tx.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, branch1: true, branch2: true, warehouse: true } // Select returned data to confirm update
          });
          console.log(`Stock updated for ${productId}. New levels - B1: ${updatedProd.branch1}, B2: ${updatedProd.branch2}, WH: ${updatedProd.warehouse}`);
        } catch (updateError: any) {
          console.error(`Failed to restock product ${productId}:`, updateError.message);
          throw new Error(`Failed to restock product ${productId}: ${updateError.message}`);
        }
      }

      // 4. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          shippingStatus: "Cancelled"
        }
      });
      console.log(`Order ${orderId} marked as Cancelled`);

      // 5. Create Sales Log for Cancellation
      const now = new Date();
      const logId = `sl${Math.random().toString(36).substring(2, 15)}`;

      const ordersJson = JSON.stringify({
        id: orderId,
        orderDate: order.orderDate,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingStatus: "Cancelled",
        createdBy: (order as any).createdBy
      });
      const shipmentsJson = JSON.stringify({
        address: order.address,
        courier: order.courierName,
        tracking: order.trackingNumber,
        shippingFee: order.shippingFee
      });
      const orderItemsJson = JSON.stringify(items); // items was parsed earlier in cancelOrder

      await tx.$executeRawUnsafe(
        `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        logId,
        orderId,
        "Order Cancelled",
        order.itemName,
        ordersJson,
        order.customerName,
        order.totalAmount,
        shipmentsJson,
        orderItemsJson,
        now
      );
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    console.log(`Successfully completed cancellation and revalidation for order: ${orderId}`);
  } catch (error: any) {
    console.error("CRITICAL ERROR in cancelOrder:", error);
    throw new Error(error.message || "Failed to cancel order.");
  }
}

export async function getSmartSuggestions(order: Order) {
  // Mock AI suggestions
  const statusOptions = ['Pending', 'Ready', 'Shipped', 'Delivered', 'Claimed'];
  const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

  const mockSuggestions = {
    suggestedStatus: randomStatus,
    reasoning: `Mock suggestion: Based on the order data, the status could be updated to ${randomStatus}.`,
  };

  return { success: true, data: mockSuggestions };
}
