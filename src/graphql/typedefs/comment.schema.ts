export const commentTypeDefs = `#graphql
type Comment {
id: ID!
content: String!
userId: String!
productId: ID!
createdAt: String
}

input CreateCommentInput {
content: String!
userId: String!
productId: ID!
}

extend type Query {
getCommentById(id: ID!): Comment
}

extend type Mutation {
createComment(input: CreateCommentInput!) : Comment
deleteComment(id: ID!): Comment
}
`