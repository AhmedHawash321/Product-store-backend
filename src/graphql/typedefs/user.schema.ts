export const userTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String
    imageUrl: String
    createdAt: String
    updatedAt: String
  }

  input UpsertUserInput {
    id: ID!
    email: String!
    name: String
    imageUrl: String
  }

  input UpdateUserInput {
    name: String
    imageUrl: String
  }

  extend type Query {
    getUserById(id: ID!): User
  }

  extend type Mutation {
    syncUser(input: UpsertUserInput!): User  
    updateUser(id: ID!, input: UpdateUserInput!): User
  }
`;