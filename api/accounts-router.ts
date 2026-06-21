import { createRouter, authedQuery } from "./middleware";
import { z } from "zod";
import { getDb } from "./queries/connection";
import { accounts, trades } from "@db/schema";
import { eq, and, not } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const accountsRouter = createRouter({
  getAll: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    let userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, ctx.user.id))
      .orderBy(accounts.createdAt);
      
    if (userAccounts.length === 0) {
      // Auto-create Main Account for existing users
      const newAccount = await db
        .insert(accounts)
        .values({
          userId: ctx.user.id,
          name: "Main Account",
          initialBalance: String(ctx.user.initialBalance || 0),
          isDefault: true,
        })
        .returning();
      userAccounts = [newAccount[0]];
    }
      
    return userAccounts;
  }),
  
  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        initialBalance: z.number(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // If setting as default, unset others
      if (input.isDefault) {
        await db
          .update(accounts)
          .set({ isDefault: false })
          .where(eq(accounts.userId, ctx.user.id));
      }
      
      const newAccount = await db
        .insert(accounts)
        .values({
          userId: ctx.user.id,
          name: input.name,
          initialBalance: String(input.initialBalance),
          isDefault: input.isDefault,
        })
        .returning();
        
      return newAccount[0];
    }),
    
  setDefault: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Verify account belongs to user
      const acc = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.user.id)))
        .limit(1);
        
      if (acc.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }
      
      // Unset all others
      await db
        .update(accounts)
        .set({ isDefault: false })
        .where(eq(accounts.userId, ctx.user.id));
        
      // Set new default
      await db
        .update(accounts)
        .set({ isDefault: true })
        .where(eq(accounts.id, input.id));
        
      return { success: true };
    }),
    
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const acc = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, input.id), eq(accounts.userId, ctx.user.id)))
        .limit(1);
        
      if (acc.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      }
      
      if (acc[0].isDefault) {
        // Find another account to set as default
        const otherAccounts = await db
          .select()
          .from(accounts)
          .where(and(eq(accounts.userId, ctx.user.id), not(eq(accounts.id, input.id))))
          .limit(1);
          
        if (otherAccounts.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your only account" });
        }
        
        await db
          .update(accounts)
          .set({ isDefault: true })
          .where(eq(accounts.id, otherAccounts[0].id));
      }
      
      await db.delete(accounts).where(eq(accounts.id, input.id));
      return { success: true };
    }),
});
