import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const strains = await ctx.db.query("strains").order("desc").collect();
    return strains;
  },
});

export const getStrain = query({
  args: { strainId: v.id("strains") },
  handler: async (ctx, args) => {
    const strain = await ctx.db.get(args.strainId);
    return strain;
  },
});

export const addStrain = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    thc: v.optional(v.number()),
    cbd: v.optional(v.number()),
    effects: v.array(v.string()),
    flavors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if strain already exists
    const existingStrain = await ctx.db
      .query("strains")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existingStrain) {
      throw new Error("A strain with this name already exists");
    }

    const strainId = await ctx.db.insert("strains", {
      name: args.name,
      type: args.type,
      description: args.description,
      thc: args.thc,
      cbd: args.cbd,
      effects: args.effects,
      flavors: args.flavors,
      createdAt: Date.now(),
      avgRating: undefined,
      reviewCount: 0,
    });

    return strainId;
  },
});

export const getStrainReviews = query({
  args: { strainId: v.id("strains") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("strainReviews")
      .withIndex("by_strain", (q) => q.eq("strainId", args.strainId))
      .order("desc")
      .collect();

    // Enrich reviews with user profiles
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", review.userId))
          .unique();
        
        return {
          ...review,
          user,
        };
      })
    );

    return enrichedReviews;
  },
});

export const addStrainReview = mutation({
  args: {
    strainId: v.id("strains"),
    rating: v.number(),
    review: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already reviewed this strain
    const existingReview = await ctx.db
      .query("strainReviews")
      .withIndex("by_strain", (q) => q.eq("strainId", args.strainId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .unique();

    if (existingReview) {
      // Update existing review
      await ctx.db.patch(existingReview._id, {
        rating: args.rating,
        review: args.review,
        method: args.method,
        createdAt: Date.now(),
      });
    } else {
      // Create new review
      await ctx.db.insert("strainReviews", {
        strainId: args.strainId,
        userId,
        rating: args.rating,
        review: args.review,
        method: args.method,
        createdAt: Date.now(),
      });
    }

    // Update strain's average rating and review count
    const allReviews = await ctx.db
      .query("strainReviews")
      .withIndex("by_strain", (q) => q.eq("strainId", args.strainId))
      .collect();

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await ctx.db.patch(args.strainId, {
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      reviewCount: allReviews.length,
    });

    return null;
  },
});

export const addToFavorites = mutation({
  args: { strainId: v.id("strains") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("strainId"), args.strainId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { action: "removed" };
    } else {
      await ctx.db.insert("favorites", {
        userId,
        strainId: args.strainId,
        createdAt: Date.now(),
      });
      return { action: "added" };
    }
  },
});

export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const strains = await Promise.all(
      favorites.map(async (fav) => {
        const strain = await ctx.db.get(fav.strainId);
        return strain;
      })
    );

    return strains.filter(Boolean);
  },
});
