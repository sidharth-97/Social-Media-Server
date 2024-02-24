import axios from "axios"
import { prismaClient } from "../../clients/db"
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";

interface GoogleTokenResult {
    iss?: string;
    nbf?: string;
    aud?: string;
    sub?: string;
    email: string;
    email_verified: string;
    azp?: string;
    name?: string;
    picture?: string;
    given_name: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
  }

const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
        const googleToken = token
        const googleAuthUrl = new URL("https://oauth2.googleapis.com/tokeninfo")
        googleAuthUrl.searchParams.set("id_token", googleToken)
        
        const { data } = await axios.get<GoogleTokenResult>(googleAuthUrl.toString(), {
            responseType:"json"
        })

        const user = await prismaClient.user.findUnique({
            where:{email:data.email}
        })

        if (!user) {
            await prismaClient.user.create({
                data: {
                    email: data.email,
                    firstName: data.given_name,
                    lastName: data.family_name,
                    profileImage:data.picture
                }
            })
        }

        const userInDB = await prismaClient.user.findUnique({
            where:{email:data.email}
        })

        if(!userInDB)throw new Error("User with email not found")

        const Usertoken = await JWTService.generateToken(userInDB)
        return Usertoken
    },
    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
       console.log(ctx);
        const id = ctx.user?.id
        if (!id) return null
        const user = await prismaClient.user.findUnique({ where: { id } })
        return user
    }
}

const extraResolvers = {
    User: {
        tweets:(parent:User)=>prismaClient.tweet.findMany({where:{authorId:parent.id}})
    }
}

export const resolvers={queries,extraResolvers}