import { neon } from "@neondatabase/serverless";

export async function GET(request) {
  const adminKey = request.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  const [rows, stats, weekCount] = await Promise.all([
    sql`SELECT * FROM validations ORDER BY created_at DESC LIMIT 50`,
    sql`SELECT COUNT(*) as total, ROUND(AVG(score)) as avg_score, ROUND(100.0 * SUM(CASE WHEN ready THEN 1 ELSE 0 END) / COUNT(*)) as ready_pct FROM validations`,
    sql`SELECT COUNT(*) as count FROM validations WHERE created_at > NOW() - INTERVAL '7 days'`,
  ]);

  return Response.json({
    rows,
    total: Number(stats[0].total),
    avgScore: Number(stats[0].avg_score) || 0,
    readyPct: Number(stats[0].ready_pct) || 0,
    thisWeek: Number(weekCount[0].count),
  });
}
