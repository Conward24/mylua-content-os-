# MyLÚA Content OS

AI-powered content pipeline for MyLÚA Health. Turns updates, news, and ideas into post copy + branded graphics + a scheduled calendar — in one click.

## Deploy to Vercel (5 minutes)

### Step 1 — Push to GitHub
1. Go to github.com → New repository → name it `mylua-content-os` → Create
2. On your machine (or use GitHub's web upload):
   - Upload all files from this folder to the repo

### Step 2 — Deploy on Vercel
1. Go to vercel.com → Add New Project
2. Import your `mylua-content-os` GitHub repo
3. Click **Deploy** (Vercel auto-detects Next.js — no config needed)

### Step 3 — Add your API key
1. In Vercel dashboard → your project → Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
3. Click **Redeploy** (Settings → Deployments → Redeploy)

That's it. Your app is live at `your-project.vercel.app`.

---

## How to use

1. **New Content** — type an update, paste a news headline, or drop a raw idea
2. **Generate** — AI writes LinkedIn, Instagram, and X copy + renders a 1080×1080 branded graphic
3. **Calendar** — all posts slot in automatically; drag dates to reschedule
4. **Post detail** — copy the text, download the PNG, adjust the date

## Local development

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
# Open http://localhost:3000
```

## What it generates

- **3 posts per input** — different content types, different platforms, spaced across the calendar
- **Platform-specific copy** — LinkedIn (150-280 words), Instagram (80-120 words), X/Twitter (under 280 chars)
- **1080×1080 PNG graphics** — brand colors, lotus mark, IBM Silver Partner badge, downloadable
- **Calendar slots** — auto-dated, rescheduable, persistent in localStorage

## Brand voice baked in

The AI prompt includes MyLÚA's full brand guidelines:
- Correct attribution (pilot stats from university research, not IBM)
- No "certified" for J'Vanay's doula credential
- No patent mechanics disclosed
- Warm but credible tone, specific proof points only
