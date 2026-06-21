import { z } from "zod";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { trades } from "@db/schema";

export const tradeRouter = createRouter({
  // Create a new trade
  create: authedQuery
    .input(
      z.object({
        tradeDate: z.string(),
        tradeTime: z.string(),
        session: z.enum(["Asian", "London", "New York"]),
        market: z.enum([
          "XAUUSD",
          "EURUSD",
          "GBPUSD",
          "USDJPY",
          "NAS100",
          "US30",
          "BTCUSD",
          "ETHUSD",
          "Other",
        ]),
        direction: z.enum(["Buy", "Sell"]),
        entryPrice: z.number(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
        lotSize: z.number(),
        riskPercent: z.number().optional(),
        riskAmount: z.number().optional(),
        rewardAmount: z.number().optional(),
        riskRewardRatio: z.number().optional(),
        strategy: z.enum([
          "ICT Smart Money Concepts",
          "Breakout Retest",
          "Supply and Demand",
          "Trend Following",
          "Scalping",
          "News Trading",
          "Other",
        ]),
        trend: z.enum(["Bullish", "Bearish", "Ranging"]),
        timeframe: z.enum(["1M", "5M", "15M", "1H", "4H", "Daily"]),
        notes: z.string().optional(),
        screenshots: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(trades).values({
        userId: ctx.user.id,
        tradeDate: new Date(input.tradeDate),
        tradeTime: input.tradeTime,
        session: input.session,
        market: input.market,
        direction: input.direction,
        entryPrice: String(input.entryPrice),
        stopLoss: input.stopLoss ? String(input.stopLoss) : null,
        takeProfit: input.takeProfit ? String(input.takeProfit) : null,
        lotSize: String(input.lotSize),
        riskPercent: input.riskPercent ? String(input.riskPercent) : null,
        riskAmount: input.riskAmount ? String(input.riskAmount) : null,
        rewardAmount: input.rewardAmount ? String(input.rewardAmount) : null,
        riskRewardRatio: input.riskRewardRatio ? String(input.riskRewardRatio) : null,
        strategy: input.strategy,
        trend: input.trend,
        timeframe: input.timeframe,
        notes: input.notes || null,
        screenshots: input.screenshots || null,
      }).returning({ id: trades.id });
      return { id: Number(result[0].id) };
    }),

  // Close a trade
  close: authedQuery
    .input(
      z.object({
        tradeId: z.number(),
        exitPrice: z.number(),
        profitLoss: z.number(),
        profitLossPercent: z.number(),
        holdingTimeMinutes: z.number().optional(),
        result: z.enum(["Win", "Loss", "Break Even"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(trades)
        .set({
          status: "Closed",
          exitPrice: String(input.exitPrice),
          profitLoss: String(input.profitLoss),
          profitLossPercent: String(input.profitLossPercent),
          holdingTimeMinutes: input.holdingTimeMinutes || null,
          result: input.result,
        })
        .where(and(eq(trades.id, input.tradeId), eq(trades.userId, ctx.user.id)));
      return { success: true };
    }),

  // Get all trades for user with filters
  list: authedQuery
    .input(
      z
        .object({
          market: z.string().optional(),
          strategy: z.string().optional(),
          result: z.string().optional(),
          session: z.string().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const conditions = [eq(trades.userId, ctx.user.id)];

      if (input) {
        if (input.market && input.market !== "all") {
          conditions.push(eq(trades.market, input.market as any));
        }
        if (input.strategy && input.strategy !== "all") {
          conditions.push(eq(trades.strategy, input.strategy as any));
        }
        if (input.result && input.result !== "all") {
          conditions.push(eq(trades.result, input.result as any));
        }
        if (input.session && input.session !== "all") {
          conditions.push(eq(trades.session, input.session as any));
        }
        if (input.startDate) {
          conditions.push(gte(trades.tradeDate, new Date(input.startDate)));
        }
        if (input.endDate) {
          conditions.push(lte(trades.tradeDate, new Date(input.endDate)));
        }
        if (input.status) {
          conditions.push(eq(trades.status, input.status as any));
        }
      }

      const result = await db
        .select()
        .from(trades)
        .where(and(...conditions))
        .orderBy(desc(trades.tradeDate));

      return result;
    }),

  // Get single trade by ID
  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const [trade] = await db
        .select()
        .from(trades)
        .where(and(eq(trades.id, input.id), eq(trades.userId, ctx.user.id)));
      return trade || null;
    }),

  // Update trade
  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        tradeDate: z.string().optional(),
        tradeTime: z.string().optional(),
        session: z.enum(["Asian", "London", "New York"]).optional(),
        market: z.enum([
          "XAUUSD",
          "EURUSD",
          "GBPUSD",
          "USDJPY",
          "NAS100",
          "US30",
          "BTCUSD",
          "ETHUSD",
          "Other",
        ]).optional(),
        direction: z.enum(["Buy", "Sell"]).optional(),
        entryPrice: z.number().optional(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
        lotSize: z.number().optional(),
        strategy: z.string().optional(),
        trend: z.enum(["Bullish", "Bearish", "Ranging"]).optional(),
        timeframe: z.enum(["1M", "5M", "15M", "1H", "4H", "Daily"]).optional(),
        notes: z.string().optional(),
        screenshots: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...updateData } = input;
      const updatePayload: any = {};
      
      if (updateData.tradeDate !== undefined) updatePayload.tradeDate = new Date(updateData.tradeDate);
      if (updateData.tradeTime !== undefined) updatePayload.tradeTime = updateData.tradeTime;
      if (updateData.session !== undefined) updatePayload.session = updateData.session;
      if (updateData.market !== undefined) updatePayload.market = updateData.market;
      if (updateData.direction !== undefined) updatePayload.direction = updateData.direction;
      if (updateData.entryPrice !== undefined) updatePayload.entryPrice = String(updateData.entryPrice);
      if (updateData.stopLoss !== undefined) updatePayload.stopLoss = updateData.stopLoss ? String(updateData.stopLoss) : null;
      if (updateData.takeProfit !== undefined) updatePayload.takeProfit = updateData.takeProfit ? String(updateData.takeProfit) : null;
      if (updateData.lotSize !== undefined) updatePayload.lotSize = String(updateData.lotSize);
      if (updateData.strategy !== undefined) updatePayload.strategy = updateData.strategy;
      if (updateData.trend !== undefined) updatePayload.trend = updateData.trend;
      if (updateData.timeframe !== undefined) updatePayload.timeframe = updateData.timeframe;
      if (updateData.notes !== undefined) updatePayload.notes = updateData.notes;
      if (updateData.screenshots !== undefined) updatePayload.screenshots = updateData.screenshots;

      await db
        .update(trades)
        .set(updatePayload)
        .where(and(eq(trades.id, id), eq(trades.userId, ctx.user.id)));
      return { success: true };
    }),

  // Delete trade
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(trades)
        .where(and(eq(trades.id, input.id), eq(trades.userId, ctx.user.id)));
      return { success: true };
    }),
});
