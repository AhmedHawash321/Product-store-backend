import { db } from "../index";
import { eq } from "drizzle-orm";
import { comments, type NewComment, } from "../schema";

// COMMENT QUERIES
export const createComment = async (data: NewComment) => {
  const [comment] = await db.insert(comments).values(data).returning();
  return comment;
};

export const deleteComment = async (id: string) => {
  const [comment] = await db.delete(comments).where(eq(comments.id, id)).returning();
  if (!comment) throw new Error(`Comment with id ${id} not found`);
  return comment;
};

export const getCommentById = async (id: string) => {
  return db.query.comments.findFirst({
    where: eq(comments.id, id),
    with: { user: true },
  });
};