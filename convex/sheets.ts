import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const getDefaults = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sheet")
      .withIndex("by_creator", (q) => q.eq("creatorId", undefined))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();
  },
});

export const getForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("sheet")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    items: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    return await ctx.db.insert("sheet", {
      title: args.title,
      items: args.items,
      isDefault: false,
      creatorId: userId ?? undefined,
      playCount: 0,
    });
  },
});

export const getById = query({
  args: { id: v.id("sheet") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const incrementPlayCount = mutation({
  args: { id: v.id("sheet") },
  handler: async (ctx, args) => {
    const sheet = await ctx.db.get(args.id);
    if (!sheet) return;
    await ctx.db.patch(args.id, { playCount: (sheet.playCount || 0) + 1 });
  },
});
export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sheet")
      .order("desc") // This orders by _creationTime by default, need to sort by playCount
      .collect()
      .then(sheets => sheets.sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, args.limit || 5));
      // Since Convex doesn't support global sorting on non-indexed numeric fields well yet, 
      // we'll do in-memory sort for now (will scale better later with an index if needed).
  },
});

export const remove = mutation({
  args: { id: v.id("sheet") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    const sheet = await ctx.db.get(args.id);
    if (!sheet || sheet.creatorId !== userId) return;
    await ctx.db.delete(args.id);
  },
});
