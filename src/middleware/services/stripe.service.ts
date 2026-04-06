import Stripe from "stripe";
import { ENV } from "../../config/env";

if (!ENV.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is missing in environment variables");
}
// used any here to solve constructer conflict
export const stripe = new (Stripe as any)(ENV.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});
// Here We manualy idintify interface because it didnt read from Stripe lib
// Stripe insist to recognised as a class , and Namespace as type which lead to 
// Namespace , StripeConstructor Error each time
interface StripeLineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
      images?: string[];
    };
    unit_amount: number; 
  };
  quantity: number;
}

type CheckoutSession = any;

export const stripeService = {
 // New Payment session
  createSession: async (
    lineItems: StripeLineItem[], 
    userId: string,
    orderId: string
  ): Promise<CheckoutSession> => {
    try {
      // Using any with stripe here because of constructor err coming from Stripe lib
      const session = await (stripe as any).checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${ENV.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ENV.FRONTEND_URL}/cart`,
        metadata: {
          userId: userId,
          orderId: orderId,
        },
      });

      return session;
    } catch (error: any) {
      console.error("Stripe Session Error:", error);
      throw new Error(`Stripe Error: ${error.message}`);
    }
  },
 // Payment session verfication
  verifySession: async (sessionId: string): Promise<CheckoutSession> => {
    try {
      return await (stripe as any).checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      console.error("Stripe Verification Error:", error);
      throw new Error(`Stripe Verification Error: ${error.message}`);
    }
  },
};