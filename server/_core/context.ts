import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function bearerToken(req: CreateExpressContextOptions["req"]): string | null {
  const value = req.headers.authorization;
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length).trim() || null;
}

async function authenticateSupabaseBearer(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  const token = bearerToken(req);
  if (!token || !ENV.supabaseUrl || !ENV.supabaseAnonKey) return null;

  const supabase = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const openId = `supabase:${data.user.id}`;
  await upsertUser({
    openId,
    name: typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null,
    email: data.user.email ?? null,
    loginMethod: "supabase",
    lastSignedIn: new Date(),
  });
  return (await getUserByOpenId(openId)) ?? null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  if (!user) {
    try {
      user = await authenticateSupabaseBearer(opts.req);
    } catch (error) {
      console.warn("[Supabase auth] Could not verify bearer token", error);
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
