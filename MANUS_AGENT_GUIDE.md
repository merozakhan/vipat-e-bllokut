# Vipat E Bllokut — Manus Agent Operations Guide

> **Purpose**: This document is written for LLM-based agents (Manus, GPT, Claude, etc.) that need to understand, modify, deploy, or troubleshoot this project. It contains every credential, architectural decision, file mapping, and operational procedure needed to fully manage the system without human intervention.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Vipat E Bllokut (VEB) |
| **Description** | Albanian-language news aggregation platform. Auto-imports articles from 10+ Albanian RSS feeds every 3 hours, stores images on Cloudinary, serves via React SPA with Express backend. |
| **Live URL** | `https://vipatebllokut.com` |
| **Backup URL** | `https://vipat-e-bllokut-production.up.railway.app` |
| **Language** | Albanian (sq), UI partially bilingual |
| **Tech Stack** | React 19 + Tailwind CSS 4 + Express 4 + tRPC 11 + Drizzle ORM + MySQL (TiDB on Railway) |
| **Package Manager** | pnpm 10.4.1 |
| **Node Version** | 22 |

---

## 2. Complete Credentials Registry

### 2.1 GitHub (Source Code)

| Field | Value |
|-------|-------|
| **Repository** | `https://github.com/merozakhan/vipat-e-bllokut` |
| **Branch** | `main` |
| **Auth** | Login via Google: `khanmehroza35@gmail.com` |
| **CLI** | `gh` is pre-configured when running in Manus sandbox |
| **Clone** | `gh repo clone merozakhan/vipat-e-bllokut` |

### 2.2 Railway (Hosting + Database)

| Field | Value |
|-------|-------|
| **Dashboard** | `https://railway.com/project/096e5246-049c-4292-8494-b41e146e3416` |
| **Service ID** | `f8c6d049-a3aa-4188-b992-b8935f157c4e` |
| **Auth** | Login via GitHub (merozakhan) |
| **Public Domain** | `vipat-e-bllokut-production.up.railway.app` |
| **Custom Domain** | `vipatebllokut.com` |
| **Deploy Method** | Auto-deploy on push to `main` branch |
| **Builder** | Dockerfile |
| **Port** | 8080 (configured in Railway) |
| **Healthcheck** | `GET /health` |

**Railway MySQL Database:**

| Field | Value |
|-------|-------|
| **Host (Public)** | `crossover.proxy.rlwy.net` |
| **Port (Public)** | `21702` |
| **Host (Private)** | `$RAILWAY_PRIVATE_DOMAIN` |
| **Port (Private)** | `3306` |
| **Database** | `railway` |
| **User** | `root` |
| **Password** | `MjPzkzuNQHXYfztsmRxWAqddOerUGPTF` |
| **Public URL** | `mysql://root:MjPzkzuNQHXYfztsmRxWAqddOerUGPTF@crossover.proxy.rlwy.net:21702/railway` |
| **App Reference** | `${{MySQL.MYSQL_URL}}` (used in Railway service variables) |

**To connect from external machine:**
```bash
mysql -h crossover.proxy.rlwy.net -P 21702 -u root -pMjPzkzuNQHXYfztsmRxWAqddOerUGPTF --protocol=TCP --ssl railway
```

### 2.3 Cloudinary (Image Storage)

| Field | Value |
|-------|-------|
| **Console** | `https://console.cloudinary.com` |
| **Auth** | Login via Google: `khanmehroza35@gmail.com` |
| **Cloud Name** | `dp8mbbbm4` |
| **API Key** | `878111279859584` |
| **API Secret** | `5keCX3gUpdY0YEhj6yK4RfhNmXw` |
| **Folder** | `vipat-articles/` |
| **Plan** | Free (25GB storage, 25GB bandwidth/month) |

### 2.4 Zoho Mail (Email)

| Field | Value |
|-------|-------|
| **Webmail** | `https://mail.zoho.eu/` |
| **Email** | `info@vipatebllokut.com` |
| **Password** | `Vipat@01.,` |
| **SMTP Host** | `smtp.zoho.eu` |
| **SMTP Port** | `587` |
| **IMAP Host** | `imap.zoho.eu` |
| **IMAP Port** | `993` |

### 2.5 Namecheap (Domain Registrar)

| Field | Value |
|-------|-------|
| **Dashboard** | `https://ap.www.namecheap.com/` |
| **Username** | `mehroz2026` |
| **Password** | `Vipat@01.,` |
| **Domain** | `vipatebllokut.com` |
| **Nameservers** | Namecheap BasicDNS |

**Current DNS Records:**

| Type | Host | Value |
|------|------|-------|
| ALIAS | `@` | `nphj0z9h.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=a26756294a0d6bc92e7c7c82d7ccffdb706c6960f5d9c3a486c74a883c666dd9` |
| TXT | `@` | `google-site-verification=h5jH8wSmjTHDymhiwyU7n59k0pwngsEUbiRMolXdSV8` |
| TXT | `@` | Zoho domain verification (added by owner) |
| MX | `@` | Zoho MX records (added by owner for email) |

### 2.6 Google Search Console

| Field | Value |
|-------|-------|
| **URL** | `https://search.google.com/search-console` |
| **Auth** | Google: `khanmehroza35@gmail.com` |
| **Property** | `vipatebllokut.com` |
| **Verification** | TXT record (verified) |
| **Sitemap** | `https://vipatebllokut.com/sitemap.xml` |

### 2.7 Gmail (Owner's Primary Email)

| Field | Value |
|-------|-------|
| **Email** | `khanmehroza35@gmail.com` |
| **Password** | `Vipat@01.,` |

### 2.8 RDP Server

| Field | Value |
|-------|-------|
| **IP** | `136.0.1.182` |
| **Username** | `Administrator` |
| **Password** | `BcR9Gaxccfk1f6J8m0r4` |

### 2.9 eSIM Plus

| Field | Value |
|-------|-------|
| **URL** | `https://esimplus.me/` |
| **Phone** | `+44 7476 921815` |
| **Auth** | Login via Google: `khanmehroza35@gmail.com` |

---

## 3. Railway Environment Variables

These are the environment variables configured on the Railway `vipat-e-bllokut` service:

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` | MySQL connection (Railway reference variable) |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `8080` | Server port |
| `CLOUDINARY_CLOUD_NAME` | `dp8mbbbm4` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `878111279859584` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `5keCX3gUpdY0YEhj6yK4RfhNmXw` | Cloudinary API secret |
| `SMTP_HOST` | `smtp.zoho.eu` | Zoho SMTP server |
| `SMTP_PORT` | `587` | Zoho SMTP port |
| `SMTP_USER` | `info@vipatebllokut.com` | Zoho email address |
| `SMTP_PASS` | `Vipat@01.,` | Zoho email password |

**Optional (not yet set):**

| Variable | Purpose |
|----------|---------|
| `ARTICLE_API_KEY` | Secret key for REST API article posting (`POST /api/articles`) |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    RAILWAY HOSTING                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Express Server (port 8080)             │   │
│  │                                                   │   │
│  │  /health          → healthcheck                   │   │
│  │  /api/trpc/*      → tRPC endpoints                │   │
│  │  /api/image-proxy → image proxy (hotlink bypass)  │   │
│  │  /api/articles    → REST API (secret key auth)    │   │
│  │  /sitemap.xml     → dynamic sitemap               │   │
│  │  /robots.txt      → SEO robots                    │   │
│  │  /feed.xml        → RSS feed output               │   │
│  │  /*               → React SPA (static files)      │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────┼──────────────────────────┐   │
│  │     Cron Scheduler   │    (node-cron)            │   │
│  │  Every 3h: RSS Import + Cloudinary upload        │   │
│  │  On startup: 30s delay then initial import       │   │
│  └──────────────────────┼──────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │         Railway MySQL (TiDB)                     │   │
│  │  Tables: users, articles, categories,            │   │
│  │          article_categories                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────────┐
│   Cloudinary     │          │   10 Albanian RSS     │
│   (images)       │          │   Feed Sources        │
│   dp8mbbbm4      │          │   (koha.net, etc.)    │
└──────────────────┘          └──────────────────────┘
```

---

## 5. File Structure & Key Files

```
albania-news-media/
├── client/
│   ├── index.html              ← HTML template with all SEO meta tags, OG tags, favicons
│   ├── public/
│   │   └── manifest.json       ← PWA manifest
│   └── src/
│       ├── App.tsx             ← Route definitions (wouter)
│       ├── main.tsx            ← React entry point with providers
│       ├── index.css           ← Global styles, Tailwind theme, CSS variables
│       ├── const.ts            ← Frontend constants
│       ├── pages/
│       │   ├── Home.tsx        ← Homepage with breaking news, trending, categories
│       │   ├── ArticleDetail.tsx ← Single article view with SEO
│       │   ├── CategoryPage.tsx  ← Category listing
│       │   ├── SearchPage.tsx    ← Search results
│       │   ├── Contact.tsx       ← Contact form (wired to tRPC)
│       │   ├── Advertise.tsx     ← Advertising page
│       │   ├── About.tsx         ← About page
│       │   ├── PrivacyPolicy.tsx ← Privacy policy
│       │   ├── GDPR.tsx          ← GDPR compliance
│       │   ├── Terms.tsx         ← Terms of service
│       │   ├── CookiePolicy.tsx  ← Cookie policy
│       │   └── EditorialPolicy.tsx ← Editorial policy
│       ├── components/
│       │   ├── Layout.tsx      ← Header, footer, navigation, newsletter form
│       │   ├── SEOHead.tsx     ← Dynamic meta tags component (react-helmet-async)
│       │   └── ui/             ← shadcn/ui components
│       ├── contexts/
│       │   └── ThemeContext.tsx ← Dark theme provider
│       └── lib/
│           └── trpc.ts         ← tRPC client binding
├── server/
│   ├── _core/
│   │   ├── index.ts            ← Express server entry (routes, middleware, startup)
│   │   ├── context.ts          ← tRPC context (simplified, no auth)
│   │   ├── trpc.ts             ← tRPC router/procedure definitions
│   │   ├── env.ts              ← Environment variable loader
│   │   ├── vite.ts             ← Vite dev/production serving
│   │   └── systemRouter.ts     ← System health endpoint
│   ├── routers.ts              ← All tRPC endpoints (articles, categories, contact, rssImport)
│   ├── db.ts                   ← Database query helpers (Drizzle ORM)
│   ├── rssImporter.ts          ← RSS feed parser, content scraper, Cloudinary uploader
│   ├── cronScheduler.ts        ← node-cron scheduler (every 3 hours)
│   ├── cloudinaryStorage.ts    ← Cloudinary upload helper
│   ├── emailService.ts         ← Nodemailer SMTP email sender
│   └── storage.ts              ← Legacy storage wrapper (delegates to Cloudinary)
├── drizzle/
│   ├── schema.ts               ← Database schema (users, articles, categories, article_categories)
│   ├── 0000_new_captain_america.sql ← Migration: users table
│   └── 0001_spooky_terrax.sql  ← Migration: articles, categories, article_categories tables
├── shared/
│   └── const.ts                ← Shared constants
├── Dockerfile                  ← Multi-stage Docker build
├── railway.json                ← Railway deployment config
├── package.json                ← Dependencies and scripts
├── vite.config.ts              ← Vite build config
├── drizzle.config.ts           ← Drizzle ORM config
└── tsconfig.json               ← TypeScript config
```

---

## 6. Database Schema

**4 tables** in MySQL database `railway`:

### users
| Column | Type | Notes |
|--------|------|-------|
| id | int AUTO_INCREMENT | PK |
| openId | varchar(64) | UNIQUE, used as identifier |
| name | text | nullable |
| email | varchar(320) | nullable |
| loginMethod | varchar(64) | nullable |
| role | enum('user','admin') | default 'user' |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto-update |
| lastSignedIn | timestamp | auto |

### articles
| Column | Type | Notes |
|--------|------|-------|
| id | int AUTO_INCREMENT | PK |
| title | varchar(255) | NOT NULL |
| slug | varchar(255) | UNIQUE, NOT NULL |
| excerpt | text | nullable |
| content | text | NOT NULL (full HTML) |
| featuredImage | varchar(500) | Cloudinary URL |
| featuredImageKey | varchar(500) | Cloudinary public_id |
| status | enum('draft','published') | default 'published' |
| authorId | int | FK to users.id |
| publishedAt | timestamp | nullable |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto-update |

**Indexes:** author_idx, status_idx, published_at_idx, slug_idx

### categories
| Column | Type | Notes |
|--------|------|-------|
| id | int AUTO_INCREMENT | PK |
| name | varchar(100) | NOT NULL |
| slug | varchar(100) | UNIQUE, NOT NULL |
| description | text | nullable |
| createdAt | timestamp | auto |
| updatedAt | timestamp | auto-update |

**Seeded categories (8):** Politikë (politike), Ekonomi (ekonomi), Sport (sport), Botë (bote), Teknologji (teknologji), Kulturë (kulture), Shëndetësi (shendetesi), Argëtim (argetim)

### article_categories
| Column | Type | Notes |
|--------|------|-------|
| id | int AUTO_INCREMENT | PK |
| articleId | int | NOT NULL |
| categoryId | int | NOT NULL |
| createdAt | timestamp | auto |

**Unique constraint:** (articleId, categoryId)

---

## 7. API Endpoints

### tRPC Endpoints (via `/api/trpc/`)

| Endpoint | Type | Auth | Description |
|----------|------|------|-------------|
| `system.health` | query | public | Health check |
| `articles.getPublished` | query | public | Get published articles (limit, offset) |
| `articles.getFeatured` | query | public | Get top trending article |
| `articles.getTrending` | query | public | Get trending articles by engagement score |
| `articles.getByCategorySlug` | query | public | Get articles by category slug |
| `articles.getAll` | query | public | Get all articles |
| `articles.getBySlug` | query | public | Get single article by slug (includes categories) |
| `articles.getById` | query | public | Get single article by ID (includes categories) |
| `articles.search` | query | public | Full-text search articles |
| `articles.getByCategory` | query | public | Get articles by category ID |
| `categories.getAll` | query | public | Get all categories |
| `categories.getBySlug` | query | public | Get category by slug |
| `categories.getById` | query | public | Get category by ID |
| `contact.submit` | mutation | public | Submit contact form (sends email) |
| `contact.newsletter` | mutation | public | Newsletter subscription |
| `rssImport.status` | query | public | Get last import result and running state |
| `rssImport.trigger` | mutation | public | Manually trigger RSS import |

### REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | none | Healthcheck for Railway |
| GET | `/api/image-proxy?url=...` | none | Proxy external images (bypass hotlinking) |
| POST | `/api/articles` | `X-Api-Key` header | Create article via REST API |
| GET | `/sitemap.xml` | none | Dynamic XML sitemap with Google News extensions |
| GET | `/robots.txt` | none | SEO robots.txt |
| GET | `/feed.xml` | none | RSS 2.0 feed (latest 30 articles) |

### POST /api/articles Request Format
```json
{
  "title": "Article Title",
  "content": "<p>HTML content</p>",
  "excerpt": "Optional excerpt",
  "imageUrl": "https://example.com/image.jpg",
  "categoryIds": [1, 3],
  "status": "published"
}
```
Header: `X-Api-Key: <ARTICLE_API_KEY env var value>`

---

## 8. RSS Import System

### Feed Sources (10 feeds)
Koha.net, Gazeta Express, Reporter.al, Telegrafi.com, Albeu.com, News24.al, Vizion Plus, BalkanInsight, Epoka e Re, Zeri.info

### Import Rules
1. Articles MUST have all three: **title**, **content (50+ chars)**, **image**
2. Images are downloaded and re-uploaded to Cloudinary (not hotlinked)
3. Duplicate detection by title similarity (Levenshtein distance)
4. Category auto-detection via Albanian keyword matching
5. Content scraped from article pages when RSS description is insufficient
6. Runs every 3 hours via node-cron, plus 30s after server startup

### Category Detection
Keywords in `CATEGORY_KEYWORDS` map in `server/rssImporter.ts`. Title matches score 2x, description matches score 1x. Highest scoring category wins.

---

## 9. Build & Deploy Workflow

### Local Development
```bash
gh repo clone merozakhan/vipat-e-bllokut
cd vipat-e-bllokut
pnpm install
# Set DATABASE_URL in .env for local MySQL
pnpm dev
```

### Build
```bash
pnpm run build
# Outputs: dist/index.js (server) + dist/client/ (static files)
```

### Deploy to Railway
```bash
git add -A && git commit -m "description"
git push origin main
# Railway auto-deploys from main branch
```

### Database Migrations
1. Edit `drizzle/schema.ts`
2. Run `pnpm drizzle-kit generate` to create migration SQL
3. Apply SQL to Railway MySQL:
```bash
mysql -h crossover.proxy.rlwy.net -P 21702 -u root -pMjPzkzuNQHXYfztsmRxWAqddOerUGPTF --protocol=TCP --ssl railway < drizzle/XXXX_migration.sql
```

### Seed Data (for fresh database)
```sql
-- Migration 1: users table
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);

-- Migration 2: articles, categories, article_categories (run each statement separately, split on --> statement-breakpoint)

-- Seed categories
INSERT INTO categories (name, slug, description) VALUES
('Politikë', 'politike', 'Lajme politike nga Shqipëria dhe bota'),
('Ekonomi', 'ekonomi', 'Lajme ekonomike dhe financiare'),
('Sport', 'sport', 'Lajme sportive nga Shqipëria dhe bota'),
('Botë', 'bote', 'Lajme ndërkombëtare'),
('Teknologji', 'teknologji', 'Lajme nga bota e teknologjisë'),
('Kulturë', 'kulture', 'Lajme kulturore dhe artistike'),
('Shëndetësi', 'shendetesi', 'Lajme nga fusha e shëndetësisë'),
('Argëtim', 'argetim', 'Lajme nga bota e argëtimit');

-- Seed system user
INSERT INTO users (openId, name, email, role) VALUES
('system-rss-importer', 'RSS Importer', 'system@vipat.al', 'admin');
```

---

## 10. SEO Configuration

| Feature | Status | Location |
|---------|--------|----------|
| Open Graph tags | Active | `client/index.html` + `SEOHead.tsx` per page |
| Twitter Cards | Active | `client/index.html` + `SEOHead.tsx` per page |
| JSON-LD (Organization) | Active | `client/index.html` |
| JSON-LD (WebSite + SearchAction) | Active | `client/index.html` |
| JSON-LD (NewsArticle) | Active | `SEOHead.tsx` on article pages |
| Dynamic sitemap.xml | Active | `server/_core/index.ts` (282+ URLs) |
| robots.txt | Active | `server/_core/index.ts` |
| RSS feed | Active | `server/_core/index.ts` at `/feed.xml` |
| Google News sitemap extensions | Active | In sitemap.xml |
| Canonical URLs | Active | Per page via SEOHead |
| hreflang (Albanian) | Active | `client/index.html` |
| Favicons (all sizes) | Active | Hosted on manuscdn.com CDN |
| OG Image (1200x630) | Active | Hosted on manuscdn.com CDN |
| Web Manifest (PWA) | Active | `client/public/manifest.json` |
| Google Search Console | Verified | TXT record in Namecheap DNS |

### CDN Asset URLs
| Asset | URL |
|-------|-----|
| Favicon .ico | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/oHlHPqbgJdyxmlsT.ico` |
| Favicon 16x16 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/ZjsVTsrkefdaoUhp.png` |
| Favicon 32x32 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/ItnloynPDSJFFteE.png` |
| Apple Touch 180x180 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/lKpZvNTqNDEeHZSE.png` |
| Android 192x192 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/RPElwxPOCNfSdwnX.png` |
| Logo 512x512 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/FdUjpIhDGBJWAQBf.png` |
| Full Logo | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/dSMzXKooKwxKipAr.png` |
| OG Image 1200x630 | `https://files.manuscdn.com/user_upload_by_module/session_file/310419663030573139/QipgFkGifGoFtIkn.png` |

---

## 11. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Site shows 502 | Server crashed | Check Railway deploy logs, redeploy |
| No new articles | RSS feeds down or Cloudinary limit | Check `/api/trpc/rssImport.status`, trigger manual import |
| Images broken | Cloudinary bandwidth exceeded | Check Cloudinary dashboard, upgrade plan or wait for reset |
| Contact form fails silently | SMTP credentials wrong | Check Railway `SMTP_*` vars, test with Zoho webmail |
| Domain not resolving | DNS changed | Check Namecheap ALIAS record → `nphj0z9h.up.railway.app` |
| Build fails | TypeScript errors | Run `pnpm run check` locally, fix errors |
| Database connection refused | Railway MySQL restarted | Check Railway MySQL service status, may need to restart app |

---

## 12. Autonomous Operation Guide for Manus Agents

> **CRITICAL**: When the owner asks you to do something, you must figure out the technical steps yourself. The owner will speak in plain language like "write an article about X" or "make article Y trending". You must translate that into the correct actions below.

### 12.1 Publishing a New Article

When the owner says something like "write an article about [topic]":

1. **Clone the repo**: `gh repo clone merozakhan/vipat-e-bllokut`
2. **Write the article in Albanian** — the entire website is in Albanian. Title, excerpt, and content must all be in Albanian.
3. **If the owner attaches an image**, upload it to Cloudinary using the credentials in Section 2.3:
```bash
curl -X POST https://api.cloudinary.com/v1_1/dp8mbbbm4/image/upload \
  -F "file=@/path/to/image.jpg" \
  -F "upload_preset=ml_default" \
  -F "folder=vipat-articles"
```
Or use the Cloudinary Node SDK in a script.
4. **If no image is attached**, search for a relevant image online, download it, and upload to Cloudinary.
5. **Post via REST API**:
```bash
curl -X POST https://vipatebllokut.com/api/articles \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: <ARTICLE_API_KEY from Railway env vars>" \
  -d '{
    "title": "Albanian title here",
    "content": "<p>Full HTML article content in Albanian</p>",
    "excerpt": "Short 1-2 sentence Albanian summary",
    "imageUrl": "https://res.cloudinary.com/dp8mbbbm4/...",
    "categoryIds": [1],
    "status": "published"
  }'
```
6. **If ARTICLE_API_KEY is not set**, connect to Railway MySQL directly and INSERT the article:
```sql
INSERT INTO articles (title, slug, excerpt, content, featuredImage, status, authorId, publishedAt)
VALUES ('Title', 'slug-here', 'Excerpt', '<p>Content</p>', 'cloudinary-url', 'published', 1, NOW());
-- Then link to category:
INSERT INTO article_categories (articleId, categoryId) VALUES (LAST_INSERT_ID(), 1);
```

### 12.2 Making an Article Trend on the Homepage

The trending algorithm in `server/db.ts` (`getTrendingArticles` function) scores articles based on:

**Albanian controversy keywords** (each worth points):
- `skandal`, `arrestim`, `arrest`, `akuz`, `korrupsion`, `protestë`, `krizë`, `dorëheq`, `hetim`, `dënim`, `burgim`, `krim`, `vrasje`, `trafikim`, `mashtrim`, `përplasje`, `tensione`, `konflikt`, `luftë`, `sulm`, `shpërthim`, `tërmet`, `përmbytje`, `urgjencë`, `alarm`

**Famous politician names** (each worth points):
- `rama`, `berisha`, `basha`, `meta`, `kurti`, `veliaj`, `trump`, `putin`, `biden`, `zelensky`

**Title punctuation boosters**:
- Question marks (`?`) boost score
- Exclamation marks (`!`) boost score
- Quotes in title boost score

**To make an article trend**, update its title to include these keywords:
```sql
UPDATE articles SET title = 'New title with skandal or arrestim keywords?' WHERE id = <ID>;
```

Or when writing a new article, include controversy keywords naturally in the Albanian title.

### 12.3 Pinning an Article as Breaking News

Currently, "breaking news" is the same as the top trending article (highest controversy score). To force a specific article to the top:

1. Update its title to include multiple high-scoring keywords
2. Or modify the `getTrendingArticles` function in `server/db.ts` to add a `isFeatured` check that overrides the score

### 12.4 Removing an Article

```sql
-- Connect to Railway MySQL (see Section 2.2 for credentials)
DELETE FROM article_categories WHERE articleId = <ID>;
DELETE FROM articles WHERE id = <ID>;
```

### 12.5 Adding a New RSS Feed Source

Edit `server/rssImporter.ts`, add to the `RSS_FEEDS` array:
```ts
{ name: "Source Name", url: "https://example.com/feed/", defaultCategory: "aktualitet" },
```
Commit and push to `main` → Railway auto-deploys.

### 12.6 Adding a New Category

```sql
INSERT INTO categories (name, slug, description) VALUES ('Category Name', 'slug', 'Description in Albanian');
```
Then add keyword mappings in `CATEGORY_KEYWORDS` in `server/rssImporter.ts`.

### 12.7 Changing Website Design

- Frontend pages are in `client/src/pages/`
- Global styles in `client/src/index.css`
- Layout (header, footer, nav) in `client/src/components/Layout.tsx`
- After changes: `pnpm run build` to verify, then `git push origin main` to deploy

### 12.8 Checking System Health

```bash
curl https://vipatebllokut.com/health
curl https://vipatebllokut.com/api/trpc/rssImport.status
```

---

## 13. Important Notes for Future Agents

1. **No authentication system**: Manus OAuth was stripped. All tRPC procedures use `publicProcedure`. There is no login/logout flow.
2. **No admin panel**: Articles are managed via RSS auto-import and REST API only. No web-based admin UI exists.
3. **All articles must be in Albanian**: The entire website serves Albanian-speaking audience. When the owner asks for an article in English, translate it to Albanian.
4. **Cloudinary free tier limits**: 25GB storage, 25GB bandwidth/month. Monitor usage if article count grows significantly.
5. **Railway pricing**: ~$5/month. MySQL + web service should stay within limits for moderate traffic.
6. **SMTP timeout handling**: Email sending has a 20-second hard timeout. If Zoho SMTP is slow, emails are logged server-side but may not deliver. The user always sees success.
7. **Image proxy**: `/api/image-proxy` exists for legacy articles that still reference original source URLs. New articles use Cloudinary URLs directly.
8. **The `storage.ts` file** is a legacy wrapper that now delegates to `cloudinaryStorage.ts`. Both exist for backward compatibility.
9. **Drizzle migrations**: The `drizzle/` folder contains migration SQL files. Always use `pnpm drizzle-kit generate` after schema changes, then apply SQL manually to Railway MySQL.
10. **The `_core/` directory** contains framework plumbing. Avoid editing unless extending infrastructure.
11. **Auto-deploy**: Any push to `main` branch triggers Railway auto-deploy. Build takes ~2-3 minutes.
12. **Slug generation**: When inserting articles directly via SQL, generate a URL-safe slug from the title (lowercase, replace spaces with hyphens, remove special chars, append random 6-char suffix for uniqueness).

---

## 14. Contact Information

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Owner | Mehroza Khan | khanmehroza35@gmail.com | +44 7476 921815 |
| Business Email | — | info@vipatebllokut.com | — |

**Business Address**: 125 Kingsway, Holborn, London, WC2B 6NH, United Kingdom
