export type AuthAccessDecision = "content" | "configuration" | "loading" | "redirect";

type AuthAccessInput = {
  configured: boolean;
  loading: boolean;
  authenticated: boolean;
  allowGuest: boolean;
};

export function resolveAuthAccess({ configured, loading, authenticated, allowGuest }: AuthAccessInput): AuthAccessDecision {
  if (allowGuest) return "content";
  if (!configured) return "configuration";
  if (loading) return "loading";
  return authenticated ? "content" : "redirect";
}
