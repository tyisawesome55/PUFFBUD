import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.storage.generateUploadUrl();
  },
});

export const logPuff = mutation({
  args: {
    cigarettes: v.number(),
    location: v.optional(v.string()),
    mood: v.optional(v.string()),
    notes: v.optional(v.string()),
    method: v.optional(v.string()),
    strain: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("smokingPuffs", {
      userId,
      timestamp: Date.now(),
      cigarettes: args.cigarettes,
      location: args.location,
      mood: args.mood,
      notes: args.notes,
      method: args.method,
      strain: args.strain,
      imageId: args.imageId,
    });
  },
});

export const getPuffs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const puffs = await ctx.db
      .query("smokingPuffs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    // Get image URLs for puffs with images
    const puffsWithImages = await Promise.all(
      puffs.map(async (puff) => {
        let imageUrl = null;
        if (puff.imageId) {
          imageUrl = await ctx.storage.getUrl(puff.imageId);
        }
        return {
          ...puff,
          imageUrl,
        };
      })
    );

    return puffsWithImages;
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const allPuffs = await ctx.db
      .query("smokingPuffs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const todayPuffs = allPuffs.filter(p => p.timestamp >= oneDayAgo);
    const weekPuffs = allPuffs.filter(p => p.timestamp >= oneWeekAgo);
    const monthPuffs = allPuffs.filter(p => p.timestamp >= oneMonthAgo);

    const todayCigarettes = todayPuffs.reduce((sum, p) => sum + p.cigarettes, 0);
    const weekCigarettes = weekPuffs.reduce((sum, p) => sum + p.cigarettes, 0);
    const monthCigarettes = monthPuffs.reduce((sum, p) => sum + p.cigarettes, 0);
    const totalCigarettes = allPuffs.reduce((sum, p) => sum + p.cigarettes, 0);

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Sort puffs by date (most recent first)
    const sortedPuffs = allPuffs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Group puffs by day
    const puffsByDay = new Map<string, any[]>();
    sortedPuffs.forEach(puff => {
      const day = new Date(puff.timestamp).toDateString();
      if (!puffsByDay.has(day)) {
        puffsByDay.set(day, []);
      }
      puffsByDay.get(day)!.push(puff);
    });

    // Calculate current streak (consecutive days with puffs)
    const today = new Date().toDateString();
    let checkDate = new Date();
    
    while (true) {
      const dayStr = checkDate.toDateString();
      if (puffsByDay.has(dayStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    const allDays = Array.from(puffsByDay.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    for (let i = 0; i < allDays.length; i++) {
      tempStreak = 1;
      let currentDay = new Date(allDays[i]);
      
      for (let j = i + 1; j < allDays.length; j++) {
        const nextDay = new Date(allDays[j]);
        const dayDiff = (currentDay.getTime() - nextDay.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
          currentDay = nextDay;
        } else {
          break;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return {
      today: {
        puffs: todayPuffs.length,
        cigarettes: todayCigarettes,
      },
      week: {
        puffs: weekPuffs.length,
        cigarettes: weekCigarettes,
      },
      month: {
        puffs: monthPuffs.length,
        cigarettes: monthCigarettes,
      },
      total: {
        puffs: allPuffs.length,
        cigarettes: totalCigarettes,
      },
      streaks: {
        current: currentStreak,
        longest: longestStreak,
      },
    };
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get all puffs from the last week
    const recentPuffs = await ctx.db
      .query("smokingPuffs")
      .withIndex("by_timestamp", (q) => q.gte("timestamp", oneWeekAgo))
      .collect();

    // Group by user
    const userStats = new Map();
    
    for (const puff of recentPuffs) {
      if (!userStats.has(puff.userId)) {
        userStats.set(puff.userId, {
          userId: puff.userId,
          puffs: 0,
          cigarettes: 0,
        });
      }
      
      const stats = userStats.get(puff.userId);
      stats.puffs += 1;
      stats.cigarettes += puff.cigarettes;
    }

    // Get user profiles and create leaderboard
    const leaderboard = [];
    for (const [userId, stats] of userStats) {
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      
      if (profile) {
        leaderboard.push({
          userId,
          displayName: profile.displayName,
          puffs: stats.puffs,
          cigarettes: stats.cigarettes,
        });
      }
    }

    // Sort by number of cigarettes (descending)
    return leaderboard.sort((a, b) => b.cigarettes - a.cigarettes).slice(0, 10);
  },
});

export const deletePuff = mutation({
  args: { puffId: v.id("smokingPuffs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const puff = await ctx.db.get(args.puffId);
    if (!puff) throw new Error("Puff not found");
    if (puff.userId !== userId) throw new Error("Not authorized");
    
    // Delete associated image if it exists
    if (puff.imageId) {
      await ctx.storage.delete(puff.imageId);
    }
    
    await ctx.db.delete(args.puffId);
  },
});
