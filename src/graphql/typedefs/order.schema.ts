export const orderItemTypedefs = `#graphql
type Order {
  id: ID!
  totalAmount: Float!
  status: String!
  items: [OrderItem!]!
  createdAt: String
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}

type CheckoutResponse {
  url: String!
}

extend type Query {
  getMyOrders: [Order]
}

extend type Mutation {
  createCheckoutSession: CheckoutResponse!
}
`