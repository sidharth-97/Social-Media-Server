import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { User } from "./user";
import { Tweet } from "./tweet";
import { GraphqlContext } from "../interfaces";
import JWTService from "../services/jwt";

export async function initServer() {
    const app = express()
    const server = new ApolloServer<GraphqlContext>({
        typeDefs: `
        ${User.types}
        ${Tweet.types}
        type Query{
            ${User.queries}
            ${Tweet.queries}
        }
        type Mutation{
            ${Tweet.mutations}
            ${User.mutations}
        }
        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...Tweet.resolvers.queries
            },
            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations
            },
            ...Tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers
        }
    })
    await server.start()
    app.use("/graphql", cors<cors.CorsRequest>(), express.json(), expressMiddleware(server, {
        context: async ({ req, res }) => {
            return {
            user:req.headers.authorization?JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1]):undefined
        }
    }}))
    return app
}