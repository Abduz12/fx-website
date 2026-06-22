import { z } from "zod";
import { eq, and, desc, sql, gte, asc } from "drizzle-orm";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { trades, accounts } from "@db/schema";
import { generateTradingSuggestions } from "./lib/ai";

export const analyticsRouter = createRouter({
  // Dashboard KPIs
  getDashboardStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();

    // Get active account
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
      
    const activeAccount = userAccounts[0];
    const initialBalance = activeAccount ? Number(activeAccount.initialBalance) : Number(ctx.user.initialBalance || 0);

    let conditions = [eq(trades.userId, ctx.user.id)];
    if (activeAccount) {
      // Find the user's oldest account to assign the older NULL trades to it
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const allTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions));

    const closedTrades = allTrades.filter((t) => t.status === "Closed");
    const winningTrades = closedTrades.filter((t) => t.result === "Win");
    const losingTrades = closedTrades.filter((t) => t.result === "Loss");
    const breakEvenTrades = closedTrades.filter((t) => t.result === "Break Even");

    const totalTrades = closedTrades.length;
    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;

    const totalProfit = winningTrades.reduce(
      (sum, t) => sum + Number(t.profitLoss || 0),
      0
    );
    const totalLoss = losingTrades.reduce(
      (sum, t) => sum + Math.abs(Number(t.profitLoss || 0)),
      0
    );

    const netPnL = totalProfit - totalLoss;
    const currentBalance = initialBalance + netPnL;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

    // Average Risk Reward Ratio
    const tradesWithRR = closedTrades.filter((t) => t.riskRewardRatio);
    const avgRR =
      tradesWithRR.length > 0
        ? tradesWithRR.reduce((sum, t) => sum + Number(t.riskRewardRatio), 0) /
          tradesWithRR.length
        : 0;

    // Profit factor
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Best and worst trading day
    const tradesByDate: Record<string, number> = {};
    closedTrades.forEach((t) => {
      const date = String(t.tradeDate);
      tradesByDate[date] = (tradesByDate[date] || 0) + Number(t.profitLoss || 0);
    });

    let bestDay = { date: "", profit: -Infinity };
    let worstDay = { date: "", profit: Infinity };
    Object.entries(tradesByDate).forEach(([date, profit]) => {
      if (profit > bestDay.profit) bestDay = { date, profit };
      if (profit < worstDay.profit) worstDay = { date, profit };
    });

    // Average win and average loss
    const avgWin = winCount > 0 ? totalProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;

    // Max drawdown (simplified)
    let maxDrawdown = 0;
    let peak = 0;
    let runningTotal = 0;
    closedTrades
      .sort((a, b) => {
        const dateA = new Date(String(a.tradeDate)).getTime();
        const dateB = new Date(String(b.tradeDate)).getTime();
        return dateA - dateB;
      })
      .forEach((t) => {
        runningTotal += Number(t.profitLoss || 0);
        if (runningTotal > peak) peak = runningTotal;
        const drawdown = peak - runningTotal;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

    // Current streak
    let currentStreak = 0;
    const sortedTrades = [...closedTrades].sort((a, b) => {
      const dateA = new Date(String(b.tradeDate)).getTime();
      const dateB = new Date(String(a.tradeDate)).getTime();
      return dateA - dateB;
    });
    for (const trade of sortedTrades) {
      if (trade.result === "Win") {
        if (currentStreak >= 0) currentStreak++;
        else break;
      } else if (trade.result === "Loss") {
        if (currentStreak <= 0) currentStreak--;
        else break;
      }
    }

    return {
      totalTrades,
      winCount,
      lossCount,
      breakEvenCount: breakEvenTrades.length,
      winRate: Math.round(winRate * 100) / 100,
      netPnL: Math.round(netPnL * 100) / 100,
      initialBalance: Math.round(initialBalance * 100) / 100,
      currentBalance: Math.round(currentBalance * 100) / 100,
      avgRiskReward: Math.round(avgRR * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      bestDay: bestDay.date ? bestDay : null,
      worstDay: worstDay.date ? worstDay : null,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      currentStreak,
      openTrades: allTrades.filter((t) => t.status === "Open").length,
    };
  }),

  // Equity curve data
  getEquityCurve: authedQuery
    .input(z.object({ period: z.string().optional() }).optional())
    .query(async ({ ctx }) => {
      const db = getDb();
      
      const userAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
        .limit(1);
      const activeAccount = userAccounts[0];
      const initialBalance = activeAccount ? Number(activeAccount.initialBalance) : Number(ctx.user.initialBalance || 0);
      
      let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
      if (activeAccount) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      }

      const closedTrades = await db
        .select()
        .from(trades)
        .where(and(...conditions))
        .orderBy(trades.tradeDate);

      let runningBalance = initialBalance;
      const equityCurve = closedTrades.map((trade) => {
        runningBalance += Number(trade.profitLoss || 0);
        return {
          date: String(trade.tradeDate),
          balance: Math.round(runningBalance * 100) / 100,
          profit: Number(trade.profitLoss || 0),
        };
      });

      return equityCurve;
    }),

  // Performance by strategy
  getPerformanceByStrategy: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
    const activeAccount = userAccounts[0];

    let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
    if (activeAccount) {
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions));

    const strategyStats: Record<
      string,
      { trades: number; wins: number; losses: number; pnl: number }
    > = {};

    closedTrades.forEach((t) => {
      const strat = t.strategy;
      if (!strategyStats[strat]) {
        strategyStats[strat] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
      }
      strategyStats[strat].trades++;
      if (t.result === "Win") strategyStats[strat].wins++;
      if (t.result === "Loss") strategyStats[strat].losses++;
      strategyStats[strat].pnl += Number(t.profitLoss || 0);
    });

    return Object.entries(strategyStats).map(([name, stats]) => ({
      name,
      ...stats,
      winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 10000) / 100 : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
  }),

  // Performance by market
  getPerformanceByMarket: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
    const activeAccount = userAccounts[0];

    let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
    if (activeAccount) {
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions));

    const marketStats: Record<
      string,
      { trades: number; wins: number; losses: number; pnl: number }
    > = {};

    closedTrades.forEach((t) => {
      const market = t.market;
      if (!marketStats[market]) {
        marketStats[market] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
      }
      marketStats[market].trades++;
      if (t.result === "Win") marketStats[market].wins++;
      if (t.result === "Loss") marketStats[market].losses++;
      marketStats[market].pnl += Number(t.profitLoss || 0);
    });

    return Object.entries(marketStats).map(([name, stats]) => ({
      name,
      ...stats,
      winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 10000) / 100 : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
  }),

  // Performance by session
  getPerformanceBySession: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
    const activeAccount = userAccounts[0];

    let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
    if (activeAccount) {
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions));

    const sessionStats: Record<
      string,
      { trades: number; wins: number; losses: number; pnl: number }
    > = {};

    closedTrades.forEach((t) => {
      const session = t.session;
      if (!sessionStats[session]) {
        sessionStats[session] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
      }
      sessionStats[session].trades++;
      if (t.result === "Win") sessionStats[session].wins++;
      if (t.result === "Loss") sessionStats[session].losses++;
      sessionStats[session].pnl += Number(t.profitLoss || 0);
    });

    return Object.entries(sessionStats).map(([name, stats]) => ({
      name,
      ...stats,
      winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 10000) / 100 : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
  }),

  // Performance by day of week
  getPerformanceByDayOfWeek: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
    const activeAccount = userAccounts[0];

    let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
    if (activeAccount) {
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions));

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayStats: Record<string, { trades: number; wins: number; pnl: number }> = {};

    closedTrades.forEach((t) => {
      const day = dayNames[new Date(String(t.tradeDate)).getDay()];
      if (!dayStats[day]) {
        dayStats[day] = { trades: 0, wins: 0, pnl: 0 };
      }
      dayStats[day].trades++;
      if (t.result === "Win") dayStats[day].wins++;
      dayStats[day].pnl += Number(t.profitLoss || 0);
    });

    return Object.entries(dayStats).map(([name, stats]) => ({
      name,
      ...stats,
      winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 10000) / 100 : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
  }),

  // Calendar data
  getCalendarData: authedQuery
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const startDate = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const endDate = `${input.year}-${String(input.month).padStart(2, "0")}-31`;

      const userAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
        .limit(1);
      const activeAccount = userAccounts[0];

      let conditions = [
        eq(trades.userId, ctx.user.id),
        eq(trades.status, "Closed"),
        gte(trades.tradeDate, new Date(startDate)),
        sql`${trades.tradeDate} <= ${endDate}`
      ];

      if (activeAccount) {
        const mainAccount = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, ctx.user.id))
          .orderBy(asc(accounts.createdAt))
          .limit(1);
          
        if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
          conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
        } else {
          conditions.push(eq(trades.accountId, activeAccount.id));
        }
      }

      const closedTrades = await db
        .select()
        .from(trades)
        .where(and(...conditions));

      const dailyPnL: Record<string, number> = {};
      closedTrades.forEach((t) => {
        // Correctly parse JS Date object to YYYY-MM-DD
        const d = new Date(t.tradeDate as any);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        dailyPnL[date] = (dailyPnL[date] || 0) + Number(t.profitLoss || 0);
      });

      return Object.entries(dailyPnL).map(([date, pnl]) => ({
        date,
        pnl: Math.round(pnl * 100) / 100,
        status: pnl > 0 ? "profit" : pnl < 0 ? "loss" : "neutral",
      }));
    }),

  // Monthly performance
  getMonthlyPerformance: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, ctx.user.id), eq(accounts.isDefault, true)))
      .limit(1);
    const activeAccount = userAccounts[0];

    let conditions = [eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")];
    if (activeAccount) {
      const mainAccount = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, ctx.user.id))
        .orderBy(asc(accounts.createdAt))
        .limit(1);
        
      if (mainAccount[0] && activeAccount.id === mainAccount[0].id) {
        conditions.push(sql`(${trades.accountId} = ${activeAccount.id} OR ${trades.accountId} IS NULL)`);
      } else {
        conditions.push(eq(trades.accountId, activeAccount.id));
      }
    }

    const closedTrades = await db
      .select()
      .from(trades)
      .where(and(...conditions))
      .orderBy(trades.tradeDate);

    const monthlyStats: Record<string, { trades: number; wins: number; pnl: number }> = {};

    closedTrades.forEach((t) => {
      const date = new Date(String(t.tradeDate));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { trades: 0, wins: 0, pnl: 0 };
      }
      monthlyStats[monthKey].trades++;
      if (t.result === "Win") monthlyStats[monthKey].wins++;
      monthlyStats[monthKey].pnl += Number(t.profitLoss || 0);
    });

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      ...stats,
      winRate: stats.trades > 0 ? Math.round((stats.wins / stats.trades) * 10000) / 100 : 0,
      pnl: Math.round(stats.pnl * 100) / 100,
    }));
  }),

  // AI Analysis - common mistakes and patterns
  getAIAnalysis: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const last20Trades = await db
      .select()
      .from(trades)
      .where(and(eq(trades.userId, ctx.user.id), eq(trades.status, "Closed")))
      .orderBy(desc(trades.tradeDate))
      .limit(20);

    if (last20Trades.length < 5) {
      return {
        ready: false,
        message: `You need at least 5 closed trades for AI analysis. You currently have ${last20Trades.length}.`,
      };
    }

    // Analyze most profitable strategy
    const strategyPnL: Record<string, { pnl: number; count: number }> = {};
    last20Trades.forEach((t) => {
      if (!strategyPnL[t.strategy]) strategyPnL[t.strategy] = { pnl: 0, count: 0 };
      strategyPnL[t.strategy].pnl += Number(t.profitLoss || 0);
      strategyPnL[t.strategy].count++;
    });

    let bestStrategy = "";
    let bestStratPnL = -Infinity;
    Object.entries(strategyPnL).forEach(([strat, data]) => {
      if (data.pnl > bestStratPnL) {
        bestStratPnL = data.pnl;
        bestStrategy = strat;
      }
    });

    // Analyze most profitable market
    const marketPnL: Record<string, { pnl: number; count: number }> = {};
    last20Trades.forEach((t) => {
      if (!marketPnL[t.market]) marketPnL[t.market] = { pnl: 0, count: 0 };
      marketPnL[t.market].pnl += Number(t.profitLoss || 0);
      marketPnL[t.market].count++;
    });

    let bestMarket = "";
    let bestMarketPnL = -Infinity;
    Object.entries(marketPnL).forEach(([market, data]) => {
      if (data.pnl > bestMarketPnL) {
        bestMarketPnL = data.pnl;
        bestMarket = market;
      }
    });

    // Analyze session performance
    const sessionPnL: Record<string, { pnl: number; count: number }> = {};
    last20Trades.forEach((t) => {
      if (!sessionPnL[t.session]) sessionPnL[t.session] = { pnl: 0, count: 0 };
      sessionPnL[t.session].pnl += Number(t.profitLoss || 0);
      sessionPnL[t.session].count++;
    });

    let bestSession = "";
    let bestSessionPnL = -Infinity;
    Object.entries(sessionPnL).forEach(([session, data]) => {
      if (data.pnl > bestSessionPnL) {
        bestSessionPnL = data.pnl;
        bestSession = session;
      }
    });

    // Check for consecutive losses
    let maxConsecutiveLosses = 0;
    let currentConsecutiveLosses = 0;
    [...last20Trades].reverse().forEach((t) => {
      if (t.result === "Loss") {
        currentConsecutiveLosses++;
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses;
        }
      } else {
        currentConsecutiveLosses = 0;
      }
    });

    // Recent win rate
    const recentWins = last20Trades.filter((t) => t.result === "Win").length;
    const recentWinRate = (recentWins / last20Trades.length) * 100;

    const statsObj = {
      bestStrategy,
      bestStrategyPnL: Math.round(bestStratPnL * 100) / 100,
      bestMarket,
      bestMarketPnL: Math.round(bestMarketPnL * 100) / 100,
      bestSession,
      bestSessionPnL: Math.round(bestSessionPnL * 100) / 100,
      maxConsecutiveLosses,
      recentWinRate: Math.round(recentWinRate * 100) / 100,
    };

    const suggestions = await generateTradingSuggestions(statsObj, last20Trades);

    return {
      ready: true,
      tradeCount: last20Trades.length,
      ...statsObj,
      suggestions,
    };
  }),
});
