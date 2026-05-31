# SAP Concur Ticket Validator

AI-powered pre-submission validator for SAP Concur partner support tickets. Partners fill a structured form, get an AI completeness score, and copy a formatted ticket directly to Salesforce — reducing back-and-forth with implementation consultants.

## The problem

Partner tickets submitted to SAP Concur implementation teams often lack critical context: wrong environment, vague issue descriptions, no expected outcome. This creates unnecessary round trips that delay resolution.

## The solution

A lightweight web app partners use before opening a ticket on Salesforce. The AI scores completeness (0–100) and tells the partner exactly what's missing before they submit.

## Features

- Module selector (Expense, Travel, Invoice, Request)
- Environment toggle (Sandbox / Production)
- Urgency selector (Low / Medium / High)
- Quick checks (tested in sandbox, reproducible, after config change, users notified)
- AI completeness score with specific feedback
- Formatted ticket output ready to copy into Salesforce
- Admin dashboard with score trend over time and module breakdown
- Logging to Neon (Postgres) database
- Rate limiting (10 requests/hour per IP)

## Tech stack

- Next.js 16 (App Router)
- Anthropic Claude API (claude-haiku-4-5)
- Neon serverless Postgres
- Vercel (hosting + environment variables)

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ticket-validator.git
git push -u origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Vercel auto-detects Next.js — click Deploy

### 3. Add environment variables
In Vercel dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `DATABASE_URL` | Auto-added when you connect Neon from Vercel Storage |
| `ADMIN_PASSWORD` | Any password you choose for the /admin dashboard |

### 4. Create the database table
After deploying, run once:
```bash
curl -H "x-admin-key: YOUR_ADMIN_PASSWORD" https://your-app.vercel.app/api/setup-db
```

### 5. Done
- App: `your-app.vercel.app`
- Admin dashboard: `your-app.vercel.app/admin`

## Local development
```bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY, DATABASE_URL, ADMIN_PASSWORD
npm run dev
```
