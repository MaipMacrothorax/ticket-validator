# SAP Concur Ticket Validator

Partner pre-submission ticket checker. AI validates completeness before partners submit to Salesforce/Partner Service Desk.

## Deploy to Vercel (10 minutes)

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

### 3. Add your API key
1. In Vercel dashboard → your project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)
3. Redeploy (Vercel → Deployments → Redeploy)

Done. Your app is live at `your-project.vercel.app`.

## Local development
```bash
npm install
# create .env.local with: ANTHROPIC_API_KEY=your_key_here
npm run dev
```
