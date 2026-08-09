import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateRequest, getUser, upsertUser, getUserByOpenId } = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getUser: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));
vi.mock("../server/db", () => ({ upsertUser, getUserByOpenId }));
vi.mock("./_core/env", () => ({ ENV: { supabaseUrl: "https://example.supabase.co", supabaseAnonKey: "anon-key" } }));

import { createContext } from "./_core/context";

describe("Supabase bearer tRPC context", () => {
  beforeEach(() => vi.resetAllMocks());

  it("maps a verified Supabase bearer identity into the protected internal user", async () => {
    authenticateRequest.mockRejectedValue(new Error("No Manus session"));
    getUser.mockResolvedValue({ data: { user: { id: "supabase-user-id", email: "cook@example.com", user_metadata: { full_name: "Mise Cook" } } }, error: null });
    getUserByOpenId.mockResolvedValue({ id: 77, openId: "supabase:supabase-user-id", role: "user" });

    const context = await createContext({ req: { headers: { authorization: "Bearer verified-supabase-token" } }, res: {} } as never);

    expect(getUser).toHaveBeenCalledWith("verified-supabase-token");
    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "supabase:supabase-user-id", email: "cook@example.com", loginMethod: "supabase" }));
    expect(context.user).toMatchObject({ id: 77, openId: "supabase:supabase-user-id" });
  });

  it("keeps unauthenticated requests public when there is no bearer token", async () => {
    authenticateRequest.mockRejectedValue(new Error("No Manus session"));
    const context = await createContext({ req: { headers: {} }, res: {} } as never);
    expect(context.user).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
