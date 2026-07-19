export const APP_ROUTES = {
  capture: "/",
  login: "/login",
  signup: "/signup",
  authCallback: "/auth/callback",
  results: "/recipes",
  recipeDetail: "/recipes/:recipeId",
  cooking: "/recipes/:recipeId/cook",
  history: "/history",
} as const;

export const ROUTE_DEFINITIONS = [
  { id: "capture", path: APP_ROUTES.capture, label: "Capture" },
  { id: "login", path: APP_ROUTES.login, label: "Log in" },
  { id: "signup", path: APP_ROUTES.signup, label: "Sign up" },
  { id: "auth-callback", path: APP_ROUTES.authCallback, label: "Authentication callback" },
  { id: "results", path: APP_ROUTES.results, label: "Recipe results" },
  { id: "recipe-detail", path: APP_ROUTES.recipeDetail, label: "Recipe detail" },
  { id: "cooking", path: APP_ROUTES.cooking, label: "Cooking mode" },
  { id: "history", path: APP_ROUTES.history, label: "Meal history" },
] as const;

export function recipeDetailPath(recipeId: string) {
  return `/recipes/${encodeURIComponent(recipeId)}`;
}

export function cookingPath(recipeId: string) {
  return `${recipeDetailPath(recipeId)}/cook`;
}
