import { neon } from "@neondatabase/serverless";

const SYSTEM_PROMPT = `You are a SAP Concur implementation support ticket reviewer.
Evaluate whether a partner support ticket has enough context for an implementation consultant to start working on it.

Scoring rules:
- A ticket that clearly describes the problem and the expected result deserves 60+
- If the partner confirmed "Already tested in sandbox" or "Issue reproducible consistently", add 10 points
- If both are confirmed, add 15 points total
- Do NOT penalize for missing technical details unless essential to diagnose the issue
- DO penalize for: vague descriptions with no specifics, missing expected result, unclear what is broken

A score of 60+ means: ready to submit.
A score below 40 means: too vague to act on.

Respond ONLY with a JSON object, no markdown:
{
  "score": <number 0-100>,
  "ready": <true or false>,
  "summary": "<one sentence overall assessment>",
  "issues": ["<issue 1>", "<issue 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}

Maximum 3 issues and 3 suggestions. Focus only on what truly blocks the consultant from starting work.`;

const rateLimit = new Map();
const LIMIT = 10;
const WINDOW = 60 * 60 * 1000;
const MAX_FIELD_LENGTH = 2000;

function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now - entry.start > WINDOW) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return Response.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: "API key not configured" }, { status: 500 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }

  const { partnerName, concurModule, environment, urgency, checks, issue, expectedResult } = body;

  if (!concurModule || !environment || !urgency || !issue || !expectedResult) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  if (issue.length > MAX_FIELD_LENGTH || expectedResult.length > MAX_FIELD_LENGTH) {
    return Response.json({ error: `Fields must be under ${MAX_FIELD_LENGTH} characters.` }, { status: 400 });
  }

  const checksText = checks?.length > 0 ? `\nCHECKS CONFIRMED BY PARTNER: ${checks.join(", ")}` : "";

  const ticketText = `PARTNER: ${partnerName || "Not specified"}
MODULE: ${concurModule}
ENVIRONMENT: ${environment}
URGENCY: ${urgency}${checksText}
ISSUE: ${issue}
EXPECTED RESULT: ${expectedResult}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Review this support ticket:\n\n${ticketText}` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: "Anthropic API error", detail: err }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    // Log to database (non-blocking)
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
          INSERT INTO validations (partner_name, module, environment, urgency, checks, score, ready)
          VALUES (
            ${partnerName || "Unknown"},
            ${concurModule},
            ${environment},
            ${urgency},
            ${checks || []},
            ${parsed.score},
            ${parsed.ready}
          )
        `;
      } catch (dbErr) {
        console.error("DB log failed:", dbErr.message);
      }
    }

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "Validation failed", detail: err.message }, { status: 500 });
  }
}
