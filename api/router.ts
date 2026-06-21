import { authRouter } from "./auth-router";
import { tradeRouter } from "./trade-router";
import { psychologyRouter } from "./psychology-router";
import { rulesRouter } from "./rules-router";
import { journalRouter } from "./journal-router";
import { analyticsRouter } from "./analytics-router";
import { goalsRouter } from "./goals-router";
import { adminRouter } from "./admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  trade: tradeRouter,
  psychology: psychologyRouter,
  rules: rulesRouter,
  journal: journalRouter,
  analytics: analyticsRouter,
  goals: goalsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
