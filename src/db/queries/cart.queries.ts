import { db } from "../index";
import { eq, sql} from "drizzle-orm";
import { cartItems, type NewCartItem } from "../schema";

// CART QUERIES

export const getCartByUserId = async (userId: string) => {
  return db.query.cartItems.findMany({
    where: eq(cartItems.userId, userId),
    with: { product: true },
  });
};

export const addToCart = async (data: NewCartItem) => {
  const [item] = await db
    .insert(cartItems)
    .values(data)
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.productId],
      set: {
        quantity: sql`${cartItems.quantity} + ${data.quantity}`,
      },
    })
    .returning();
  return item;
};

export const removeFromCart = async (id: string) => {
  const [item] = await db.delete(cartItems).where(eq(cartItems.id, id)).returning();
  if (!item) throw new Error(`Cart item with id ${id} not found`);
  return item;
};

export const clearCart = async (userId: string) => {
  return db.delete(cartItems).where(eq(cartItems.userId, userId)).returning();
};