import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifySessionToken } from "./lib/session";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const cookieHeader = opts.req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = cookie.parse(cookieHeader);
      const token = cookies[Session.cookieName];
      if (token) {
        const payload = await verifySessionToken(token);
        if (payload?.userId) {
          const db = getDb();
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.id, payload.userId))
            .limit(1);
            
          if (userResult.length > 0) {
            ctx.user = userResult[0];
          }
        }
      }
    }
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
