import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  bigint,
  date,
  time,
  boolean,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const sessionEnum = pgEnum("session", ["Asian", "London", "New York"]);
export const marketEnum = pgEnum("market", [
  "XAUUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "NAS100",
  "US30",
  "BTCUSD",
  "ETHUSD",
  "Other",
]);
export const directionEnum = pgEnum("direction", ["Buy", "Sell"]);
export const strategyEnum = pgEnum("strategy", [
  "ICT Smart Money Concepts",
  "Breakout Retest",
  "Supply and Demand",
  "Trend Following",
  "Scalping",
  "News Trading",
  "Other",
]);
export const trendEnum = pgEnum("trend", ["Bullish", "Bearish", "Ranging"]);
export const timeframeEnum = pgEnum("timeframe", [
  "1M",
  "5M",
  "15M",
  "1H",
  "4H",
  "Daily",
]);
export const resultEnum = pgEnum("result", ["Win", "Loss", "Break Even"]);
export const statusEnum = pgEnum("status", ["Open", "Closed"]);
export const emotionEnum = pgEnum("emotion", [
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
]);
export const ruleCategoryEnum = pgEnum("category", [
  "Risk Management",
  "Entry Rules",
  "Exit Rules",
  "Psychology",
  "Session",
  "General",
]);
export const moodEnum = pgEnum("mood", [
  "Excellent",
  "Good",
  "Neutral",
  "Bad",
  "Terrible",
]);
export const goalTypeEnum = pgEnum("goalType", [
  "Monthly Profit",
  "Win Rate",
  "Risk Reward",
  "Trade Count",
  "Discipline Score",
  "Custom",
]);
export const periodEnum = pgEnum("period", ["Daily", "Weekly", "Monthly"]);
export const badgeTypeEnum = pgEnum("badgeType", [
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
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  avatar: text("avatar"),
  initialBalance: numeric("initialBalance", { precision: 18, scale: 2 }).default("0").notNull(),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Accounts table
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  initialBalance: numeric("initialBalance", { precision: 18, scale: 2 }).default("0").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// Trades table
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  accountId: bigint("accountId", { mode: "number" }),
  
  // Basic Information
  tradeDate: date("tradeDate").notNull(),
  tradeTime: time("tradeTime").notNull(),
  session: sessionEnum("session").notNull(),
  market: marketEnum("market").notNull(),
  direction: directionEnum("direction").notNull(),
  
  // Trade Details
  entryPrice: numeric("entryPrice", { precision: 18, scale: 8 }).notNull(),
  stopLoss: numeric("stopLoss", { precision: 18, scale: 8 }),
  takeProfit: numeric("takeProfit", { precision: 18, scale: 8 }),
  lotSize: numeric("lotSize", { precision: 10, scale: 4 }).notNull(),
  riskPercent: numeric("riskPercent", { precision: 5, scale: 2 }),
  riskAmount: numeric("riskAmount", { precision: 18, scale: 2 }),
  rewardAmount: numeric("rewardAmount", { precision: 18, scale: 2 }),
  riskRewardRatio: numeric("riskRewardRatio", { precision: 5, scale: 2 }),
  
  // Strategy
  strategy: strategyEnum("strategy").notNull(),
  
  // Market Conditions
  trend: trendEnum("trend").notNull(),
  timeframe: timeframeEnum("timeframe").notNull(),
  
  // Outcome
  result: resultEnum("result"),
  exitPrice: numeric("exitPrice", { precision: 18, scale: 8 }),
  profitLoss: numeric("profitLoss", { precision: 18, scale: 2 }),
  profitLossPercent: numeric("profitLossPercent", { precision: 8, scale: 4 }),
  
  // Status
  status: statusEnum("status").default("Open").notNull(),
  
  // Screenshots (stored as JSON array of URLs)
  screenshots: text("screenshots"),
  
  // Notes
  notes: text("notes"),
  
  // Holding time in minutes
  holdingTimeMinutes: integer("holdingTimeMinutes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

// Trade Psychology table
export const tradePsychology = pgTable("trade_psychology", {
  id: serial("id").primaryKey(),
  tradeId: bigint("tradeId", { mode: "number" }).notNull(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  
  // Before Trade
  entryReason: text("entryReason"),
  confidenceLevel: integer("confidenceLevel"), // 1-10
  emotionBefore: emotionEnum("emotionBefore"),
  
  // After Trade
  followedPlan: boolean("followedPlan"),
  mistakeMade: text("mistakeMade"),
  lessonLearned: text("lessonLearned"),
  emotionAfter: emotionEnum("emotionAfter"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TradePsychology = typeof tradePsychology.$inferSelect;
export type InsertTradePsychology = typeof tradePsychology.$inferInsert;

// Trading Rules table
export const tradingRules = pgTable("trading_rules", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  rule: text("rule").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  category: ruleCategoryEnum("category").default("General").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type TradingRule = typeof tradingRules.$inferSelect;
export type InsertTradingRule = typeof tradingRules.$inferInsert;

// Daily Checklist table
export const dailyChecklists = pgTable("daily_checklists", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  ruleId: bigint("ruleId", { mode: "number" }).notNull(),
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
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  date: date("date").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  mood: moodEnum("mood"),
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
export const tradingGoals = pgTable("trading_goals", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetValue: numeric("targetValue", { precision: 18, scale: 4 }),
  currentValue: numeric("currentValue", { precision: 18, scale: 4 }).default("0"),
  goalType: goalTypeEnum("goalType").notNull(),
  period: periodEnum("period").default("Monthly").notNull(),
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
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  badgeType: badgeTypeEnum("badgeType").notNull(),
  badgeName: varchar("badgeName", { length: 100 }).notNull(),
  badgeDescription: text("badgeDescription"),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;
