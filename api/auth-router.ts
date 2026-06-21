import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { signSessionToken } from "./lib/session";
import { TRPCError } from "@trpc/server";

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  
  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
        
      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }
      
      const hashedPassword = await bcrypt.hash(input.password, 10);
      
      await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        name: input.name,
      });
      
      return { success: true };
    }),
    
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);
        
      if (userResult.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      
      const user = userResult[0];
      const isPasswordValid = await bcrypt.compare(input.password, user.password);
      
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      
      const token = await signSessionToken({ userId: user.id });
      const opts = getSessionCookieOptions(ctx.req.headers);
      
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, opts)
      );
      
      return { success: true };
    }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});
