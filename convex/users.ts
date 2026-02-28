import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

export const updateProfile = mutation({
  args: {
    nickname: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(userId, {
      name: args.nickname, // Convex Auth uses 'name' by default in Users table
    });
    
    return userId;
  },
});
