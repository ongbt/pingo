import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  sheet: defineTable({
    title: v.string(),
    items: v.array(v.string()),
    isDefault: v.boolean(),
    creatorId: v.optional(v.id("users")),
    playCount: v.number(),
  }).index("by_creator", ["creatorId"]),

  game: defineTable({
    roomCode: v.string(),
    hostId: v.optional(v.id("users")),
    sheetId: v.id("sheet"),
    status: v.union(v.literal("lobby"), v.literal("active"), v.literal("finished")),
    config: v.any(),
    lastActivityAt: v.number(),
  }).index("by_roomCode", ["roomCode"]),

  player: defineTable({
    gameId: v.id("game"),
    authId: v.optional(v.id("users")),
    nickname: v.string(),
    isHost: v.boolean(),
    boardState: v.any(),
    boardLayout: v.optional(v.array(v.number())),
    score: v.number(),
    isWinner: v.boolean(),
    bingoRank: v.optional(v.number()),
  }).index("by_game", ["gameId"])
    .index("by_auth", ["authId"])
    .index("by_auth_game", ["authId", "gameId"]),
});
