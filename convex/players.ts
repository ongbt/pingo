import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const join = mutation({
  args: {
    gameId: v.id("game"),
    nickname: v.string(),
    isHost: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    
    // Check if player already in game
    if (userId) {
        const existing = await ctx.db
            .query("player")
            .withIndex("by_auth_game", q => q.eq("authId", userId).eq("gameId", args.gameId))
            .first();
        if (existing) return existing._id;
    }

    const playerId = await ctx.db.insert("player", {
      gameId: args.gameId,
      authId: userId ?? undefined,
      nickname: args.nickname,
      isHost: args.isHost ?? false,
      boardState: [],
      score: 0,
      isWinner: false,
    });
    
    return playerId;
  },
});

export const getForGame = query({
  args: { gameId: v.id("game") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("player")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

export const getById = query({
  args: { playerId: v.id("player") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

export const updateBoard = mutation({
  args: { 
    playerId: v.id("player"), 
    boardState: v.optional(v.any()),
    boardLayout: v.optional(v.array(v.number()))
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    const updates: Record<string, unknown> = {};
    if (args.boardState !== undefined) updates.boardState = args.boardState;
    if (args.boardLayout !== undefined) updates.boardLayout = args.boardLayout;

    await ctx.db.patch(args.playerId, updates);
    
    // Bump game activity
    await ctx.db.patch(player.gameId, { lastActivityAt: Date.now() });
  },
});

export const claimBingo = mutation({
  args: { playerId: v.id("player") },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    const game = await ctx.db.get(player.gameId);
    if (!game || game.status !== "active") return;

    // First bingo wins! Set game as finished immediately.
    await ctx.db.patch(args.playerId, { isWinner: true, score: (player.score || 0) + 10 });
    await ctx.db.patch(player.gameId, { status: "finished" });

    // Increment sheet play count
    const sheet = await ctx.db.get(game.sheetId);
    if (sheet) {
        await ctx.db.patch(game.sheetId, { playCount: (sheet.playCount || 0) + 1 });
    }
  },
});

export const leave = mutation({
  args: { playerId: v.id("player") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.playerId);
  },
});
