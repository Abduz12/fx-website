import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  decimal,
  int,
  bigint,
  date,
  time,
  boolean,
} from "drizzle-orm/mysql-core";

// Users table (already provided by auth)
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Trades table
export const trades = mysqlTable("trades", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  
  // Basic Information
  tradeDate: date("tradeDate").notNull(),
  tradeTime: time("tradeTime").notNull(),
  session: mysqlEnum("session", ["Asian", "London", "New York"]).notNull(),
  market: mysqlEnum("market", [
    "XAUUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "NAS100",
    "US30",
    "BTCUSD",
    "ETHUSD",
    "Other",
  ]).notNull(),
  direction: mysqlEnum("direction", ["Buy", "Sell"]).notNull(),
  
  // Trade Details
  entryPrice: decimal("entryPrice", { precision: 18, scale: 8 }).notNull(),
  stopLoss: decimal("stopLoss", { precision: 18, scale: 8 }),
  takeProfit: decimal("takeProfit", { precision: 18, scale: 8 }),
  lotSize: decimal("lotSize", { precision: 10, scale: 4 }).notNull(),
  riskPercent: decimal("riskPercent", { precision: 5, scale: 2 }),
  riskAmount: decimal("riskAmount", { precision: 18, scale: 2 }),
  rewardAmount: decimal("rewardAmount", { precision: 18, scale: 2 }),
  riskRewardRatio: decimal("riskRewardRatio", { precision: 5, scale: 2 }),
  
  // Strategy
  strategy: mysqlEnum("strategy", [
    "ICT Smart Money Concepts",
    "Breakout Retest",
    "Supply and Demand",
    "Trend Following",
    "Scalping",
    "News Trading",
    "Other",
  ]).notNull(),
  
  // Market Conditions
  trend: mysqlEnum("trend", ["Bullish", "Bearish", "Ranging"]).notNull(),
  timeframe: mysqlEnum("timeframe", [
    "1M",
    "5M",
    "15M",
    "1H",
    "4H",
    "Daily",
  ]).notNull(),
  
  // Outcome
  result: mysqlEnum("result", ["Win", "Loss", "Break Even"]),
  exitPrice: decimal("exitPrice", { precision: 18, scale: 8 }),
  profitLoss: decimal("profitLoss", { precision: 18, scale: 2 }),
  profitLossPercent: decimal("profitLossPercent", { precision: 8, scale: 4 }),
  
  // Status
  status: mysqlEnum("status", ["Open", "Closed"]).default("Open").notNull(),
  
  // Screenshots (stored as JSON array of URLs)
  screenshots: text("screenshots"),
  
  // Notes
  notes: text("notes"),
  
  // Holding time in minutes
  holdingTimeMinutes: int("holdingTimeMinutes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// Trade Psychology table
export const tradePsychology = mysqlTable("trade_psychology", {
  id: serial("id").primaryKey(),
  tradeId: bigint("tradeId", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  
  // Before Trade
  entryReason: text("entryReason"),
  confidenceLevel: int("confidenceLevel"), // 1-10
  emotionBefore: mysqlEnum("emotionBefore", [
    "Fear",
    "Greed",
    "Confidence",
    "Patience",
    "Revenge",
    "Neutral",
    "Excitement",
    "Anxiety",
  ]),
  
  // After Trade
  followedPlan: boolean("followedPlan"),
  mistakeMade: text("mistakeMade"),
  lessonLearned: text("lessonLearned"),
  emotionAfter: mysqlEnum("emotionAfter", [
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
  ]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TradePsychology = typeof tradePsychology.$inferSelect;
export type InsertTradePsychology = typeof tradePsychology.$inferInsert;

// Trading Rules table
export const tradingRules = mysqlTable("trading_rules", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  rule: text("rule").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  category: mysqlEnum("category", [
    "Risk Management",
    "Entry Rules",
    "Exit Rules",
    "Psychology",
    "Session",
    "General",
  ]).default("General").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TradingRule = typeof tradingRules.$inferSelect;
export type InsertTradingRule = typeof tradingRules.$inferInsert;

// Daily Checklist table
export const dailyChecklists = mysqlTable("daily_checklists", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  ruleId: bigint("ruleId", { mode: "number", unsigned: true }).notNull(),
  date: date("date").notNull(),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DailyChecklist = typeof dailyChecklists.$inferSelect;
export type InsertDailyChecklist = typeof dailyChecklists.$inferInsert;

// Journal Entries table
export const journalEntries = mysqlTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  date: date("date").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mood: mysqlEnum("mood", [
    "Excellent",
    "Good",
    "Neutral",
    "Bad",
    "Terrible",
  ]),
  tags: text("tags"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

// Trading Goals table
export const tradingGoals = mysqlTable("trading_goals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: decimal("targetValue", { precision: 18, scale: 4 }),
  currentValue: decimal("currentValue", { precision: 18, scale: 4 }).default("0"),
  goalType: mysqlEnum("goalType", [
    "Monthly Profit",
    "Win Rate",
    "Risk Reward",
    "Trade Count",
    "Discipline Score",
    "Custom",
  ]).notNull(),
  period: mysqlEnum("period", ["Daily", "Weekly", "Monthly"]).default("Monthly").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TradingGoal = typeof tradingGoals.$inferSelect;
export type InsertTradingGoal = typeof tradingGoals.$inferInsert;

// Achievements/Badges table
export const achievements = mysqlTable("achievements", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  badgeType: mysqlEnum("badgeType", [
    "First Trade",
    "10 Trades",
    "50 Trades",
    "100 Trades",
    "Win Streak 5",
    "Win Streak 10",
    "Profit Month",
    "Disciplined Trader",
    "Risk Manager",
    "Psychology Master",
  ]).notNull(),
  badgeName: varchar("badgeName", { length: 100 }).notNull(),
  badgeDescription: text("badgeDescription"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
