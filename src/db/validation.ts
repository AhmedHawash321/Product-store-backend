import { createInsertSchema } from "drizzle-zod";
import { products, users, comments, cartItems } from "./schema";
import { z } from "zod";

// --- 1. Products Validation  ---
export const insertProductSchema = createInsertSchema(products, {
  title: (s) => s.min(3, "Title must be at least 3 chars"),
  price: () => z.coerce.number().gt(0, "Price must be greater than zero"),
  stock: (s) => s.int().nonnegative(),
  imageUrl: (s) => s.url("Invalid image URL"),
  description: (s) => s.min(10, "Description should be more descriptive"),
});

export const updateProductSchema = insertProductSchema.partial();

// --- 2. Users Validation (Clerk) ---
export const insertUserSchema = createInsertSchema(users, {
  id: (s) => s.min(1, "User ID from Clerk is required"),
  email: (s) => s.email("Invalid email address"),
  name: (s) => s.min(2, "Name is too short").optional(),
  imageUrl: (s) => s.url("Invalid profile image URL").optional(),
});

export const updateUserSchema = insertUserSchema.partial();

// --- 3. Comments Validation ---
export const insertCommentSchema = createInsertSchema(comments, {
  content: (s) => s.min(1, "Comment cannot be empty").max(500, "Comment is too long"),
  userId: (s) => s.min(1, "User ID is required"),
  productId: () => z.string().uuid("Invalid Product ID format"),
});

export const updateCommentSchema = insertCommentSchema.partial();

export const insertCartItemSchema = createInsertSchema(cartItems, {
  quantity: () => z.number().int().positive("Quantity must be at least 1"),
  productId: () => z.string().uuid("Invalid Product ID"),
  userId: () => z.string().min(1, "User ID is required"),
});

export const updateCartItemSchema = insertCartItemSchema.partial();

// --- 4. Export Types  ---
export type NewProductInput = z.infer<typeof insertProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type NewUserInput = z.infer<typeof insertUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type NewCommentInput = z.infer<typeof insertCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export type NewCartItemInput = z.infer<typeof insertCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;