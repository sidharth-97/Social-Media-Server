import axios from "axios"
import JWTService from "./jwt"
import { prismaClient } from "../clients/db"

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

class UserService{
    public static async verifyGoogleToken(token: string) {
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
    }
    public static followUser(from: string, to: string) {
        return prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following:{connect:{id:to}}
            }
        })
    }
    public static unfollowUser(from: string, to: string) {
        return prismaClient.follows.delete({
            where:{followerId_followingId:{followerId:from,followingId:to}}
        })
    }
}

export default UserService