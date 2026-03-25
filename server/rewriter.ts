/**
 * Article Rewriter — AI-Powered Content Cleaner
 *
 * Pipeline:
 * 1. Strip raw HTML to plain text (regex — fast, reliable)
 * 2. Send title + plain text to Gemini 2.5 Flash to:
 *    - Remove unrelated/promotional content from other articles
 *    - Remove tag lines, source branding, boilerplate
 *    - Return ONLY the paragraphs that belong to this article
 * 3. Wrap cleaned paragraphs in HTML
 *
 * Fallback: if AI is unavailable, uses basic regex cleaning.
 */

import { ENV } from "./_core/env";

// ─── Title Cleanup (always regex — simple & reliable) ───────────────

const TITLE_CLEANUP = [
  /\s*[-–—|]\s*VOX\s*News\s*/gi,
  /\s*[-–—|]\s*VoxNews\s*/gi,
  /\s*[-–—|]\s*Versus\s*/gi,
  /\s*[-–—|]\s*Koha\.net\s*/gi,
  /\s*[-–—|]\s*Telegrafi\s*/gi,
  /\s*[-–—|]\s*Albeu\s*/gi,
  /\s*[-–—|]\s*Reporter\.al\s*/gi,
  /^\s*live\s*updates?\s*[:–—-]?\s*/gi,
];

function cleanTitle(title: string): string {
  let clean = title;
  for (const pattern of TITLE_CLEANUP) {
    clean = clean.replace(pattern, "");
  }
  clean = decodeEntities(clean);
  clean = clean.replace(/<[^>]*>/g, "");
  return clean.trim();
}

// ─── HTML Stripping ─────────────────────────────────────────────────

function stripHtmlDeep(html: string): string {
  let text = html;

  // Remove entire script/style/noscript/iframe/svg/nav/aside/footer blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Remove HTML comments + CDATA
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  text = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");

  // Remove junk class elements
  text = text.replace(/<[^>]*class="[^"]*(?:sidebar|widget|ad-|advert|social-share|related-posts|newsletter|cookie|popup|modal|nav|menu|breadcrumb|ticker|breaking)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");

  // Convert block elements to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section|header|footer|figcaption)>/gi, "\n");
  text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode entities
  text = decodeEntities(text);

  // Remove leaked CSS/JS
  text = text.replace(/\.[\w-]+\s*\{[^}]*\}/g, "");
  text = text.replace(/@media[^{]*\{[^}]*\}/g, "");
  text = text.replace(/@import\s+[^;]+;/g, "");
  text = text.replace(/@charset\s+[^;]+;/g, "");
  text = text.replace(/@font-face\s*\{[^}]*\}/g, "");
  text = text.replace(/\{[^}]*(?:display|margin|padding|font-size|color|background|border|position|width|height|overflow|text-align|float|clear)\s*:[^}]*\}/g, "");
  text = text.replace(/(?:var|let|const|function)\s+\w+\s*[=({]/g, "");
  text = text.replace(/document\.\w+/g, "");
  text = text.replace(/window\.\w+/g, "");

  // Remove data URIs and social media URLs
  text = text.replace(/data:[a-z]+\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "");
  text = text.replace(/https?:\/\/(?:www\.)?(?:facebook|twitter|instagram|youtube|tiktok|whatsapp)\.[a-z]+[^\s]*/gi, "");

  // Clean whitespace
  text = text.replace(/\t/g, " ");
  text = text.replace(/[ ]{2,}/g, " ");
  text = text.replace(/\n[ ]+/g, "\n");
  text = text.replace(/[ ]+\n/g, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ─── AI Rewriter ────────────────────────────────────────────────────

const AI_SYSTEM_PROMPT = `Ti je një asistent redaktor për një portal lajmesh shqip. Detyra jote:

1. LEXO titullin dhe tekstin e artikullit që të jepet.
2. HIQE çdo paragraf që NUK i përket këtij artikulli. Shpesh artikujt e shkrapuar kanë:
   - Paragrafë nga artikuj të tjerë të pa-lidhura (p.sh. lajme për Hamas në një artikull për protesta në Shqipëri)
   - Tekste promovuese si "Lexo edhe:", "Shiko gjithashtu:" etj.
   - Rreshta me etiketa/tags (fjalë kyçe pa strukturë fjalie)
   - Informacion redaksie: emra gazetarësh, "Redaksia Vox", numra telefoni, "dërgoni informacion", etj.
   - Boilerplate: "© 2026", "Të gjitha të drejtat", "Na ndiqni në Instagram", etj.
   - Fragmente CSS/JS, navigacion, timestamps të vetmuara
3. KTHE VETËM paragrafët që i përkasin artikullit.
4. MOS shto asgjë të re, MOS rishkruaj, MOS ndërro fjalët. Kthe tekstin ORIGJINAL.
5. Ndaj paragrafët me DYJA rreshta bosh (\\n\\n).
6. Nëse titulli ka emra burimesh (VOX News, Versus, etj.) hiqe ato nga titulli.

Formati i përgjigjes:
TITULL: [titulli i pastër]
---
[paragrafi 1]

[paragrafi 2]

[paragrafi 3]
...`;

// Rate limit: wait between AI calls to stay under Groq's 12k TPM
let lastAiCall = 0;

async function aiClean(title: string, plainText: string): Promise<{ title: string; content: string } | null> {
  const apiKey = ENV.groqApiKey;
  if (!apiKey) {
    console.warn("[Rewriter AI] No GROQ_API_KEY set, skipping AI clean");
    return null;
  }

  // Wait at least 8s between AI calls to respect Groq rate limits (12k TPM)
  const now = Date.now();
  const elapsed = now - lastAiCall;
  if (elapsed < 8000) {
    await new Promise(r => setTimeout(r, 8000 - elapsed));
  }
  lastAiCall = Date.now();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: AI_SYSTEM_PROMPT },
          { role: "user", content: `TITULLI: ${title}\n\nTEKSTI:\n${plainText.substring(0, 6000)}` },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Rewriter AI] Groq API error ${res.status}: ${errText.substring(0, 200)}`);
      // On rate limit, wait extra before next call
      if (res.status === 429) lastAiCall = Date.now() + 15000;
      return null;
    }

    const data = await res.json();
    const response = data?.choices?.[0]?.message?.content;
    if (!response || typeof response !== "string") return null;

    // Parse the response
    const titleMatch = response.match(/^TITULL:\s*(.+)/m);
    const cleanedTitle = titleMatch ? titleMatch[1].trim() : title;

    // Get content after the --- separator
    const separatorIdx = response.indexOf("---");
    if (separatorIdx === -1) return null;

    const contentText = response.substring(separatorIdx + 3).trim();
    if (contentText.length < 30) return null;

    // Build HTML paragraphs
    const paragraphs = contentText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 5);

    if (paragraphs.length === 0) return null;

    let html = "";
    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs.length >= 10 && i > 2 && i % 7 === 0 && i < paragraphs.length - 2) {
        html += `<hr />`;
      }
      html += `<p>${paragraphs[i]}</p>`;
    }

    console.log(`[Rewriter AI] Cleaned: ${paragraphs.length} paragraphs`);
    return { title: cleanedTitle, content: html };
  } catch (error) {
    console.warn(`[Rewriter AI] Failed, will use fallback:`, error);
    return null;
  }
}

// ─── Smart Fallback Cleaner (when AI is unavailable) ────────────────

const STOP_WORDS = new Set([
  "dhe", "nga", "per", "nje", "tek", "kjo", "ky", "ato", "ata", "eshte", "jane",
  "kane", "nuk", "por", "edhe", "qe", "se", "ne", "te", "me", "ka", "do",
  "pas", "para", "mbi", "nen", "ndaj", "sipas", "rreth", "gjate", "deri",
  "ishte", "ishin", "duke", "si", "apo", "ose", "sa", "i", "e", "u",
  "sot", "dje", "neser", "tha", "tjeter", "kete", "cila", "cilet", "bere",
  "mund", "duhet", "pritet", "pasi", "nese", "keshtu", "atehere", "megjithate",
]);

function normalize(text: string): string {
  return text.replace(/[ëË]/g, "e").replace(/[çÇ]/g, "c")
    .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u").toLowerCase();
}

/**
 * Basic Albanian stemmer — strips common suffixes to match word forms.
 * "protesta" / "protestën" / "protestuesve" → "protest"
 */
function stemAlbanian(word: string): string {
  let w = word;
  // Remove common Albanian suffixes (longest first)
  const suffixes = [
    "uesve", "uesit", "uese", "uesi", "isht", "shme",
    "esve", "evet", "evet", "iste", "isen", "isht",
    "ave", "eve", "ive", "ove", "uve", "ine", "ise",
    "rit", "rin", "ren", "rit", "jet", "jen", "jes",
    "ve", "te", "se", "ne", "re", "it", "in", "en",
    "et", "es", "at", "ut", "im", "ur", "ar",
    "a", "e", "i", "t", "n",
  ];
  for (const s of suffixes) {
    if (w.length > s.length + 3 && w.endsWith(s)) {
      return w.substring(0, w.length - s.length);
    }
  }
  return w;
}

function getKeywords(text: string): Set<string> {
  const words = normalize(text).replace(/[^\w\s]/g, " ").split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  const stems = new Set<string>();
  for (const w of words) {
    stems.add(stemAlbanian(w));
    stems.add(w); // Also keep the full word for exact matches
  }
  return stems;
}

const BOILERPLATE_PATTERNS = [
  /^\s*©/i, /^\s*burim/i, /^\s*lexo\s*(edhe|më\s*shumë|gjithashtu)/i,
  /^\s*shiko\s*(edhe|gjithashtu)/i, /^\s*nuk\s*lejohet/i,
  /^\s*të\s*gjitha\s*të\s*drejtat/i, /^\s*shkruar\s*nga/i,
  /^\s*publikuar\s*më/i, /^\s*na\s*ndiqni/i, /^\s*ndiqni?\s*në/i,
  /^\s*share\s*this/i, /^\s*shpërnda/i, /^\s*tags?\s*:/i,
  /^\s*etiket/i, /^\s*kontakt\s*:/i, /^\s*subscribe/i,
  /^\s*abonohu/i, /^\s*lajme\s*të\s*ngjashme/i,
  /^\s*related\s*(articles|posts|news)/i, /^\s*reklam/i,
  /^\s*sponsored/i, /^\s*loading/i, /^\s*cookie/i,
  /^\s*më\s*shumë\s*nga\s/i, /^\s*dërgoni\s+informacion/i,
  /^\s*regjistrohuni/i, /^\s*click\s*here/i, /^\s*follow\s*us/i,
];

const SOURCE_PATTERNS = [
  /\bvox\s*news\b/gi, /\bvoxnews\b/gi, /\bversus\.al\b/gi,
  /\bredaksia\s*(vox|versus)\b/gi, /\bnga\s*redaksia\b/gi,
  /versus\s+[eë]sht[eë]\s+nj[eë]\s+media/i,
  /vox\s*news?\s+[eë]sht[eë]/i, /në\s+interes\s+të\s+publikut/i,
  /ne\s+q[eë]ndrojm[eë]\s+p[eë]rball[eë]/i,
  /drejtor\s+i\s+p[eë]rgjithsh[eë]m/i, /blerina\s*spaho/i,
  /\+355\s*\d[\d\s-]*/gi, /created\s+and\s+monetized/i,
  /q[eë]llimi\s+yn[eë]\s+[eë]sht[eë]/i,
  /ka\s+nisur\s+publikimet/i,
];

function isJunkParagraph(text: string): boolean {
  const t = text.trim();
  if (t.length < 10) return true;
  // CSS/JS artifacts
  if (/^[.#@{}]/.test(t)) return true;
  if (/^\s*(px|em|rem|%|auto|none|inherit|flex|grid|block|inline)[\s;,]/.test(t)) return true;
  if (/[{};]/.test(t) && t.length < 60) return true;
  if (/window\[|nitroAds|createAd|addEventListener|querySelector/i.test(t)) return true;
  // URLs, numbers only
  if (/^https?:\/\//.test(t)) return true;
  if (/^\d[\d\s./:,-]*$/.test(t)) return true;
  // Boilerplate
  if (BOILERPLATE_PATTERNS.some(p => p.test(t))) return true;
  // Source branding (entire paragraph is about the source)
  if (SOURCE_PATTERNS.some(p => p.test(t)) && t.length < 300) return true;
  // Tag-like lines: all lowercase, no punctuation, 3+ words
  if (!/[.!?;:,]/.test(t) && t.length < 200) {
    const upper = (t.match(/[A-ZÇËÀÁÂ]/g) || []).length;
    const words = t.split(/\s+/);
    if (upper <= 2 && words.length >= 3 && words.every(w => w.length <= 25)) return true;
  }
  // Standalone dates, categories, bylines
  if (/^\d{1,2}\s+\w+\s+\d{4},?\s*\d{1,2}:\d{2}\s*$/.test(t)) return true;
  if (/^(AKTUALITET|POLITIKË|SPORT|BOTË|EKONOMI|TEKNOLOGJI|SHOWBIZ|LIFESTYLE|MAGAZINË|FOKUS)\s*$/i.test(t)) return true;
  if (/^nga\s+[A-ZÇË][a-zçë]+\s+[A-ZÇË][a-zçë]+\s*$/.test(t)) return true;
  return false;
}

function fallbackClean(rawHtml: string, title: string): string {
  const plainText = stripHtmlDeep(rawHtml);
  if (!plainText || plainText.length < 20) return "";

  const paragraphs = plainText
    .split(/\n\n+/)
    .flatMap(block => {
      if (block.length > 300) return block.split(/\n/).map(p => p.trim());
      return [block.trim()];
    })
    .filter(p => p.length > 0);

  // Step 1: Remove junk, duplicates, title repeats
  const titleLower = title.toLowerCase().trim();
  const seen = new Set<string>();
  let cleaned = paragraphs.filter(p => {
    const trimmed = p.trim();
    if (trimmed.length < 15) return false;
    if (isJunkParagraph(trimmed)) return false;

    // Skip title duplicates
    const pLower = trimmed.toLowerCase();
    if (pLower === titleLower) return false;
    if (titleLower.startsWith(pLower) && pLower.length > titleLower.length * 0.7) return false;

    // Skip duplicates
    const key = trimmed.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });

  if (cleaned.length === 0) return "";

  // Step 2: Topic coherence — remove off-topic paragraphs
  const titleKeywords = getKeywords(title);
  // Build topic fingerprint from title + paragraphs that share keywords with title
  const anchoredText = [title];
  for (const p of cleaned) {
    const pKeywords = getKeywords(p);
    let overlap = 0;
    const arr = Array.from(pKeywords);
    for (let i = 0; i < arr.length; i++) {
      if (titleKeywords.has(arr[i])) overlap++;
    }
    if (overlap > 0) anchoredText.push(p);
  }
  const topicKeywords = getKeywords(anchoredText.join(" "));

  if (topicKeywords.size >= 3) {
    cleaned = cleaned.filter(p => {
      const pKeywords = getKeywords(p);
      if (pKeywords.size < 4) return true; // Too short to judge
      let overlap = 0;
      const arr = Array.from(pKeywords);
      for (let i = 0; i < arr.length; i++) {
        if (topicKeywords.has(arr[i])) overlap++;
      }
      return (overlap / pKeywords.size) >= 0.1; // At least 10% overlap
    });
  }

  if (cleaned.length === 0) return "";

  // Step 3: Clean source branding inline
  cleaned = cleaned.map(p => {
    let c = p;
    for (const pattern of SOURCE_PATTERNS) {
      c = c.replace(pattern, "");
    }
    return c.replace(/\s{2,}/g, " ").trim();
  }).filter(p => p.length >= 10);

  // Step 4: Build HTML
  let html = "";
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned.length >= 10 && i > 2 && i % 7 === 0 && i < cleaned.length - 2) {
      html += `<hr />`;
    }
    html += `<p>${cleaned[i]}</p>`;
  }
  return html;
}

// ─── Main Export ────────────────────────────────────────────────────

/**
 * Rewrites an article using AI (Gemini 2.5 Flash).
 * Falls back to basic regex cleaning if AI is unavailable.
 */
export async function rewriteArticle(
  title: string,
  content: string
): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Processing: ${title.substring(0, 60)}...`);

  const cleanedTitle = cleanTitle(title);

  try {
    // Step 1: Strip HTML to plain text
    const plainText = stripHtmlDeep(content);
    if (!plainText || plainText.length < 30) {
      console.warn(`[Rewriter] Content too short after HTML strip: ${cleanedTitle.substring(0, 60)}`);
      return { title: cleanedTitle, content: "" };
    }

    // Step 2: Try AI cleaning
    const aiResult = await aiClean(cleanedTitle, plainText);
    if (aiResult && aiResult.content.length > 50) {
      console.log(`[Rewriter] AI cleaned: ${cleanedTitle.substring(0, 50)}... (${aiResult.content.length} chars)`);
      return aiResult;
    }

    // Step 3: Fallback to regex cleaning
    console.log(`[Rewriter] Using fallback for: ${cleanedTitle.substring(0, 50)}...`);
    const fallbackContent = fallbackClean(content, cleanedTitle);
    if (!fallbackContent) {
      return { title: cleanedTitle, content: "" };
    }

    return { title: cleanedTitle, content: fallbackContent };
  } catch (error) {
    console.error("[Rewriter] Error:", error);
    return { title: cleanedTitle, content: "" };
  }
}
