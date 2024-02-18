import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';

export async function initServer() {
    const app = express()
    const server = new ApolloServer({
        typeDefs: `
        type Query{
            check:String
        }
        `,
        resolvers: {
            Query: {
                check:()=>"Checking server"
            }
        }
    })
    await server.start()
    app.use("/graphql", cors<cors.CorsRequest>(), express.json(),expressMiddleware(server))
    return app
}