import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    console.log(ctx);
    const id = ctx.user?.id;
    if (!id) return null;
    const user = await prismaClient.user.findUnique({ where: { id } });
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => prismaClient.user.findUnique({ where: { id } }),
};

const extraResolvers = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { authorId: parent.id } }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((item) => item.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((item) => item.following);
    },
    recommendedUsers: async (parent: any, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];
      const cachedData = await redisClient.get(`REC_USER:${ctx.user.id}`)
      if(cachedData)return JSON.parse(cachedData)
      const myFollowing = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });

      const users: User[] = [];
      for (const followings of myFollowing) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myFollowing.findIndex(
              (e) => e.followingId == followingOfFollowedUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowedUser.following);
          }
        }
      }
      await redisClient.set(`REC_USER:${ctx.user.id}`,JSON.stringify(users))
      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");
    await UserService.followUser(ctx.user.id, to);
    await redisClient.del(`REC_USER:${ctx.user.id}`)
    return true;
  },
  UnfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");
    await UserService.unfollowUser(ctx.user.id, to);
    await redisClient.del(`REC_USER:${ctx.user.id}`)
    return true;
  },
};

export const resolvers = { queries, extraResolvers, mutations };
