export const productTypeDefs = `#graphql
  type Product {
    id: ID!
    title: String!
    description: String
    price: Float!
    stock: Int!
    imageUrl: String
    userId: ID!
    user: User
    createdAt: String
    updatedAt: String
  }

  input CreateProductInput {
    title: String!
    description: String!
    price: Float!
    stock: Int!
    imageUrl: String!
  }

  input UpdateProductInput {
    title: String
    description: String
    price: Float
    stock: Int
    imageUrl: String
  }
    
  input ProductFilterInput {
    search: String
    minPrice: Float
    maxPrice: Float
  }
  
  extend type Query {
    getProducts(limit: Int, offset: Int, filter: ProductFilterInput): [Product]
    getProductById(id: ID!): Product
    getProductsByUserId(userId: ID!): [Product]
  }

  type ProductConnection {
    items: [Product!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  extend type Mutation {
    createProduct(input: CreateProductInput!): Product
    
    updateProduct(id: ID!, input: UpdateProductInput!): Product
    deleteProduct(id: ID!): Product
  }
`;
