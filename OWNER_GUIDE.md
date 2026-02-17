# Vipat E Bllokut — Owner Guide

Hi! This is your guide to control your Albanian news website. Everything runs automatically — articles come in every 3 hours from 10 Albanian news sources. But when you want to do something manually, you just talk to Manus.

---

## How Everything Works

Your news site lives at **https://vipatebllokut.com**

The code sits on **GitHub** (a safe box for code). When code changes on GitHub, your hosting on **Railway** automatically updates the live website. You never touch code — Manus does it for you.

**The flow:** You tell Manus what you want → Manus changes the code on GitHub → Railway auto-deploys → vipatebllokut.com updates

---

## How the Homepage Decides What to Show

Your homepage has smart sections that pick articles automatically:

**TRENDING (the big article at the top)** — The system looks at the 100 newest articles and gives each a "controversy score." Articles about scandals, arrests, corruption, protests, wars, or famous politicians (Rama, Berisha, Kurti, Trump, Putin) score higher. Question marks, exclamation marks, and quotes in the title also boost the score. The highest-scoring article becomes the big hero.

**HOT (2 articles below the hero)** — The 2nd and 3rd highest-scoring articles.

**MË TË LEXUARAT (Most Read sidebar)** — Articles ranked 4th through 8th from the same scoring system.

**POLITIKË section** — The 6 newest articles in the "Politikë" category.

**BOTË section** — The 6 newest articles in the "Botë" (World) category.

**LAJMET MË TË FUNDIT (Latest News)** — Simply the newest articles, excluding those already shown above.

**In short:** Trending, Hot, and Most Read are picked by a controversy algorithm. Everything else is sorted by date.

---

## Controlling Your Website via Manus

Every time you open a new Manus conversation to work on your website, just do two things:

1. **Connect the GitHub repo** `merozakhan/vipat-e-bllokut`
2. **Attach the file** `MANUS_AGENT_GUIDE.md`

That's it. Manus will read the guide and know everything — the database, the code, the APIs, the credentials. You just tell it what you want in plain language.

---

## Things You Can Tell Manus

### Write and Publish an Article

Just describe what you want. Manus will write it in Albanian, find or generate an image, pick the right category, and publish it.

> "Shkruaj një artikull për ministrin e shëndetësisë që vodhi para publike. Detajet: [përshkruaj çfarë ndodhi]. Kategoria: Politikë."

> "Write a controversial article about the new tax law that will affect small businesses in Albania. Make it trending."

> "Shkruaj lajm për ndeshjen Shqipëri-Itali që u zhvillua sot. Rezultati 2-1 për Shqipërinë. Kategoria: Sport."

> "Here's a photo [attach image]. Write an article about this event — it was a protest in Tirana today against corruption."

Manus will automatically:
- Write the article in Albanian
- Upload the image to Cloudinary
- Pick the right category (or you can tell it which one)
- Publish it on the website
- If you say "make it trending," it will use high-engagement keywords in the title

### Pin an Article to Trending / Breaking

> "Bëje artikullin me ID 45 trending — ndrysho titullin që të ketë fjalë kontroverse."

> "Make the article about Rama's speech appear as the top trending article."

> "I want the article about the earthquake to be the hero on the homepage."

### Remove an Article

> "Fshi artikullin me titull 'XYZ' nga faqja."

> "Delete article ID 123 from the website."

### Change the Website Design

> "Change the header color to dark blue."

> "Add a new section on the homepage for 'Lajme Lokale' (Local News)."

> "Make the font bigger on mobile phones."

### Add a New News Source

> "Add a new RSS feed from [website URL] so we get their articles automatically."

### Check if Everything is Working

> "Check if vipatebllokut.com is running properly and when the last news import happened."

### Fix a Problem

> "The contact form isn't working — fix it."

> "Images are not loading on some articles — investigate and fix."

---

## Your Categories

| ID | Albanian | English |
|----|----------|---------|
| 1 | Politikë | Politics |
| 2 | Ekonomi | Economy |
| 3 | Sport | Sports |
| 4 | Botë | World |
| 5 | Teknologji | Technology |
| 6 | Kulturë | Culture |
| 7 | Shëndetësi | Health |
| 8 | Argëtim | Entertainment |

You can tell Manus to add new categories anytime.

---

## Your Logins

### Website Email (where contact form messages arrive)
- **Go to:** https://mail.zoho.eu/
- **Email:** info@vipatebllokut.com
- **Password:** Vipat@01.,

### Gmail (used to sign into other services)
- **Email:** khanmehroza35@gmail.com
- **Password:** Vipat@01.,

### Domain (Namecheap)
- **Go to:** https://www.namecheap.com
- **Username:** mehroz2026
- **Password:** Vipat@01.,

### Hosting (Railway)
- **Go to:** https://railway.com
- **Login:** Sign in with GitHub
- **Project:** https://railway.com/project/096e5246-049c-4292-8494-b41e146e3416

### Code (GitHub)
- **Go to:** https://github.com/merozakhan/vipat-e-bllokut
- **Login:** Sign in with Google (khanmehroza35@gmail.com)

### Images (Cloudinary)
- **Go to:** https://console.cloudinary.com
- **Login:** Sign in with Google (khanmehroza35@gmail.com)

### SEO (Google Search Console)
- **Go to:** https://search.google.com/search-console
- **Login:** Sign in with Google (khanmehroza35@gmail.com)

### eSIM Plus
- **Go to:** https://esimplus.me/
- **Phone:** +44 7476 921815
- **Login:** Sign in with Google (khanmehroza35@gmail.com)

### RDP Server (Remote Desktop)
- **IP:** 136.0.1.182
- **Username:** Administrator
- **Password:** BcR9Gaxccfk1f6J8m0r4

---

## Important Reminders

- **Always attach MANUS_AGENT_GUIDE.md** when starting a new Manus conversation about your website
- **Always connect the GitHub repo** `merozakhan/vipat-e-bllokut` in Manus
- **Don't share this document publicly** — it has all your passwords
- **Don't change DNS records** in Namecheap yourself — ask Manus if needed
- **Check your Zoho email** regularly for contact form messages from visitors
