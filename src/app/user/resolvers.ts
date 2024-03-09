import { prismaClient } from "../../clients/db"
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const resultToken = await UserService.verifyGoogleToken(token)
        return resultToken
    },
    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
       console.log(ctx);
        const id = ctx.user?.id
        if (!id) return null
        const user = await prismaClient.user.findUnique({ where: { id } })
        return user
    },
    getUserById: async (parent: any, {id}: { id: string }, ctx: GraphqlContext)=>prismaClient.user.findUnique({where:{id}})
}

const extraResolvers = {
    User: {
        tweets:(parent:User)=>prismaClient.tweet.findMany({where:{authorId:parent.id}})
    }
}

export const resolvers={queries,extraResolvers}