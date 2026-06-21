import { z } from "zod";
import { eq, desc, count, sql } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, trades } from "@db/schema";

export const adminRouter = createRouter({
  // Get all users
  getUsers: adminQuery.query(async () => {
    const db = getDb();
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
        lastSignInAt: users.lastSignInAt,
        tradeCount: sql<number>`(SELECT COUNT(*) FROM trades WHERE trades.userId = users.id)`,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return allUsers;
  }),

  // Update user role
  updateUserRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),

  // System statistics
  getSystemStats: adminQuery.query(async () => {
    const db = getDb();
    
    const [userCount] = await db
      .select({ count: count() })
      .from(users);
    
    const [tradeCount] = await db
      .select({ count: count() })
      .from(trades);

    const [adminCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "admin"));

    // Recent activity
    const recentUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    return {
      totalUsers: userCount.count,
      totalTrades: tradeCount.count,
      adminCount: adminCount.count,
      recentUsers,
    };
  }),
});
