import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";
import { ENV } from "./env";
import { getUserByOpenId } from "../db";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const payload = jwt.verify(token, ENV.cookieSecret) as { openId: string };
      if (payload?.openId) {
        const dbUser = await getUserByOpenId(payload.openId);
        if (dbUser) user = dbUser;
      }
    }
  } catch {
    // Invalid/expired token — treat as unauthenticated
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
