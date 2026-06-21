import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tradingGoals } from "@db/schema";

export const goalsRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        goalType: z.enum([
          "Monthly Profit",
          "Win Rate",
          "Risk Reward",
          "Trade Count",
          "Discipline Score",
          "Custom",
        ]),
        period: z.enum(["Daily", "Weekly", "Monthly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(tradingGoals).values({
        ...input,
        userId: ctx.user.id,
        targetValue: input.targetValue ? String(input.targetValue) : null,
        currentValue: input.currentValue ? String(input.currentValue) : null,
      }).returning({ id: tradingGoals.id });
      return { id: Number(result[0].id) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(tradingGoals)
      .where(eq(tradingGoals.userId, ctx.user.id));
  }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        targetValue: z.number().optional(),
        currentValue: z.number().optional(),
        goalType: z.string().optional(),
        period: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      const payload: any = { ...updateData };
      if (updateData.targetValue !== undefined) payload.targetValue = String(updateData.targetValue);
      if (updateData.currentValue !== undefined) payload.currentValue = String(updateData.currentValue);

      await db
        .update(tradingGoals)
        .set(payload)
        .where(and(eq(tradingGoals.id, id), eq(tradingGoals.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(tradingGoals)
        .where(and(eq(tradingGoals.id, input.id), eq(tradingGoals.userId, ctx.user.id)));
      return { success: true };
    }),
});
