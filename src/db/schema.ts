import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
  unique,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().$type<number>(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({ 
  titleIdx: index("title_idx").on(t.title),
  priceIdx: index("price_idx").on(t.price),
  userProductIdx: index("user_product_idx").on(t.userId),
}));

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
  .notNull()
  .references(() => users.id, { onDelete: "cascade"}),
  productId: uuid("product_id")
  .notNull()
  .references(() => products.id, {onDelete: "cascade"}),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  unq: unique().on(table.userId, table.productId),
}));

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().$type<number>(),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  stripeSessionId: text("stripe_session_id"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().$type<number>(), 
});

export const userRelations = relations(users, ({ many }) => ({
  products: many(products), // One user → many products
  comments: many(comments), // One user → many comments
  orders: many(orders), // One user → many orders 
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  comments: many(comments),
  // `fields` = the foreign key column in THIS table (products.userId)
  // `references` = the primary key column in the RELATED table (users.id)
  user: one(users, { fields: [products.userId], references: [users.id] }), // one product → one user
}));

// Comments Relations: A comment belongs to one user and one product
export const commentsRelations = relations(comments, ({ one }) => ({
  // `comments.userId` is the foreign key,  `users.id` is the primary key
  user: one(users, { fields: [comments.userId], references: [users.id] }), // One comment → one user
  // `comments.productId` is the foreign key,  `products.id` is the primary key
  product: one(products, { fields: [comments.productId], references: [products.id] }), // One comment → one product
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;