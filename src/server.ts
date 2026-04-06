import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Server } from "http";
import { createClient } from "redis";
import { ENV } from "./config/env";
import { clerkMiddleware } from "@clerk/express";
import { createSchema, createYoga } from "graphql-yoga";
import { mergedTypeDefs } from "./graphql/typedefs";
import { mergedResolvers } from "./graphql/resolvers";
import { createContext, GraphQLContext } from "./Authorization/context";
import { stripe } from "./middleware/services/stripe.service";
import * as queries from "./db/queries";

const app = express();

const redisUrl =
  process.env.REDIS_URL ||
  (process.env.NODE_ENV === "production"
    ? "redis://redis:6379"
    : "redis://localhost:6379");

const redisClient = createClient({
  url: redisUrl,
});

redisClient.connect().catch(console.error);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 5 : 100,
  message: "Too Many Requests , Please Try Again Later",
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

app.post(
  "/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        ENV.STRIPE_WEBHOOK_SECRET!,
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const orderId = session.metadata.orderId;
        await queries.updateOrderStatus(orderId, "completed");
      }

      return res.json({ received: true });
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  },
);

app.use(cors());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

const yoga = createYoga<any, GraphQLContext>({
  schema: createSchema({
    typeDefs: mergedTypeDefs,
    resolvers: mergedResolvers,
  }),
  context: createContext,
});

app.use("/graphql", yoga);

export default app;

let server: Server | undefined;

if (process.env.NODE_ENV !== "test") {
  server = app.listen(ENV.PORT, () => {
    console.log(`Server ready at http://localhost:${ENV.PORT}/graphql`);
  });
  const shutdown = async () => {
    console.log("Shutting down gracefully...");
    const forceExit = setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
    // Prevent the timeout from keeping the process alive
    forceExit.unref();
    try {
      await redisClient.quit(); // Close Redis connection
      if (server) {
        server.close(() => {
          console.log("Closed out remaining connections.");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    } catch (err) {
      console.error("Error during shutdown:", err);
      process.exit(1);
    }
  };
  // Listening to End Signals (Railwa, Docker)
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};