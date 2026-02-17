# Vipat E Bllokut - Albanian News Media Platform

A premium Albanian news aggregation platform that automatically imports articles from 10+ Albanian media RSS feeds every 3 hours, with full-text scraping, intelligent categorization, duplicate detection, and Cloudinary image storage.

**Live at**: [vipatebllokut.com](https://vipatebllokut.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Backend | Express 4, tRPC 11, Node.js 22 |
| Database | MySQL 8 (Railway plugin or any MySQL) |
| Image Storage | Cloudinary (free tier: 25GB) |
| Deployment | Railway (Docker) |

## Features

- **Automated RSS Import**: Fetches articles from 10 Albanian media sources every 3 hours
- **Full-Text Scraping**: Extracts complete article content from source websites
- **Cloudinary Image Storage**: Downloads and re-hosts all article images permanently
- **Smart Categorization**: AI keyword-based detection across 8 categories (Aktualitet, Sport, Kulturë, Botë, Ekonomi, Teknologji, Shëndetësi, Politikë)
- **Duplicate Detection**: 30% title similarity threshold prevents re-importing the same story
- **Engagement Scoring**: Trending articles ranked by controversy/engagement keywords
- **Image Proxy**: Server-side proxy bypasses hotlink protection from source sites
- **REST API**: Secret-key authenticated endpoint for programmatic article posting
- **Mobile-First Design**: Premium dark theme with gold accents, fully responsive

## RSS Feed Sources

| Source | URL | Default Category |
|--------|-----|-----------------|
| Koha.net | koha.net/rss | Aktualitet |
| Gazeta Express | gazetaexpress.com/feed | Aktualitet |
| Reporter.al | reporter.al/feed | Aktualitet |
| Telegrafi.com | telegrafi.com/feed | Aktualitet |
| Albeu.com | albeu.com/rss | Aktualitet |
| News24.al | news24.al/feed | Aktualitet |
| Vizion Plus | vizionplus.tv/feed | Aktualitet |
| BalkanInsight | balkaninsight.com/feed | Botë |
| Epoka e Re | epokaere.com/feed | Aktualitet |
| Zeri.info | zeri.info/rss | Aktualitet |

---

## Railway Deployment Guide

### Prerequisites

1. A [Railway](https://railway.app) account
2. A [Cloudinary](https://cloudinary.com) account (free tier is sufficient)
3. This GitHub repository

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `theworkguy/albania-news-media`
4. Railway will auto-detect the Dockerfile and start building

### Step 2: Add MySQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"MySQL"**
2. Railway automatically creates `DATABASE_URL` and injects it into your service
3. The app connects using this URL automatically

### Step 3: Run Database Migrations

After MySQL is provisioned, connect to it and run the migration SQL:

```sql
-- Migration 1: Users table
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

-- Migration 2: Articles, Categories, and Article-Categories tables
CREATE TABLE `categories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `categories_id` PRIMARY KEY(`id`),
  CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `articles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text,
  `content` text NOT NULL,
  `featuredImage` varchar(500),
  `featuredImageKey` varchar(500),
  `status` enum('draft','published') NOT NULL DEFAULT 'published',
  `authorId` int NOT NULL,
  `publishedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `articles_id` PRIMARY KEY(`id`),
  CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);

CREATE TABLE `article_categories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `articleId` int NOT NULL,
  `categoryId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `article_categories_id` PRIMARY KEY(`id`),
  CONSTRAINT `unique_article_category` UNIQUE(`articleId`,`categoryId`)
);

CREATE INDEX `article_idx` ON `article_categories` (`articleId`);
CREATE INDEX `category_idx` ON `article_categories` (`categoryId`);
CREATE INDEX `author_idx` ON `articles` (`authorId`);
CREATE INDEX `status_idx` ON `articles` (`status`);
CREATE INDEX `published_at_idx` ON `articles` (`publishedAt`);
CREATE INDEX `slug_idx` ON `articles` (`slug`);
```

### Step 4: Seed Categories

```sql
INSERT INTO categories (name, slug, description) VALUES
  ('Aktualitet', 'aktualitet', 'Lajmet e fundit dhe aktualiteti'),
  ('Sport', 'sport', 'Lajme sportive'),
  ('Kulturë', 'kulture', 'Kulturë dhe argëtim'),
  ('Botë', 'bote', 'Lajme ndërkombëtare'),
  ('Ekonomi', 'ekonomi', 'Lajme ekonomike dhe biznesi'),
  ('Teknologji', 'teknologji', 'Teknologji dhe inovacion'),
  ('Shëndetësi', 'shendetesi', 'Shëndetësi dhe mirëqenie'),
  ('Politikë', 'politike', 'Lajme politike');
```

### Step 5: Configure Environment Variables

In Railway → your service → **Variables** tab, add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | *(auto-injected by Railway MySQL plugin)* | ✅ Auto |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | ✅ |
| `ARTICLE_API_KEY` | Any secret string for REST API auth | Optional |
| `PORT` | *(auto-set by Railway)* | ✅ Auto |

### Step 6: Deploy

Railway will automatically build and deploy. The first RSS import runs 30 seconds after startup, then every 3 hours.

### Step 7: Custom Domain (Optional)

1. In Railway → your service → **Settings** → **Networking**
2. Add your custom domain (e.g., `vipatebllokut.com`)
3. Update DNS records as instructed

---

## Local Development

```bash
# Clone
git clone https://github.com/theworkguy/albania-news-media.git
cd albania-news-media

# Install
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and Cloudinary credentials

# Run migrations (connect to MySQL and run the SQL above)

# Start dev server
pnpm dev
```

## REST API for Article Posting

Post articles programmatically with a secret API key:

```bash
curl -X POST https://your-domain.com/api/articles \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_secret_key" \
  -d '{
    "title": "Article Title",
    "content": "Full article content...",
    "excerpt": "Short summary",
    "imageUrl": "https://example.com/image.jpg",
    "categoryIds": [1, 2],
    "status": "published"
  }'
```

## Project Structure

```
client/               Frontend (React 19 + Tailwind 4)
  src/
    pages/            Page components (Home, Article, Category, etc.)
    components/       Reusable UI components
    lib/trpc.ts       tRPC client
server/               Backend (Express + tRPC)
  _core/              Framework plumbing
  db.ts               Database query helpers
  routers.ts          tRPC API procedures
  rssImporter.ts      RSS feed parser and article importer
  cronScheduler.ts    3-hour cron job for auto-import
  cloudinaryStorage.ts  Cloudinary upload helpers
  storage.ts          Storage abstraction layer
drizzle/              Database schema and migrations
shared/               Shared types and constants
```

## Company Information

**Vipat E Bllokut Ltd**
- Registered in United Kingdom
- Company Number: 16606613
- Address: 125 Kingsway, Holborn, London WC2B 6NH, United Kingdom
- Phone: +44 7476 921815
- Email: info@vipatebllokut.com

## License

MIT
