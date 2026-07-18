import { APP_ROUTES } from "@/routes";

export function resolveAuthNextPath(candidate: string | null | undefined): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return APP_ROUTES.capture;
  }

  if (candidate.startsWith(APP_ROUTES.login) || candidate.startsWith(APP_ROUTES.signup) || candidate.startsWith("/auth/callback")) {
    return APP_ROUTES.capture;
  }

  return candidate;
}

export function authRouteWithNext(route: string, next: string): string {
  const target = resolveAuthNextPath(next);
  return `${route}?next=${encodeURIComponent(target)}`;
}

export function authCallbackUrl(origin: string, next: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", resolveAuthNextPath(next));
  return callback.toString();
}
