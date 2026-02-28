import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

/**
 * Generates a random 6-character room code.
 */
function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous O, 0, I, 1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const create = mutation({
  args: {
    sheetId: v.id("sheet"),
    config: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    
    // Attempt to generate unique room code
    let roomCode = generateRoomCode();
    const existing = await ctx.db
      .query("game")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
      .first();
    
    // In many cases we'd loop, but Convex mutations are fast and deterministic. 
    // If it fails, let the client retry.
    if (existing) {
        roomCode = generateRoomCode(); // second try
    }

    const gameId = await ctx.db.insert("game", {
      roomCode,
      hostId: userId ?? undefined,
      sheetId: args.sheetId,
      status: "lobby",
      config: args.config,
      lastActivityAt: Date.now(),
    });

    return { gameId, roomCode };
  },
});

export const getByCode = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("game")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();
  },
});

export const getById = query({
  args: { gameId: v.id("game") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const start = mutation({
  args: { gameId: v.id("game") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    
    const userId = await auth.getUserId(ctx);
    if (game.hostId && userId !== game.hostId) {
        throw new Error("Only the host can start the game");
    }

    await ctx.db.patch(args.gameId, {
      status: "active",
      lastActivityAt: Date.now(),
    });
  },
});

export const end = mutation({
  args: { gameId: v.id("game") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;
    
    await ctx.db.patch(args.gameId, {
      status: "finished",
    });
  },
});

export const getLiveStats = query({
  args: {},
  handler: async (ctx) => {
    const activeGames = await ctx.db
      .query("game")
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "lobby"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();
    
    const gameIds = activeGames.map(g => g._id);
    let totalPlayers = 0;
    
    // This is not efficient for massive scale, but for MVP it's fine.
    // Ideally we'd keep a global counter table.
    for (const gid of gameIds) {
        const players = await ctx.db
            .query("player")
            .withIndex("by_game", q => q.eq("gameId", gid))
            .collect();
        totalPlayers += players.length;
    }

    return { totalPlayers };
  },
});

export const heartbeat = mutation({
    args: { gameId: v.id("game") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.gameId, {
            lastActivityAt: Date.now()
        });
    }
});

export const getWithSheet = query({
  args: { gameId: v.id("game") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;
    const sheet = await ctx.db.get(game.sheetId);
    return { ...game, sheet };
  },
});
