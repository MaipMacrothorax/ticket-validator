import { neon } from "@neondatabase/serverless";

export async function GET(request) {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS validations (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      partner_name TEXT,
      module TEXT,
      environment TEXT,
      urgency TEXT,
      checks TEXT[],
      score INTEGER,
      ready BOOLEAN
    )
  `;

  return Response.json({ ok: true, message: "Table created" });
}
