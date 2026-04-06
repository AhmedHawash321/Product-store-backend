import { GraphQLError } from "graphql";
import * as userQueries from "../../db/queries/user.queries";
import {
  insertUserSchema,
  updateUserSchema,
  NewUserInput,
  UpdateUserInput,
} from "../../db/validation";

export const userResolvers = {
  Query: {
    getUserById: async (_: unknown, { id }: { id: string }) => {
      try {
        const user = await userQueries.getUserById(id);
        if (!user) {
          throw new GraphQLError("User not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return user;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message);
      }
    },
  },

  Mutation: {
    syncUser: async (_: unknown, { input }: { input: NewUserInput }) => {
      const validation = insertUserSchema.safeParse(input);

      if (!validation.success) {
        throw new GraphQLError("User sync validation failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        return await userQueries.upsertUser(validation.data);
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message || "Failed to sync user");
      }
    },

    updateUser: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateUserInput },
    ) => {
      const validation = updateUserSchema.safeParse(input);

      if (!validation.success) {
        throw new GraphQLError("User update validation failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const cleanData = Object.fromEntries(
          Object.entries(validation.data).filter(([_, v]) => v !== undefined),
        );

        const updatedUser = await userQueries.updateUser(id, cleanData);
        if (!updatedUser) {
          throw new GraphQLError("User not found to update", {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return updatedUser;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message || "User update failed");
      }
    },
  },
};