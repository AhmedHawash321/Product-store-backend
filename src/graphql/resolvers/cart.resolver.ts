import { GraphQLError } from "graphql";
import * as queries from "../../db/queries";
import { insertCartItemSchema } from "../../db/validation";
import { GraphQLContext } from "../../authorization/context";
import { db } from "../../db";
import { cartItems } from "../../db/schema";
import { eq } from "drizzle-orm";

export const cartResolvers = {
  Query: {
    getCartByUserId: async (
      _: unknown,
      { userId }: { userId: string },
      context: GraphQLContext,
    ) => {
      if (!context.userId || context.userId !== userId) {
        throw new GraphQLError("Unauthorized access to this cart", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      try {
        const cartItems = await queries.getCartByUserId(userId);
        return cartItems;
      } catch (error) {
        console.error("Get Cart Error:", error);
        throw new GraphQLError("Failed to fetch cart items");
      }
    },
  },

  Mutation: {
    addToCart: async (
      _: unknown,
      { input }: { input: { productId: string; quantity: number } },
      context: GraphQLContext,
    ) => {
      if (!context.userId) {
        throw new GraphQLError("You must be logged in to add items to cart", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const fullInput = { ...input, userId: context.userId };
      const validation = insertCartItemSchema.safeParse(fullInput);

      if (!validation.success) {
        throw new GraphQLError("Invalid input data", {
          extensions: {
            code: "BAD_USER_INPUT",
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const newItem = await queries.addToCart(validation.data);
        return newItem;
      } catch (error: any) {
        console.error("Add to Cart Error:", error);
        throw new GraphQLError(error.message || "Failed to add item to cart");
      }
    },

    removeFromCart: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext,
    ) => {
      if (!context.userId)
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });

      const [item] = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.id, id));

      if (!item) throw new Error("Cart item not found");

      if (item.userId !== context.userId) {
        throw new Error("Forbidden: You don't own this cart item");
      }
      try {
        const deletedItem = await queries.removeFromCart(id);
        return deletedItem;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Failed to remove item");
      }
    },

    clearCart: async (_: unknown, __: unknown, context: GraphQLContext) => {
      if (!context.userId)
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });

      try {
        const clearedItems = await queries.clearCart(context.userId);
        return clearedItems;
      } catch (error: any) {
        throw new GraphQLError(error.message || "Failed to clear cart");
      }
    },
  },
};