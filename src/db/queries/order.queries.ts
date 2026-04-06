import { desc, eq } from "drizzle-orm";
import { db } from "../index";
import { orders, orderItems } from "../schema";


export const createOrder = async (data: {
  userId: string;
  totalAmount: number;
  stripeSessionId: string;
  items: any[];
}) => {
  return await db.transaction(async (tx) => {
    // (Order Header)
    const [newOrder] = await tx
      .insert(orders)
      .values({
        userId: data.userId,
        totalAmount: data.totalAmount,
        stripeSessionId: data.stripeSessionId,
        status: "pending", // default
      })
      .returning();

    if (!newOrder) {
      throw new Error("Failed to create order header");
    }

    // (Order Items)
    const itemsToInsert = data.items.map((item) => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
    }));

    // (Bulk Insert)
    await tx.insert(orderItems).values(itemsToInsert);

    return newOrder;
  });
};

// Getting user orders
export const getOrdersByUserId = async (userId: string) => {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      items: {
        with: { product: true },
      },
    },
    orderBy: [desc(orders.createdAt)],
  });
};

// connect to stripe session
export const updateOrderWithSessionId = async (orderId: string, sessionId: string) => {
  const [updatedOrder] = await db
    .update(orders)
    .set({ stripeSessionId: sessionId })
    .where(eq(orders.id, orderId))
    .returning();
  
  return updatedOrder;
};

// convert from pending to complete
export const updateOrderStatus = async (orderId: string, status: string) => {
  const [updatedOrder] = await db
    .update(orders)
    .set({ status: status })
    .where(eq(orders.id, orderId))
    .returning();
    
  return updatedOrder;
};