import { db } from "../index";
import { eq, and, ilike, gte, lte, desc, SQL} from "drizzle-orm";
import { products,  type NewProduct } from "../schema";

// PRODUCT QUERIES
export const createProduct = async (data: NewProduct) => {
  const [product] = await db.insert(products).values(data).returning();
  return product;
};

export const getProducts = async (
  limit: number = 10, 
  offset: number = 0, 
  filter?: { search?: string; minPrice?: number; maxPrice?: number }
) => {
  // 1. Building filter conditions
  const conditions: SQL[] = [];

  if (filter?.search) {
    conditions.push(ilike(products.title, `%${filter.search}%`));
  }

  if (filter?.minPrice !== undefined) {
    conditions.push(gte(products.price, filter.minPrice));
  }

  if (filter?.maxPrice !== undefined) {
    conditions.push(lte(products.price, filter.maxPrice));
  }
  // 2. impelementing queries using Relational API
  return db.query.products.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    limit: limit,
    offset: offset,
    with: { user: true },
    orderBy: [desc(products.createdAt)],
  });
};

export const getProductById = async (id: string) => {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      user: true,
      comments: {
        with: { user: true },
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      },
    },
  });
};

export const getProductsByUserId = async (userId: string) => {
  return db.query.products.findMany({
    where: eq(products.userId, userId),
    with: { user: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
};

export const updateProduct = async (
  id: string, 
  userId: string | null,
  isAdmin: boolean,
  data: Partial<NewProduct>
) => {

    const condition = isAdmin
    ? eq(products.id, id) 
    : and(eq(products.id, id), eq(products.userId, userId!));

  const [product] = await db
  .update(products)
  .set(data)
  .where(condition)
    .returning();
  
    if (!product) {
    throw new Error(`Product with id ${id} not found`);
  }
  return product;
};

export const deleteProduct = async (id: string, userId: string | null, isAdmin: boolean) => {
  const condition = isAdmin 
    ? eq(products.id, id) 
    : and(eq(products.id, id), eq(products.userId, userId!));

  const [product] = await db
    .delete(products)
    .where(condition)
    .returning();

  if (!product) throw new Error("Product not found or unauthorized");
  return product;
};