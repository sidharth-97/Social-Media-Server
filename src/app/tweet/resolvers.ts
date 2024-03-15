import { Tweet } from "@prisma/client"
import { prismaClient } from "../../clients/db"
import { GraphqlContext } from "../../interfaces"
import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { redisClient } from "../../clients/redis"

interface CreateTweetPayload{
    content:string
    imageURL?:string
}

const s3Client=new S3Client({region:"ap-south-1",credentials:{accessKeyId:`${process.env.ACCESS_KEY}`,secretAccessKey:`${process.env.SECRET_KEY}`}})

const queries = {
    getAllTweets: async () => await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } }),
    getSignedUrl: async (parent:any,{imageType,imageName}:{imageType:string,imageName:string},ctx:GraphqlContext) => {
        if (!ctx.user) throw new Error("You are not authenticated")
        const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!allowedImageTypes.includes(imageType)) throw new Error("Unsupported Image format")
        const putObjectCommand = new PutObjectCommand({
            Bucket: "social-media-app2",
            Key:`uploads/${ctx.user.id}/tweets/${imageName+Date.now().toString()}.${imageType}`
        }) 
        const signedUrl = await getSignedUrl(s3Client, putObjectCommand)
        return signedUrl
    }
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetPayload }, ctx: GraphqlContext) => {
        if (!ctx.user) throw new Error("You are not authenticated")
        const rateLimit = await redisClient.get(`RATE_LIMIT:TWEET:${ctx.user.id}`)
        if(rateLimit)throw new Error("Please wait ... ")
       const tweet= await prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author:{connect:{id:ctx.user.id}}
        }
       })
        await redisClient.setex(`RATE_LIMIT:TWEET:${ctx.user.id}`,10,1)
        return tweet
    }
}

const extraResolvers = {
    Tweet: {
       author:(parent:Tweet)=> prismaClient.user.findUnique({where:{id:parent.authorId}})
    }
}

export const resolvers={mutations,extraResolvers,queries}