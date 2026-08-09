import mysql, { type RowDataPacket } from "mysql2/promise";

type VercelRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (statusCode: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: { full_name?: unknown };
};

type MealPayload = {
  recipe: { name?: unknown } & Record<string, unknown>;
  servings: unknown;
  rating?: unknown;
  notes?: unknown;
};

function send(res: VercelResponse, status: number, body: unknown) {
  res.setHeader("content-type", "application/json");
  res.status(status).json(body);
}

function authorizationToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length).trim() || null;
}

async function authenticatedSupabaseUser(req: VercelRequest): Promise<SupabaseUser | null> {
  const token = authorizationToken(req);
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!token || !url || !anonKey) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const payload = await response.json() as SupabaseUser;
  return typeof payload.id === "string" ? payload : null;
}

function validatePayload(value: unknown): { recipe: Record<string, unknown>; recipeName: string; servings: number; rating: number | null; notes: string } | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as MealPayload;
  if (!payload.recipe || typeof payload.recipe !== "object" || typeof payload.recipe.name !== "string" || !payload.recipe.name.trim()) return null;
  if (!Number.isInteger(payload.servings) || (payload.servings as number) < 1 || (payload.servings as number) > 12) return null;
  const rating = payload.rating === undefined || payload.rating === null ? null : payload.rating;
  if (rating !== null && (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5)) return null;
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";
  if (notes.length > 1_000) return null;
  return { recipe: payload.recipe, recipeName: payload.recipe.name.trim(), servings: payload.servings as number, rating: rating as number | null, notes };
}

function recipeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 180);
}

async function databaseUserId(connection: mysql.Connection, user: SupabaseUser): Promise<number> {
  const openId = `supabase:${user.id}`;
  const name = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  await connection.execute(
    "INSERT INTO users (openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES (?, ?, ?, 'supabase', 'user', NOW(), NOW(), NOW()) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), loginMethod = 'supabase', lastSignedIn = NOW()",
    [openId, name, user.email ?? null],
  );
  const [rows] = await connection.execute<RowDataPacket[]>("SELECT id FROM users WHERE openId = ? LIMIT 1", [openId]);
  if (!rows[0]?.id) throw new Error("Account could not be resolved.");
  return Number(rows[0].id);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticatedSupabaseUser(req);
    if (!user) return send(res, 401, { error: { message: "Please sign in to access meal history." } });

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return send(res, 503, { error: { message: "Meal history is not configured for this deployment yet." } });
    const connection = await mysql.createConnection(databaseUrl);
    try {
      const userId = await databaseUserId(connection, user);

      if (req.method === "GET") {
        const [rows] = await connection.execute<RowDataPacket[]>(
          "SELECT id, recipeId, recipeName, recipeData, servings, rating, notes, UNIX_TIMESTAMP(cookedAt) * 1000 AS cookedAt FROM meal_logs WHERE userId = ? ORDER BY cookedAt DESC",
          [userId],
        );
        const meals = rows.map((row) => ({
          id: Number(row.id),
          recipeId: String(row.recipeId),
          recipeName: String(row.recipeName),
          recipe: JSON.parse(String(row.recipeData)),
          servings: Number(row.servings),
          rating: row.rating === null ? null : Number(row.rating),
          notes: row.notes ?? "",
          cookedAt: Number(row.cookedAt),
        }));
        return send(res, 200, { meals });
      }

      if (req.method === "POST") {
        const payload = validatePayload(req.body);
        if (!payload) return send(res, 400, { error: { message: "Invalid meal log payload." } });
        const id = recipeId(payload.recipeName);
        const [result] = await connection.execute<mysql.ResultSetHeader>(
          "INSERT INTO meal_logs (userId, recipeId, recipeName, recipeData, servings, rating, notes, cookedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())",
          [userId, id, payload.recipeName, JSON.stringify(payload.recipe), payload.servings, payload.rating, payload.notes || null],
        );
        return send(res, 201, { meal: { id: Number(result.insertId), recipeId: id, recipeName: payload.recipeName, servings: payload.servings, rating: payload.rating, notes: payload.notes, cookedAt: Date.now() } });
      }

      res.setHeader("allow", "GET, POST");
      return send(res, 405, { error: { message: "Method not allowed." } });
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error("[Vercel meals] Failed", error);
    return send(res, 500, { error: { message: "We could not process meal history right now." } });
  }
}
