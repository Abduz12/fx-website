import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tradingRules, dailyChecklists } from "@db/schema";

export const rulesRouter = createRouter({
  // Trading Rules
  createRule: authedQuery
    .input(
      z.object({
        rule: z.string().min(1),
        category: z.enum([
          "Risk Management",
          "Entry Rules",
          "Exit Rules",
          "Psychology",
          "Session",
          "General",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(tradingRules).values({
        ...input,
        userId: ctx.user.id,
      }).returning({ id: tradingRules.id });
      return { id: Number(result[0].id) };
    }),

  listRules: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(tradingRules)
      .where(eq(tradingRules.userId, ctx.user.id))
      .orderBy(desc(tradingRules.createdAt));
  }),

  updateRule: authedQuery
    .input(
      z.object({
        id: z.number(),
        rule: z.string().optional(),
        isActive: z.boolean().optional(),
        category: z.enum([
          "Risk Management",
          "Entry Rules",
          "Exit Rules",
          "Psychology",
          "Session",
          "General",
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      await db
        .update(tradingRules)
        .set(updateData)
        .where(and(eq(tradingRules.id, id), eq(tradingRules.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteRule: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(tradingRules)
        .where(and(eq(tradingRules.id, input.id), eq(tradingRules.userId, ctx.user.id)));
      return { success: true };
    }),

  // Daily Checklists
  getChecklist: authedQuery
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const checklist = await db
        .select()
        .from(dailyChecklists)
        .where(
          and(
            eq(dailyChecklists.userId, ctx.user.id),
            eq(dailyChecklists.date, new Date(input.date))
          )
        );
      return checklist;
    }),

  toggleChecklist: authedQuery
    .input(
      z.object({
        ruleId: z.number(),
        date: z.string(),
        completed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await db
        .select()
        .from(dailyChecklists)
        .where(
          and(
            eq(dailyChecklists.userId, ctx.user.id),
            eq(dailyChecklists.ruleId, input.ruleId),
            eq(dailyChecklists.date, new Date(input.date))
          )
        );

      if (existing.length > 0) {
        await db
          .update(dailyChecklists)
          .set({ completed: input.completed })
          .where(eq(dailyChecklists.id, existing[0].id));
      } else {
        await db.insert(dailyChecklists).values({
          userId: ctx.user.id,
          ruleId: input.ruleId,
          date: new Date(input.date),
          completed: input.completed,
        });
      }
      return { success: true };
    }),
});
