import * as queries from "../../db/queries";
import { GraphQLContext } from "../../Authorization/context";
import { stripeService } from "../../middleware/services/stripe.service";
import { GraphQLError } from "graphql";

const calculateTotal = (items: any[]) => {
  return items.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  );
};

export const orderResolvers = {
  Query: {
    getMyOrders: async (_: unknown, __: unknown, context: GraphQLContext) => {
      if (!context.userId) {
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }
      return await queries.getOrdersByUserId(context.userId);
    },
  },

  Mutation: {
    createCheckoutSession: async (
      _: unknown,
      __: unknown,
      context: GraphQLContext,
    ) => {
      if (!context.userId) throw new Error("Unauthenticated");

      const cartItems = await queries.getCartByUserId(context.userId);
      if (!cartItems || cartItems.length === 0)
        throw new Error("Cart is empty");

      const newOrder = await queries.createOrder({
        userId: context.userId,
        totalAmount: calculateTotal(cartItems),
        stripeSessionId: "pending", 
        items: cartItems,
      });

      const lineItems = cartItems.map((item) => ({
        price_data: {
          currency: "egp",
          product_data: {
            name: item.product.title,
            description: item.product.description,
          },
          unit_amount: Math.round(Number(item.product.price) * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripeService.createSession(
        lineItems,
        context.userId,
        newOrder.id,
      );

      if (!session.id) {
        throw new Error("Failed to create Stripe session");
      }

      await queries.updateOrderWithSessionId(newOrder.id, session.id);

      await queries.clearCart(context.userId);
      return { url: session.url };
    },
  },
};