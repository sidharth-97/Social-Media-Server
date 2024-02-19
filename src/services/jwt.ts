import JWT from "jsonwebtoken"
import { prismaClient } from "../clients/db"
import { User } from "@prisma/client"

class JWTService{
    public static async generateToken(user:User) {
        const payload = {
            id: user?.id,
            email:user?.email
        }
        const token = JWT.sign(payload, process.env.JWT_SECRET as string)
        return token
    }
}

export default JWTService