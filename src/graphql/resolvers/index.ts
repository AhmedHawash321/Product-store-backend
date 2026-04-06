import { productResolvers } from "./product.resolver";
import { userResolvers } from "./user.resolver";
import { commentResolvers } from "./comment.resolver";
import { cartResolvers } from "./cart.resolver";
import { orderResolvers } from "./order.resolver";

export const mergedResolvers = {
  Query: {
    ...productResolvers.Query,
    ...userResolvers.Query,
    ...commentResolvers.Query,
    ...cartResolvers.Query,
    ...orderResolvers.Query,
  },
  Mutation: {
    ...productResolvers.Mutation,
    ...userResolvers.Mutation,
    ...commentResolvers.Mutation,
    ...cartResolvers.Mutation,
    ...orderResolvers.Mutation,
  },
};