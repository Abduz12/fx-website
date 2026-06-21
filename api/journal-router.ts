import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { journalEntries } from "@db/schema";

export const journalRouter = createRouter({
  create: authedQuery
    .input(
      z.object({
        date: z.string(),
        title: z.string().min(1),
        content: z.string().min(1),
        mood: z.enum([
          "Excellent",
          "Good",
          "Neutral",
          "Bad",
          "Terrible",
        ]).optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(journalEntries).values({
        userId: ctx.user.id,
        date: new Date(input.date),
        title: input.title,
        content: input.content,
        mood: input.mood || null,
        tags: input.tags || null,
      }).returning({ id: journalEntries.id });
      return { id: Number(result[0].id) };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, ctx.user.id))
      .orderBy(desc(journalEntries.date));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [entry] = await db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.id, input.id),
            eq(journalEntries.userId, ctx.user.id)
          )
        );
      return entry || null;
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        mood: z.enum(["Excellent", "Good", "Neutral", "Bad", "Terrible"]).optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      const payload: Record<string, any> = {};
      if (updateData.title !== undefined) payload.title = updateData.title;
      if (updateData.content !== undefined) payload.content = updateData.content;
      if (updateData.mood !== undefined) payload.mood = updateData.mood;
      if (updateData.tags !== undefined) payload.tags = updateData.tags;

      await db
        .update(journalEntries)
        .set(payload)
        .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, ctx.user.id)));
      return { success: true };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(journalEntries)
        .where(and(eq(journalEntries.id, input.id), eq(journalEntries.userId, ctx.user.id)));
      return { success: true };
    }),
});
