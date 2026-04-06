import * as queries from "../../db/queries";
import { GraphQLError } from "graphql";
import {
  insertProductSchema,
  updateProductSchema,
  NewProductInput,
} from "../../db/validation";
import { ROLES } from "../../config/roles";
import { GraphQLContext } from "../../Authorization/context";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { products } from "../../db/schema";

export interface GetProductsArgs {
  limit?: number;
  offset?: number;
  filter?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

export const productResolvers = {
  Query: {
    getProducts: async (
      _: unknown,
      { limit, offset, filter }: GetProductsArgs,
      _context: GraphQLContext,
    ) => {
      try {
        return await queries.getProducts(limit, offset, filter);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;

        console.error("Fetch Products Error:", error);
        throw new GraphQLError("Error in fetching products", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    getProductById: async (_: unknown, { id }: { id: string }) => {
      try {
        const product = await queries.getProductById(id);
        if (!product) {
          throw new GraphQLError("Product Not Found", {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return product;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message);
      }
    },

    getProductsByUserId: async (_: unknown, { userId }: { userId: string }) => {
      try {
        return await queries.getProductsByUserId(userId);
      } catch (error) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Failed to get products for this user");
      }
    },
  },

  Mutation: {
    createProduct: async (
      _: unknown,
      { input }: { input: NewProductInput },
      context: GraphQLContext,
    ) => {
      if (!context.userId) {
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const validation = insertProductSchema.safeParse(input);
      if (!validation.success) {
        throw new GraphQLError("Validation Failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        // Passing userId from context make sure that product belong to its owner
        return await queries.createProduct({
          ...validation.data,
          userId: context.userId,
        });
      } catch (error: any) {
        console.error("DB Error:", error);
        throw new GraphQLError("Failed to create product.", {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    updateProduct: async (
      _: unknown,
      { id, input }: { id: string; input: any },
      context: GraphQLContext,
    ) => {
      if (!context.userId) {
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const productData = await db.query.products.findFirst({
        where: eq(products.id, id),
      });
      if (!productData) {
        throw new GraphQLError("Product not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isAdmin = context.role === ROLES.ADMIN;
      const isOwner = productData.userId === context.userId;

      if (!isAdmin && !isOwner) {
        throw new GraphQLError("Forbidden: Only owner or admin can update", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const validation = updateProductSchema.safeParse(input);
      if (!validation.success) throw new GraphQLError("Validation Failed");

      const cleanData = Object.fromEntries(
        Object.entries(validation.data).filter(([_, v]) => v !== undefined),
      );

      try {
        return await queries.updateProduct(
          id,
          context.userId,
          isAdmin,
          cleanData,
        );
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, {
          extensions: { code: "INTERNAL_SERVER_ERROR" },
        });
      }
    },

    deleteProduct: async (
      _: unknown,
      { id }: { id: string },
      context: GraphQLContext,
    ) => {
      if (!context.userId) {
        throw new GraphQLError("Unauthenticated", {
          extensions: { code: "UNAUTHORIZED" },
        });
      }

      const productData = await db.query.products.findFirst({
        where: eq(products.id, id),
      });
      if (!productData) {
        throw new GraphQLError("Product not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }

      const isAdmin = context.role === ROLES.ADMIN;
      const isOwner = productData.userId === context.userId;

      if (!isAdmin && !isOwner) {
        throw new GraphQLError("Forbidden: Only owner or admin can delete", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      try {
        return await queries.deleteProduct(id, context.userId, isAdmin);
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message);
      }
    },
  },
};