import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Show posts from user, friends, and following
export const getFeed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Get user's friends
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

    const friendIds = friendships.map(f =>
      f.requesterId === userId ? f.receiverId : f.requesterId
    );

    // Get user's follows (for future extensibility)
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const followingIds = follows.map(f => f.followingId);

    // Combine friends and following (unique)
    const allUserIds = Array.from(new Set([userId, ...friendIds, ...followingIds]));

    // Get posts from friends, following, and self
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(100);

    const feedPosts = posts.filter(post => allUserIds.includes(post.userId));

    // Enrich posts with user profiles and engagement data
    const enrichedPosts = await Promise.all(
      feedPosts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .unique();

        const userLike = await ctx.db
          .query("likes")
          .withIndex("by_post_and_user", (q) => q.eq("postId", post._id).eq("userId", userId))
          .unique();

        const userRetweet = await ctx.db
          .query("retweets")
          .withIndex("by_post_and_user", (q) => q.eq("postId", post._id).eq("userId", userId))
          .unique();

        const comments = await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        const commentsWithProfiles = await Promise.all(
          comments.map(async (comment) => {
            const commentProfile = await ctx.db
              .query("profiles")
              .withIndex("by_user", (q) => q.eq("userId", comment.userId))
              .unique();
            
            const commentLikes = await ctx.db
              .query("likes")
              .withIndex("by_comment", (q) => q.eq("commentId", comment._id))
              .collect();

            const userCommentLike = await ctx.db
              .query("likes")
              .withIndex("by_comment_and_user", (q) => q.eq("commentId", comment._id).eq("userId", userId))
              .unique();

            return {
              ...comment,
              profile: commentProfile,
              likes: commentLikes.length,
              isLiked: !!userCommentLike,
            };
          })
        );

        // Get retweet count
        const retweets = await ctx.db
          .query("retweets")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          profile,
          isLiked: !!userLike,
          isRetweeted: !!userRetweet,
          comments: commentsWithProfiles,
          retweets: retweets.length,
          imageUrl: post.imageId ? await ctx.storage.getUrl(post.imageId) : null,
        };
      })
    );

    return enrichedPosts;
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
    type: v.string(),
    imageId: v.optional(v.id("_storage")),
    faded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("posts", {
      userId,
      content: args.content,
      type: args.type,
      imageId: args.imageId,
      faded: args.faded,
      likes: 0,
      comments: 0,
      retweets: 0,
      createdAt: Date.now(),
    });
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.postId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const likePost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) => q.eq("postId", args.postId).eq("userId", userId))
      .unique();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, { likes: Math.max(0, post.likes - 1) });
    } else {
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, { likes: post.likes + 1 });

      if (post.userId !== userId) {
        await ctx.db.insert("notifications", {
          userId: post.userId,
          type: "like",
          fromUserId: userId,
          postId: args.postId,
          message: "liked your post",
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const retweetPost = mutation({
  args: { 
    postId: v.id("posts"),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingRetweet = await ctx.db
      .query("retweets")
      .withIndex("by_post_and_user", (q) => q.eq("postId", args.postId).eq("userId", userId))
      .unique();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (existingRetweet) {
      await ctx.db.delete(existingRetweet._id);
      await ctx.db.patch(args.postId, { retweets: Math.max(0, (post.retweets || 0) - 1) });
    } else {
      await ctx.db.insert("retweets", {
        postId: args.postId,
        userId,
        comment: args.comment,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.postId, { retweets: (post.retweets || 0) + 1 });

      if (post.userId !== userId) {
        await ctx.db.insert("notifications", {
          userId: post.userId,
          type: "retweet",
          fromUserId: userId,
          postId: args.postId,
          message: args.comment ? `retweeted your post: "${args.comment}"` : "retweeted your post",
          read: false,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      userId,
      content: args.content,
      likes: 0,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, { 
      comments: (post.comments || 0) + 1 
    });

    if (post.userId !== userId) {
      await ctx.db.insert("notifications", {
        userId: post.userId,
        type: "comment",
        fromUserId: userId,
        postId: args.postId,
        commentId,
        message: `commented on your post: "${args.content}"`,
        read: false,
        createdAt: Date.now(),
      });
    }

    return commentId;
  },
});

export const likeComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_comment_and_user", (q) => q.eq("commentId", args.commentId).eq("userId", userId))
      .unique();

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, { likes: Math.max(0, (comment.likes || 0) - 1) });
    } else {
      await ctx.db.insert("likes", {
        commentId: args.commentId,
        userId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.commentId, { likes: (comment.likes || 0) + 1 });
    }
  },
});

export const getUserPosts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) return [];

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", post.userId))
          .unique();

        const userLike = await ctx.db
          .query("likes")
          .withIndex("by_post_and_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
          .unique();

        const userRetweet = await ctx.db
          .query("retweets")
          .withIndex("by_post_and_user", (q) => q.eq("postId", post._id).eq("userId", currentUserId))
          .unique();

        return {
          ...post,
          profile,
          isLiked: !!userLike,
          isRetweeted: !!userRetweet,
          imageUrl: post.imageId ? await ctx.storage.getUrl(post.imageId) : null,
        };
      })
    );

    return enrichedPosts;
  },
});
