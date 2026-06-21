import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { tradePsychology } from "@db/schema";

export const psychologyRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        tradeId: z.number(),
        entryReason: z.string().optional(),
        confidenceLevel: z.number().min(1).max(10).optional(),
        emotionBefore: z.enum([
          "Fear",
          "Greed",
          "Confidence",
          "Patience",
          "Revenge",
          "Neutral",
          "Excitement",
          "Anxiety",
        ]).optional(),
        followedPlan: z.boolean().optional(),
        mistakeMade: z.string().optional(),
        lessonLearned: z.string().optional(),
        emotionAfter: z.enum([
          "Fear",
          "Greed",
          "Confidence",
          "Patience",
          "Revenge",
          "Neutral",
          "Excitement",
          "Anxiety",
          "Relief",
          "Regret",
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(tradePsychology).values({
        ...input,
        userId: ctx.user.id,
      });
      return { id: Number(result[0].insertId) };
    }),

  getByTradeId: authedQuery
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [psychology] = await db
        .select()
        .from(tradePsychology)
        .where(
          and(
            eq(tradePsychology.tradeId, input.tradeId),
            eq(tradePsychology.userId, ctx.user.id)
          )
        );
      return psychology || null;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        entryReason: z.string().optional(),
        confidenceLevel: z.number().min(1).max(10).optional(),
        emotionBefore: z.enum([
          "Fear", "Greed", "Confidence", "Patience", "Revenge", "Neutral", "Excitement", "Anxiety",
        ]).optional(),
        followedPlan: z.boolean().optional(),
        mistakeMade: z.string().optional(),
        lessonLearned: z.string().optional(),
        emotionAfter: z.enum([
          "Fear", "Greed", "Confidence", "Patience", "Revenge", "Neutral", "Excitement", "Anxiety", "Relief", "Regret",
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      await db
        .update(tradePsychology)
        .set(updateData)
        .where(
          and(eq(tradePsychology.id, id), eq(tradePsychology.userId, ctx.user.id))
        );
      return { success: true };
    }),
});
