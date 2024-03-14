export const types = `#graphql

    type User {
        id:ID!
        firstName:String!
        lastName:String
        email:String!
        profileImage:String
        tweets:[Tweet]
        followers:[User]
        following:[User]
    }
`;