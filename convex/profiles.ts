import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Fun, lighthearted tag suggestions
const SUGGESTED_TAGS = [
  "420 Friendly",
  "Wake & Bake",
  "Couch Philosopher",
  "Snack Master",
  "Rolling Pro",
  "Cloud Chaser",
  "Bong Appétit",
  "Joint Venture",
  "Chill Chief",
  "Munchies Expert",
  "Sativa Socialite",
  "Indica Enthusiast",
  "Dab Wizard",
  "Edible Explorer",
  "Highspirational",
  "Giggle Factory",
  "Zen Stoner",
  "Herb Nerd",
  "Puff Puff Pal",
  "Green Thumb",
  "Chronic Comedian",
  "Blunt Force",
  "Weed Connoisseur",
  "Grass Guru",
  "Vape Lord",
  "Rolling Stone",
  "Baked & Blessed",
  "Stash Captain",
  "Doobie Newbie",
  "Potent Pal",
  "Chilluminati",
];

function getRandomTags(n: number) {
  const shuffled = SUGGESTED_TAGS.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return profile;
  },
});

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    return profile;
  },
});

export const createProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
    smokingGoal: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    // If no tags provided, assign 3 random ones
    const tags = args.tags && args.tags.length > 0 ? args.tags : getRandomTags(3);

    return await ctx.db.insert("profiles", {
      userId,
      displayName: args.displayName,
      bio: args.bio,
      smokingGoal: args.smokingGoal,
      location: args.location,
      website: args.website,
      tags,
      joinedAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    smokingGoal: v.optional(v.string()),
    location: v.optional(v.string()),
    website: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    const updates: any = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.smokingGoal !== undefined) updates.smokingGoal = args.smokingGoal;
    if (args.location !== undefined) updates.location = args.location;
    if (args.website !== undefined) updates.website = args.website;
    if (args.tags !== undefined) updates.tags = args.tags;

    await ctx.db.patch(profile._id, updates);
  },
});

// ...rest unchanged (smoking status, photo, etc.)
export const updateSmokingStatus = mutation({
  args: { isSmokingNow: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      isSmokingNow: args.isSmokingNow,
      lastSmokingStatusUpdate: Date.now(),
    });
  },
});

// ...rest unchanged
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateProfilePhoto = mutation({
  args: { photoId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      photoId: args.photoId,
    });
  },
});

export const updateBackgroundPhoto = mutation({
  args: { backgroundId: v.id("_storage") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      backgroundId: args.backgroundId,
    });
  },
});

export const getProfilePhotoUrl = query({
  args: { photoId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.photoId);
  },
});

export const getBackgroundPhotoUrl = query({
  args: { backgroundId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.backgroundId);
  },
});

export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (userId === args.otherUserId) {
      throw new Error("Cannot create conversation with yourself");
    }

    const conversations = await ctx.db.query("conversations").collect();
    const existingConversation = conversations.find(conv => 
      (conv.participants.includes(userId) && conv.participants.includes(args.otherUserId))
    );

    if (existingConversation) {
      return existingConversation._id;
    }

    const conversationId = await ctx.db.insert("conversations", {
      participants: [userId, args.otherUserId].sort(),
      lastMessageAt: Date.now(),
      createdAt: Date.now(),
    });

    return conversationId;
  },
});

export const searchProfiles = query({
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
      (profile.displayName.toLowerCase().includes(args.searchTerm.toLowerCase()) ||
       (profile.bio && profile.bio.toLowerCase().includes(args.searchTerm.toLowerCase())))
    );

    return filteredProfiles.slice(0, 20);
  },
});
