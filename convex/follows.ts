import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const followUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    if (currentUserId === args.userId) {
      throw new Error("Cannot follow yourself");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) => 
        q.eq("followerId", currentUserId).eq("followingId", args.userId)
      )
      .unique();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    return await ctx.db.insert("follows", {
      followerId: currentUserId,
      followingId: args.userId,
      createdAt: Date.now(),
    });
  },
});

export const unfollowUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Not authenticated");

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) => 
        q.eq("followerId", currentUserId).eq("followingId", args.userId)
      )
      .unique();

    if (!follow) {
      throw new Error("Not following this user");
    }

    await ctx.db.delete(follow._id);
  },
});

export const getFollowStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return null;

    if (currentUserId === args.userId) return "self";

    const isFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) => 
        q.eq("followerId", currentUserId).eq("followingId", args.userId)
      )
      .unique();

    return isFollowing ? "following" : "not_following";
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const followersWithProfiles = await Promise.all(
      followers.map(async (follow) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", follow.followerId))
          .unique();

        return {
          ...follow,
          profile,
        };
      })
    );

    return followersWithProfiles;
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const followingWithProfiles = await Promise.all(
      following.map(async (follow) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", follow.followingId))
          .unique();

        return {
          ...follow,
          profile,
        };
      })
    );

    return followingWithProfiles;
  },
});

export const getFollowCounts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return {
      followers: followers.length,
      following: following.length,
    };
  },
});
