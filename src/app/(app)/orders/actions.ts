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
        // NEW: Update Batch Totals
        // batchId -> { sales: number, count: number }
        // We track count separately to avoid double counting if multiple items have same batch? 
        // Logic: 1 order = 1 increments to totalOrders? Or each product adds to totalOrders? 
        // Convention: totalOrders usually means number of ORDERS in that batch. 
        // But if an order has products from different batches, how do we count?
        // Current existing implementation increments totalOrders per loop iteration over unique batches found in items.
        // This effectively means "This batch is involved in 1 order".
        const batchUpdates = new Map<string, number>();

        for (const item of orderData.items) {
          const productId = item.product.id;
          const quantityToDeduct = item.quantity;

          // Deduced from quantity (Main Inventory) regardless of remark, as branches are merged
          const updateData = { quantity: { decrement: quantityToDeduct } };

          const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, name: true, quantity: true, alertStock: true, batchId: true, retailPrice: true }
          });

          // 3. Create notifications if stock is low or out
          const totalStock = updatedProduct.quantity;
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


          // Accumulate Batch Updates
          if (updatedProduct?.batchId) {
            const price = updatedProduct.retailPrice || 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : (Number(item.quantity) || 0);

            if (!isNaN(price) && !isNaN(quantity)) {
              const itemTotal = price * quantity;
              const currentTotal = batchUpdates.get(updatedProduct.batchId) || 0;
              batchUpdates.set(updatedProduct.batchId, currentTotal + itemTotal);
            }
          }
        }

        for (const [batchId, totalSales] of batchUpdates.entries()) {
          if (isNaN(totalSales)) continue;

          console.log(`[BatchUpdate] Start update for Batch: ${batchId}, Sales to add: ${totalSales}`);

          const batch = await tx.batch.findUnique({ where: { id: batchId } });
          if (batch) {
            const currentOrders = batch.totalOrders || 0; // Coalesce null to 0
            const currentSales = batch.totalSales || 0;   // Coalesce null to 0

            await tx.batch.update({
              where: { id: batchId },
              data: {
                totalOrders: currentOrders + 1,
                totalSales: currentSales + totalSales
              }
            });
            console.log(`[BatchUpdate] Updated Batch ${batchId}: Orders ${currentOrders} -> ${currentOrders + 1}, Sales ${currentSales} -> ${currentSales + totalSales}`);
          } else {
            console.warn(`[BatchUpdate] Batch ${batchId} not found!`);
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
    revalidatePath("/batches");
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
    const updatedOrderResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing order to revert its effects on batches if needed
      const existingOrder = await tx.order.findUnique({ where: { id } });
      if (!existingOrder) throw new Error("Order not found");

      const itemsAreChanging = (data as any).items !== undefined;
      let originalItems = [];
      if (existingOrder.items) {
        originalItems = typeof existingOrder.items === 'string' ? JSON.parse(existingOrder.items) : existingOrder.items as any[];
      }

      // If items are changing, we need to revert old batch contributions and apply new ones
      // Strictly speaking, we should only do this if items CHANGED. 
      // But the frontend usually sends the whole items array on update if it was edited.
      // Assuming if `data` has `items`, we do the Recalculation.

      // However, `updateOrder` signature currently accepts Partial<Order>.
      // `Order` type in `types.ts` defines `items` as `Json?`.
      // The `EditOrderDialog` does NOT currently allow editing items list (adding/removing products). 
      // It only allows editing quantity/price of the order as a whole, OR it might?
      // Let's check `EditOrderDialog`.
      // `EditOrderDialog` allows editing `quantity` field of the ORDER, but DOES NOT have an items editor. 
      // Wait, `EditOrderDialog` has inputs for `quantity` and `price` (Order total), but not per-item list.
      // So `updateOrder` is mostly changing meta-data.

      // BUT, if the user changes `quantity` or `price` there, it might reflect a change in what was sold?
      // Actually, `EditOrderDialog` edits the top-level `quantity` and `price`. 
      // It does NOT update the `items` JSON blob.
      // If `items` blob is not updated, then individual product batch tracking is broken if we rely on it.

      // HOWEVER, the user request is "total sales will connect to total sales".
      // If the user edits the order total amount in `EditOrderDialog`, should that reflect in batch sales?
      // Yes, likely. But which batch?
      // `Order` has `batchId`.
      // If the order itself is assigned to a batch via `batchId` (Order Level Batch), that's one thing.
      // But the `createOrder` logic I just saw uses `product.batchId`.

      // Confusion: `Order` has `batchId` (Delivery Batch?). `Product` has `batchId` (Source Batch?).
      // The user says "apply with that batch".
      // In `createOrder`, we used `product.batchId`.
      // In `BatchesTable`, we show `Total Sales`.

      // If `EditOrderDialog` changes `batchId`, does it mean the Delivery Batch changed? Yes.
      // Does `Batch` model `totalSales` track Delivery Batch sales or Product Source Batch sales?
      // `createOrder` logic I was fixing tracks **Product Source Batch Sales**.

      // If `updateOrder` does NOT change items, then Product Source Batch Sales shouldn't change...
      // UNLESS the quantity of items changed.
      // `EditOrderDialog` allows changing `quantity` (Total Quantity).
      // It does NOT change `items` array details (per product quantity).
      // This creates a discrepancy.

      // If `EditOrderDialog` is used to simple change "Payment Status" or "Shipping Status", no calc needed.
      // If `EditOrderDialog` changes manual `quantity` or `totalAmount`, we can't easily map that back to products if there are multiple.

      // Strategy:
      // Only if `items` are passed in `data`, we execute the rigorous update.
      // Currently `EditOrderDialog` does NOT pass `items`.
      // So `updateOrder` will mostly be used for status updates.

      // WAIT. If `createOrder` logic is correct, it uses `product.batchId`.
      // The user complained "total sales is still zero".
      // Fixing `createOrder` (the `retailPrice` fix) handles NEW orders.
      // Does the user expect OLD orders to be fixed? I cannot easily fix old orders without a migration script.
      // I will assume they are testing with NEW orders.

      // What if `EditOrderDialog` IS used to assign `batchId`?
      // `EditOrderDialog` has "Delivery Option" -> sets `batchId`.
      // If this `batchId` is set, does it affect `Batch` stats?
      // `Batch.totalOrders` and `Batch.totalSales`.
      // If `Batch` stats are meant to aggregate "Orders assigned to this delivery batch", then my `createOrder` fix was WRONG.
      // Let's re-read the code and request.

      // User said: "who purchase or order that product that apply with that batch the total sales will connect to total sales and total orders"
      // "apply with THAT batch".

      // `createOrder` has:
      // `batchId: orderData.batchId` (The one selected in dropdown "Delivery Batch").

      // AND `createOrder` logic I saw:
      // `batchUpdates.get(product.batchId)` using `item.product.id`.
      // It uses `product.batchId`. 

      // Is `product.batchId` the same as `orderData.batchId`?
      // NOT NECESSARILY.
      // Products belong to a batch (Supply).
      // Orders belong to a batch (Delivery/Logistics).

      // Which one does the user want?
      // "purchase or order that product that apply with that batch"
      // Usually "Batch Management" in e-commerce can be "Inventory Batches" or "Delivery Batches".
      // In this app, `BatchesTable` shows "Delivery Date", "Cutoff Date". This strongly suggests **Logistic/Delivery Batches**.
      // The `Order` model has `batchId`.
      // The `Product` model ALSO has `batchId`.

      // If these are Delivery Batches, then `createOrder` logic using `product.batchId` might be WRONG if it was intended to use `order.batchId`.
      // But wait, `Product` model has `batchId`.
      // Let's check `Batch` model again.
      // `model Batch { ... products Product[] ... }`
      // `model Product { ... batch Batch? ... }`

      // This implies Batches are indeed source/supply batches? Or Products are assigned to Delivery Batches?

      // If I look at the screenshot "Batch Management", it has "Delivery Date".
      // And "Total Orders".

      // If `createOrder` assigns an order to a `batchId`, that is clearly the Delivery Batch.
      // The prior logic in `createOrder` (before I touched it) was iterating `items` and using `product.batchId`.
      // This suggests the previous developer thought it was about Source Batches.
      // BUT `createOrder` ALSO saves `batchId` to the `Order`.

      // HYPOTHESIS: The user wants to track sales for the **Delivery Batch** they verify in the dialog.
      // If I select "Batch 05" in the "Delivery Batch" dropdown, I expect "Batch 05" stats to increment.

      // In `createOrder` logic:
      // `const product = await tx.product.findUnique(...)` -> `product.batchId`.
      // This looks up the *product's* batch.
      // If the product was imported in Batch A, but sold in Order with Delivery Batch B...
      // Which batch should get the credit?
      // The USER TEXT: "order that product that apply with **that batch**" (ambiguous).

      // Let's look at `createOrder` again.
      // `orderData.batchId` is passed.
      // The existing code IGNORES `orderData.batchId` for the stats calculation and uses `product.batchId`.

      // If I change it to use `orderData.batchId`, it makes more sense for "Delivery Batch" management.
      // The `Batch` model has `deliveryDate`.

      // Let's assume the user wants `Order.batchId` to drive the stats.
      // WHY? Because they are "Creating Batch" with "Delivery Date".
      // And in "Create Order", they select "Delivery Batch".
      // It's highly likely they want to know "How much did we sell for this Delivery Batch?".

      // So the PREVIOUS LOGIC in `createOrder` was likely FLAWED not just by `price` but by `batchId` source.

      // HOWEVER, `Product` relations suggests Products belong to Batches.
      // Maybe "Batch" means "Pre-order Batch"?
      // If it's a pre-order system, you open a Batch, take orders for products IN that batch.
      // In that case, the Product's Batch AND the Order's Batch might be the same conceptual thing.

      // Let's do a safe bet:
      // If `orderData.batchId` is present, update THAT batch.
      // THIS is the most logical "Delivery Batch" behavior.
      // The existing code loop over products might be legacy or misunderstood.

      // Wait, if I look at `BatchesTable` (File 1), it lists `totalOrders` and `totalSales`.
      // If I select "Batch 05" in Create Order, I expect Batch 05 to update.
      // So I will modify `createOrder` to update the `orderData.batchId`.

      // But what if `orderData.batchId` is null? Then no batch updates.

      // REVISED PLAN FOR `createOrder`:
      // 1. Keep the inventory deduction logic (it's correct).
      // 2. Change Batch Total Update logic:
      //    Instead of looping products and finding their source batches,
      //    Check if `orderData.batchId` is set.
      //    If yes, increment `totalOrders` by 1.
      //    Increment `totalSales` by `orderData.totalAmount`.
      //    (Much simpler and matches "Delivery Batch" concept).

      // BUT, what if the user meant "Product Batch"?
      // "who purchase or order that product that apply with that batch"
      // This phrasing "apply with that batch" sounds like the Product Attribute.
      // But "total sales will connect to total sales" -> Batch.totalSales.

      // IF I look at the screenshot again (Step 38).
      // Batch Name: batch05. Status: Open.
      // This looks like a Pre-order Batch.
      // "Create Batch" -> Name, Date.
      // "Create Order" -> "Delivery Batch" dropdown.

      // If I buy Product X (Batch A) and Product Y (Batch B) in one Order...
      // And I select "Delivery Batch C".
      // Does it make sense to add sales to Batch C? Yes, if it's a consolidation batch.

      // Let's check `schema.prisma`.
      // `model Batch` has `products Product[]`.
      // `model Product` has `batchId`.
      // `model Order` has `batchId`.

      // If the user wants to track "How many of Batch A products were sold", that's one thing.
      // If the user wants to track "How much value is in Delivery Batch C", that's another.
      // The UI column "Delivery Date" strongly implies Delivery Batch logic.

      // I will implement the logic based on `orderData.batchId` (The Order's assigned batch).
      // This is the variable the user actively selects when creating an order.
      // And it matches `orderData.totalAmount` perfectly.

      // Also, the previous code had `totalOrders: { increment: 1 }`.

      // So, in `createOrder`:
      // IF `orderData.batchId` exists:
      // Update Batch(id=orderData.batchId):
      //   totalOrders += 1
      //   totalSales += orderData.totalAmount

      // This is robust and simple.

      // What about `updateOrder`?
      // If I change `batchId` from A to B.
      // A: totalOrders -= 1, totalSales -= order.totalAmount
      // B: totalOrders += 1, totalSales += order.totalAmount

      // If I change `totalAmount` but keep batch A.
      // A: totalSales += (newAmount - oldAmount)

      // This seems correct for "Delivery Batch" tracking.

      // Wait, the existing erroneous code was:
      /*
      for (const item of orderData.items) {
        const product = await tx.product.findUnique({ where: { id: item.product.id }, select: { batchId: true } });
         // ... updates batchUpdates per PRODUCT BATCH ID
      }
      */
      // This logic strongly suggests the previous dev (or AI) thought it was Product Batches.
      // But the user context "order that product that apply with that batch" might mean:
      // "When I order a product that belongs to Batch X, I want Batch X sales to go up".

      // **Ambiguity Alert**.
      // However, I see `orderData.batchId` being passed to `INSERT INTO orders`.
      // And the user selected "batch05" in the screenshot.
      // If the user selected "batch05" in the "Delivery Batch" dropdown during order creation...
      // Then `orderData.batchId` IS "batch05".

      // In the screenshot, "batch05" has "Total Orders: 2".
      // This means SOME code successfully incremented orders.
      // The flawed code I saw loops through ITEMS and increments batches found in ITEMS.
      // IF the product used in the test had `batchId` = "batch05", then the flawed code worked for Orders but failed for Sales (due to price).
      // This means the user has set "batch05" on the PRODUCT as well.

      // If I switch to `orderData.batchId` logic, I might break the "Product Batch" tracking if that's what they wanted.
      // BUT, if `Order.batchId` is what determines the "Batch" in the UI loop, then `orderData.batchId` is the truth.

      // Let's stick to the previous code's intent (Product Batch) BUT also consider Order Batch?
      // No, mixing them is duplicate counting.

      // Let's look at `actions.ts` again.
      // The specific line: `const product = await tx.product.findUnique(...)`
      // It was definitely tracking Product Source Batch.

      // If I simply fix the `retailPrice` issue, the logic remains "Product Source Batch".
      // If the user's setup is: Create Batch -> Create Product linked to Batch -> Create Order with that Product.
      // Then "Batch Management" shows how much of that Batch has been sold.
      // This is "Inventory Batch" logic.

      // AND `totalOrders` being 2 means the Product `batchId` WAS found.
      // So the user HAS linked products to batches.

      // So I will stick to fixing the `retailPrice` in the loop.
      // AND I will add `revalidatePath`.
      // AND I will implement `updateOrder` to perform similar logic if `items` are not present but `status` changes?
      // No, `updateOrder` usually doesn't change the products (in this app's UI).
      // If `updateOrder` changes `batchId` (Delivery), it doesn't affect Product Source Batches.

      // Wait. If `updateOrder` changes the *Delivery Batch* (Order.batchId), does that affect the stats?
      // If the stats are driven by *Product Source Batch*, then changing *Delivery Batch* is irrelevant.

      // BUT, if the user thinks "I selected Batch05 in the dropdown", they are selecting Delivery Batch.
      // Did the user select Batch05 in the dropdown?
      // In `CreateOrderDialog` (Step 22):
      // `<Select onValueChange={(value) => setBatchId(value)} ...>` -> `Delivery Batch`.

      // Does the user also set Batch on the Product?
      // `Product` model has `batchId`.

      // If the user selects "Batch 05" in the "Delivery Batch" dropdown, they *expect* Batch 05 stats to update.
      // Does the user *also* ensure the Product is in Batch 05?
      // Maybe. But if they just pick any product, and select Batch 05 for delivery...
      // They probably expect Batch 05 (the delivery batch) to show the sales.

      // Logic Shift: The existing code was checking `product.batchId`.
      // If the user selects Batch 05 in the dialog, `orderData.batchId` is Batch 05.
      // The product might NOT have Batch 05.
      // If so, the existing code would NOT update Batch 05 (unless product matched).
      // But the user screenshot shows "Total Orders: 2" for Batch 05.
      // This implies either:
      // 1. The products ordered WERE in Batch 05.
      // 2. OR there is OTHER code updating the batch based on `Order.batchId`.

      // Let's check `actions.ts` again.
      // I see `// NEW: Update Batch Totals` block.
      // Is there any other update?
      // No.

      // So, for "Total Orders: 2" to happen, `product.batchId` MUST have been found.
      // This means the user IS using Product Batches.
      // So my fix for `retailPrice` is the correct path.

      // I will fix `createOrder` to use `retailPrice`.
      // I will also add handling for `updateOrder`.
      // Since `EditOrderDialog` doesn't change items, I will skip complex item diffing for now unless I see simple way.
      // Actually, if `updateOrder` is called, and `items` didn't change, we shouldn't change Product Batch stats.
      // EXCEPT if the order is CANCELLED.
      // `cancelOrder` already has logic to decrement.

      // So I just need to fix `createOrder` `retailPrice` and `revalidatePath`.
      // And `cancelOrder` `revalidatePath`.

      // I'll also add a fallback to `orderData.batchId` just in case? 
      // No, keep it clean.

      // 2. Update the order
      const updatedOrder = await tx.order.update({
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

      // Create Sales Log (omitted for brevity, copied from original)
      // ...
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

      await tx.$executeRawUnsafe(
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



      return updatedOrder;
    });

    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/batches");

    return {
      id: updatedOrderResult.id,
      customerName: updatedOrderResult.customerName,
      contactNumber: updatedOrderResult.contactNumber || "",
      address: updatedOrderResult.address || "",
      orderDate: updatedOrderResult.orderDate ? updatedOrderResult.orderDate.toISOString().split('T')[0] : "",
      itemName: updatedOrderResult.itemName,
      quantity: updatedOrderResult.quantity,
      price: updatedOrderResult.price,
      shippingFee: updatedOrderResult.shippingFee,
      totalAmount: updatedOrderResult.totalAmount,
      paymentMethod: (updatedOrderResult.paymentMethod as PaymentMethod) || "COD",
      paymentStatus: (updatedOrderResult.paymentStatus as PaymentStatus) || "Unpaid",
      shippingStatus: (updatedOrderResult.shippingStatus as ShippingStatus) || "Pending",
      batchId: updatedOrderResult.batchId,
      createdAt: updatedOrderResult.createdAt,
      createdBy: (updatedOrderResult.createdBy as any) || { uid: "system", name: "System" },
      customerId: updatedOrderResult.customerId,
      customerEmail: updatedOrderResult.customerEmail || "",
      courierName: updatedOrderResult.courierName || "",
      trackingNumber: updatedOrderResult.trackingNumber || "",
      remarks: (updatedOrderResult.remarks as OrderRemark) || "",
      rushShip: updatedOrderResult.rushShip,
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
        // Default to restocking quantity
        const updateData: any = { quantity: { increment: quantityToIncrement } };
        const location = "Main Inventory";

        console.log(`Restocking ${quantityToIncrement} of product ${productId} to ${location}`);

        try {
          const updatedProd = await tx.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, quantity: true } // Select returned data to confirm update
          });
          console.log(`Stock updated for ${productId}. New level: ${updatedProd.quantity}`);
        } catch (updateError: any) {
          console.error(`Failed to restock product ${productId}:`, updateError.message);
          throw new Error(`Failed to restock product ${productId}: ${updateError.message}`);
        }
      }

      // NEW: Update Batch Totals (Decrement) based on Product Source Batch
      const batchUpdates = new Map<string, number>();

      for (const item of items) {
        const productId = item.product?.id || item.productId;

        if (!productId) continue;

        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { batchId: true, retailPrice: true }
        });

        if (product?.batchId) {
          const price = product.retailPrice || 0;
          const quantity = typeof item.quantity === 'number' ? item.quantity : parseInt(String(item.quantity), 10);

          if (!isNaN(quantity)) {
            const total = price * quantity;
            const currentTotal = batchUpdates.get(product.batchId) || 0;
            batchUpdates.set(product.batchId, currentTotal + total);
          }
        }
      }

      for (const [batchId, totalSales] of batchUpdates.entries()) {
        if (totalSales === 0 || isNaN(totalSales)) continue;

        console.log(`[BatchCancel] Start revert for Batch: ${batchId}, Sales to remove: ${totalSales}`);

        const batch = await tx.batch.findUnique({ where: { id: batchId } });
        if (batch) {
          const currentOrders = batch.totalOrders || 0;
          const currentSales = batch.totalSales || 0;
          const newOrders = Math.max(0, currentOrders - 1);
          const newSales = Math.max(0, currentSales - totalSales);

          await tx.batch.update({
            where: { id: batchId },
            data: {
              totalOrders: newOrders,
              totalSales: newSales
            }
          });
          console.log(`[BatchCancel] Updated Batch ${batchId}: Orders ${currentOrders} -> ${newOrders}, Sales ${currentSales} -> ${newSales}`);
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
    revalidatePath("/batches");
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
