import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendFriendRequest = mutation({
  args: { receiverId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friends")
      .filter((q) => q.or(
        q.and(
          q.eq(q.field("requesterId"), userId),
          q.eq(q.field("receiverId"), args.receiverId)
        ),
        q.and(
          q.eq(q.field("requesterId"), args.receiverId),
          q.eq(q.field("receiverId"), userId)
        )
      ))
      .unique();

    if (existingFriendship) {
      throw new Error("Friendship already exists");
    }

    return await ctx.db.insert("friends", {
      requesterId: userId,
      receiverId: args.receiverId,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friends") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friend request not found");

    if (friendship.receiverId !== userId) {
      throw new Error("Not authorized to accept this request");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request is not pending");
    }

    await ctx.db.patch(args.friendshipId, { status: "accepted" });
  },
});

export const declineFriendRequest = mutation({
  args: { friendshipId: v.id("friends") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friend request not found");

    if (friendship.receiverId !== userId) {
      throw new Error("Not authorized to decline this request");
    }

    if (friendship.status !== "pending") {
      throw new Error("Request is not pending");
    }

    await ctx.db.delete(args.friendshipId);
  },
});

export const removeFriend = mutation({
  args: { friendshipId: v.id("friends") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) throw new Error("Friendship not found");

    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      throw new Error("Not authorized to remove this friendship");
    }

    await ctx.db.delete(args.friendshipId);
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const requests = await ctx.db
      .query("friends")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const requesterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", request.requesterId))
          .unique();

        return {
          ...request,
          requesterProfile,
        };
      })
    );

    return requestsWithProfiles;
  },
});

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const friendships = await ctx.db
      .query("friends")
      .filter((q) => q.and(
        q.or(
          q.eq(q.field("requesterId"), userId),
          q.eq(q.field("receiverId"), userId)
        ),
        q.eq(q.field("status"), "accepted")
      ))
      .collect();

    const friendsWithProfiles = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.requesterId === userId 
          ? friendship.receiverId 
          : friendship.requesterId;

        const friendProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", friendId))
          .unique();

        return {
          ...friendship,
          friendId,
          friendProfile,
        };
      })
    );

    return friendsWithProfiles;
  },
});

export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    if (!args.searchTerm.trim()) return [];

    const profiles = await ctx.db
      .query("profiles")
      .collect();

    const filteredProfiles = profiles.filter(profile => 
      profile.userId !== userId &&
      profile.displayName.toLowerCase().includes(args.searchTerm.toLowerCase())
    );

    // Get friendship status for each user
    const usersWithFriendshipStatus = await Promise.all(
      filteredProfiles.map(async (profile) => {
        const friendship = await ctx.db
          .query("friends")
          .filter((q) => q.or(
            q.and(
              q.eq(q.field("requesterId"), userId),
              q.eq(q.field("receiverId"), profile.userId)
            ),
            q.and(
              q.eq(q.field("requesterId"), profile.userId),
              q.eq(q.field("receiverId"), userId)
            )
          ))
          .unique();

        let friendshipStatus = "none";
        let friendshipId = null;

        if (friendship) {
          friendshipId = friendship._id;
          if (friendship.status === "accepted") {
            friendshipStatus = "friends";
          } else if (friendship.requesterId === userId) {
            friendshipStatus = "sent";
          } else {
            friendshipStatus = "received";
          }
        }

        return {
          ...profile,
          friendshipStatus,
          friendshipId,
        };
      })
    );

    return usersWithFriendshipStatus.slice(0, 20);
  },
});

export const getFriendshipStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return null;

    if (currentUserId === args.userId) return "self";

    const friendship = await ctx.db
      .query("friends")
      .filter((q) => q.or(
        q.and(
          q.eq(q.field("requesterId"), currentUserId),
          q.eq(q.field("receiverId"), args.userId)
        ),
        q.and(
          q.eq(q.field("requesterId"), args.userId),
          q.eq(q.field("receiverId"), currentUserId)
        )
      ))
      .unique();

    if (!friendship) return "none";

    if (friendship.status === "accepted") return "friends";
    if (friendship.requesterId === currentUserId) return "sent";
    return "received";
  },
});
