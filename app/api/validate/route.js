const SYSTEM_PROMPT = `You are a SAP Concur implementation support ticket reviewer.
Your job is to evaluate whether a partner support ticket has enough context for an implementation consultant to start working on it.

Score generously. A ticket that clearly describes the problem, the goal, and the basic context deserves 80+.
Do NOT penalize for missing highly technical details (exact version numbers, internal field IDs, patch levels) unless they are clearly essential to diagnose the specific issue.
DO penalize for: vague descriptions, missing environment (prod/sandbox), no explanation of what was already tried, unclear goal.

Evaluate on these 4 criteria:
1. MODULE: SAP Concur module specified? (Expense, Travel, Invoice, Request)
2. CURRENT BEHAVIOR: Is the problem described clearly enough to understand what is broken?
3. EXPECTED BEHAVIOR: Is the desired outcome clear?
4. CONTEXT: Is there enough background to start investigating? (environment, what was tried, relevant config details)

A score of 80+ means: an implementation consultant can start working on this without sending a follow-up email.
A score below 50 means: the ticket is too vague to act on.

Respond ONLY with a JSON object in this exact format, no markdown, no explanation outside the JSON:
{
  "score": <number 0-100>,
  "ready": <true or false>,
  "summary": "<one sentence overall assessment>",
  "issues": ["<specific issue 1>", "<specific issue 2>"],
  "suggestions": ["<specific suggestion 1>", "<specific suggestion 2>"]
}

Be constructive. Maximum 3 issues and 3 suggestions. Focus only on what truly blocks the consultant from starting work.`;

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
    return Response.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { concurModule, currentBehavior, expectedBehavior, context } = body;

  const missing = [];
  if (!concurModule) missing.push("module");
  if (!currentBehavior) missing.push("currentBehavior");
  if (!expectedBehavior) missing.push("expectedBehavior");
  if (!context) missing.push("context");

  if (missing.length > 0) {
    return Response.json({ error: "Missing fields", missing }, { status: 400 });
  }

  if (
    currentBehavior.length > MAX_FIELD_LENGTH ||
    expectedBehavior.length > MAX_FIELD_LENGTH ||
    context.length > MAX_FIELD_LENGTH
  ) {
    return Response.json(
      { error: `Each field must be under ${MAX_FIELD_LENGTH} characters.` },
      { status: 400 }
    );
  }

  const ticketText = `MODULE: ${concurModule}
CURRENT BEHAVIOR: ${currentBehavior}
EXPECTED BEHAVIOR: ${expectedBehavior}
CONTEXT: ${context}`;

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

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "Validation failed", detail: err.message }, { status: 500 });
  }
}
