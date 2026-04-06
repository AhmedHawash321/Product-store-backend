import { GraphQLError } from "graphql";
import * as queries from "../../db/queries";
import { insertCommentSchema, NewCommentInput } from "../../db/validation";

export const commentResolvers = {
  Query: {
    getCommentById: async (_: unknown, { id }: { id: string }) => {
      try {
        const comment = await queries.getCommentById(id);
        if (!comment) {
          throw new GraphQLError("Comment not found", {
            extensions: { code: "NOT_FOUND" },
          });
        }
        return comment;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError("Failed to get Comment");
      }
    },
  },

  Mutation: {
    createComment: async (_: unknown, { input }: { input: NewCommentInput }) => {
      const validation = insertCommentSchema.safeParse(input);

      if (!validation.success) {
        throw new GraphQLError("Comment validation failed", {
          extensions: {
            code: "BAD_USER_INPUT",
            errors: validation.error.flatten().fieldErrors,
          },
        });
      }

      try {
        const newComment = await queries.createComment(validation.data);
        return newComment;
      } catch (error: any) {
        console.error("Create Comment Error:", error);
        throw new GraphQLError(error.message || "Failed to create comment");
      }
    },

    deleteComment: async (_: unknown, { id }: { id: string }) => {
      try {
        const deletedComment = await queries.deleteComment(id);
        if (!deletedComment) {
          throw new GraphQLError("Comment not found or already deleted");
        }
        return deletedComment;
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message || "Failed to delete comment");
      }
    },
  },
};