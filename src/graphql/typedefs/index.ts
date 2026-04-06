import { productTypeDefs } from "./product.schema";
import { userTypeDefs } from "./user.schema";
import { commentTypeDefs } from "./comment.schema";
import { cartItemsTypeDefs } from "./cart.schema";
import { orderItemTypedefs } from "./order.schema";

const baseTypeDefs = `#graphql
  type Query {
    _empty: String
  }
  type Mutation {
    _empty: String
  }
`;

export const mergedTypeDefs = [
  baseTypeDefs,
  productTypeDefs,
  userTypeDefs,
  commentTypeDefs,
  cartItemsTypeDefs,
  orderItemTypedefs,
];
