/**
 * Article Rewriter — Deep HTML Cleaner & Formatter
 *
 * Aggressively strips ALL HTML artifacts, CSS, JS, inline styles,
 * data attributes, source branding, and junk like "Live Updates".
 * Extracts pure article text, then rebuilds clean HTML paragraphs.
 *
 * Pipeline: raw HTML → strip everything → remove junk → extract sentences →
 *           remove boilerplate → clean branding → rebuild HTML
 */

// ─── Source Branding Patterns ────────────────────────────────────────

const SOURCE_BRANDING = [
  // Source names
  /\bvox\s*news\b/gi,
  /\bvoxnews\b/gi,
  /\bversus\.al\b/gi,
  /\bversus\s*news\b/gi,
  /\bkoha\.net\b/gi,
  /\bgazeta\s*express\b/gi,
  /\btelegrafi\b/gi,
  /\balbeu\.com\b/gi,
  /\breporter\.al\b/gi,
  /\bpanorama\.com\.al\b/gi,
  /\blapsi\.al\b/gi,
  /\bbalkanweb\b/gi,
  // Redaksia patterns
  /\bredaksia\s*(vox|versus)\b/gi,
  /\bnga\s*redaksia\b/gi,
  /\bshkruar\s*nga\s*redaksia[^.!?\n]*/gi,
  /\bshkruar\s*nga\s*[A-ZÇË][a-zçë]+\s*[A-ZÇË][a-zçë]*/gi,
  // Read more / CTA / Cross-article promotions
  /lexo\s*më\s*shumë[^.!?\n]*/gi,
  /lexo\s*edhe[^.!?\n]*/gi,
  /lexo\s*gjithashtu[^.!?\n]*/gi,
  /lexo\s*artikullin\s*e\s*plotë[^.!?\n]*/gi,
  /kliko\s*këtu[^.!?\n]*/gi,
  /vazhdo\s*leximin[^.!?\n]*/gi,
  /shiko\s*edhe[^.!?\n]*/gi,
  /shiko\s*gjithashtu[^.!?\n]*/gi,
  /më\s*shumë\s*nga\s[^.!?\n]*/gi,
  // Source / copyright
  /burim[ieë]?:\s*[^.!?\n]*/gi,
  /publikuar\s*më\s*\d{1,2}[./]\d{1,2}[./]\d{2,4}/gi,
  /©\s*\d{4}\s*[^.!?\n]*/gi,
  /të\s*gjitha\s*të\s*drejtat\s*e\s*rezervuara/gi,
  /nuk\s*lejohet\s*riprodhimi/gi,
  /përdorimi\s*i\s*pa\s*autorizuar/gi,
  // Contact info
  /kontakt\s*:\s*\+?\d[\d\s-]*/gi,
  /\+355\s*\d[\d\s-]*/gi,
  // People & roles
  /blerina\s*spaho/gi,
  /drejtor\s*i\s*p[eë]rgjithsh[eë]m\s*:?\s*[^.!?\n<]*/gi,
  // Social CTAs
  /na\s*ndiqni\s*në[^.!?\n]*/gi,
  /ndiqni?\s*në\s*(instagram|facebook|twitter)[^.!?\n]*/gi,
  /dërgoni\s+informacion[^.!?\n]*/gi,
  /mënyrë\s+anonime[^.!?\n]*/gi,
  /regjistrohuni\s+më\s+poshtë[^.!?\n]*/gi,
  // Source prefixes at start of paragraphs (Reuters/, AP/, AFP/, etc.)
  /^(?:Reuters|AP|AFP|DPA|ANSA|Anadolu)\s*[/|:–—-]\s*/gi,
];

const TITLE_CLEANUP = [
  /\s*[-–—|]\s*VOX\s*News\s*/gi,
  /\s*[-–—|]\s*VoxNews\s*/gi,
  /\s*[-–—|]\s*Versus\s*/gi,
  /\s*[-–—|]\s*Koha\.net\s*/gi,
  /\s*[-–—|]\s*Telegrafi\s*/gi,
  /\s*[-–—|]\s*Albeu\s*/gi,
  /\s*[-–—|]\s*Reporter\.al\s*/gi,
  // Remove "Live Update" prefixes from titles
  /^\s*live\s*updates?\s*[:–—-]?\s*/gi,
];

// ─── Junk Line Patterns ─────────────────────────────────────────────
// Lines that are metadata/navigation garbage, not article content

const JUNK_LINE_PATTERNS = [
  // "Live Updates" blocks — the main offender
  /^live\s*updates?\b/i,
  /^breaking\s*news\b/i,
  /^update\s*\d/i,
  // Timestamps mixed with category names (e.g. "23 Mars 2026, 12:28")
  /^\d{1,2}\s+\w+\s+\d{4},?\s*\d{1,2}:\d{2}/,
  // Standalone category words that leaked from navigation
  /^(politik[eë]|aktualitet|ekonomi|sport|bot[eë]|teknologji|showbiz|lifestyle|kultur[eë]|magazin[eë]|fokus|investigim|video)\s*$/i,
  // "Created and monetized by" patterns
  /created\s+(and\s+)?monetized\s+by/i,
  /monetized\s+by\s+\w+/i,
  // Standalone source/section labels
  /^(AKTUALITET|POLITIKË|SPORT|BOTË|EKONOMI|TEKNOLOGJI|SHOWBIZ|LIFESTYLE|MAGAZINË|FOKUS|INVESTIGIM|VIDEO|MJEDIS)\s*$/,
  /^(aktualitet|politike|sport|bote|ekonomi)\s*[/|]\s*/i,
  // Date-only lines
  /^\d{1,2}[./]\d{1,2}[./]\d{2,4}\s*$/,
  /^\d{1,2}\s+(janar|shkurt|mars|prill|maj|qershor|korrik|gusht|shtator|tetor|nëntor|dhjetor)\s+\d{4}\s*$/i,
  // Navigation crumbs
  /^(home|kryefaqja|faqja\s*kryesore)\s*[>»›]/i,
  // "ekstrakt" or "abstract" labels
  /^"?ekstrakt"?\s*$/i,
  // Share/social counters
  /^\d+\s*(shares?|likes?|comments?|views?|shpërndarje|komente|shikime)\s*$/i,
  // Author bylines as standalone
  /^nga\s+[A-ZÇË][a-zçë]+\s+[A-ZÇË][a-zçë]+\s*$/,
  // Video/photo captions that are just labels
  /^(foto|video|galeri)\s*[:|-]\s*$/i,
  // Ad markers
  /^(\[ad\]|sponsored|reklam[eë]|advertisement)/i,
  // Empty quotes or brackets
  /^[""\u201c\u201d\s]*$/,
  /^\s*&amp;\s*$/,
];

// ─── Boilerplate Detection ───────────────────────────────────────────

const BOILERPLATE_PATTERNS = [
  /^©/,
  /^\s*burim/i,
  /^\s*lexo\s*më\s*shumë/i,
  /^\s*lexo\s*edhe/i,
  /^\s*lexo\s*gjithashtu/i,
  /^\s*shiko\s*edhe/i,
  /^\s*shiko\s*gjithashtu/i,
  /^\s*më\s*shumë\s*nga\s/i,
  /^\s*nuk\s*lejohet/i,
  /^\s*të\s*gjitha\s*të\s*drejtat/i,
  /^\s*shkruar\s*nga/i,
  /^\s*publikuar\s*më/i,
  /^\s*ndiqni?\s*në/i,
  /^\s*na\s*ndiqni/i,
  /^\s*share\s*this/i,
  /^\s*shpërnda/i,
  /^\s*tags?\s*:/i,
  /^\s*etiket/i,
  /^\s*foto\s*:/i,
  /^\s*video\s*:/i,
  /^\s*drejtor\s*i\s*p/i,
  /^\s*kontakt\s*:/i,
  /^\s*subscribe/i,
  /^\s*abonohu/i,
  /^\s*related\s*(articles|posts|news)/i,
  /^\s*lajme\s*të\s*ngjashme/i,
  /^\s*advertisement/i,
  /^\s*reklam/i,
  /^\s*sponsored/i,
  /^\s*click\s*here/i,
  /^\s*follow\s*us/i,
  /^\s*share\s*on/i,
  /^\s*loading/i,
  /^\s*cookie/i,
  /^\s*live\s*updates?\b/i,
  /^\s*breaking\s*:?\s*$/i,
];

const BOILERPLATE_ANYWHERE = [
  /versus\s+është\s+një\s+media/i,
  /vox\s*news\s+është/i,
  /në\s+interes\s+të\s+publikut/i,
  /raportimi\s+i\s+paanshëm/i,
  /ne\s+qëndrojmë\s+përballë/i,
  /nxjerrja\s+në\s+dritë/i,
  /ka\s+nisur\s+publikimet/i,
  /qëllimi\s+ynë\s+është/i,
  /për\s+t['']u\s+informuar\s+mbi/i,
  /ne\s+do\s+t['']a\s+ndjekim/i,
  /created\s+and\s+monetized/i,
  /monetized\s+by/i,
];

// ─── Promotional / Cross-article Teaser Detection ──────────────────
// Short paragraphs that promote or link to other articles on the source site.
// These typically appear at the end of articles as "related" teasers.

const PROMO_PATTERNS = [
  // "Lexo edhe:", "Lexo gjithashtu:", "Shiko edhe:", "Lajmi tjetër:" etc.
  /^\s*lexo\s+(edhe|gjithashtu|më\s+shumë)\s*[:–—-]/i,
  /^\s*shiko\s+(edhe|gjithashtu)\s*[:–—-]/i,
  /^\s*lajmi?\s+tjete?ër\s*[:–—-]/i,
  /^\s*artikull\s+i?\s*tjete?ër\s*[:–—-]/i,
  /^\s*më\s+shumë\s*[:–—-]/i,
  /^\s*m[eë]\s+shum[eë]\s+nga\s/i,
  // "LEXO EDHE" standalone (all caps)
  /^\s*LEXO\s+(EDHE|GJITHASHTU)\b/,
  // Patterns like "Ndërsa..." or "Kujtojmë se..." used as transitions to other articles
  /^\s*kujtojmë\s+se\s+/i,
  // Very short teaser-like paragraphs that reference other articles
  /^\s*shih\s+(edhe|gjithashtu)\s*[:–—-]/i,
];

/**
 * Detect if a paragraph is a promotional cross-article teaser.
 * These are short descriptions meant to promote/link to other articles.
 */
function isPromotionalTeaser(text: string, allParagraphs: string[], index: number): boolean {
  const trimmed = text.trim();

  // Direct pattern match
  if (PROMO_PATTERNS.some(p => p.test(trimmed))) return true;

  // Tag-like lines: all lowercase keywords with no sentence structure
  // e.g. "levizja shqiperia behet adriatik lapaj"
  if (isTagLine(trimmed)) return true;

  // Short paragraph at the very end that looks like a teaser
  // (typically 1-2 sentences, < 150 chars, at/near the end of the article)
  if (index >= allParagraphs.length - 3 && trimmed.length < 150 && trimmed.length > 10) {
    // Ends with a title-like fragment (no period, starts with capital)
    if (/^[A-ZÇËÀÁÂ]/.test(trimmed) && !/[.!?]$/.test(trimmed) && trimmed.length < 100) {
      return true;
    }
  }

  // Paragraph that is just a headline/title of another article (no sentence structure)
  // Usually short, capitalized, no period
  if (
    index >= allParagraphs.length - 2 &&
    trimmed.length < 120 &&
    trimmed.length > 15 &&
    /^[A-ZÇËÀÁÂ]/.test(trimmed) &&
    !/[.!?]$/.test(trimmed) &&
    !/[,;:]/.test(trimmed) &&
    (trimmed.match(/\s/g) || []).length >= 2 // at least 3 words
  ) {
    return true;
  }

  return false;
}

/**
 * Detect tag-like lines: all lowercase keywords with no punctuation or sentence structure.
 * e.g. "levizja shqiperia behet adriatik lapaj"
 */
function isTagLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > 200 || trimmed.length < 5) return false;
  // No sentence-ending punctuation, no commas/colons — just words
  if (/[.!?;:,]/.test(trimmed)) return false;
  // All lowercase (or very few uppercase)
  const upperCount = (trimmed.match(/[A-ZÇËÀÁÂÃÄÅÈÉÊÌÍÎÒÓÔÙÚÛ]/g) || []).length;
  if (upperCount > 2) return false;
  // At least 2 spaces (3+ words)
  const words = trimmed.split(/\s+/);
  if (words.length < 3) return false;
  // No word longer than ~20 chars (tags are short words)
  if (words.some(w => w.length > 25)) return false;
  return true;
}

// ─── Topic Coherence ────────────────────────────────────────────────
// Albanian stop words that appear in every article regardless of topic

const STOP_WORDS = new Set([
  "dhe", "nga", "per", "nje", "tek", "kjo", "ky", "ato", "ata", "eshte", "jane",
  "kane", "nuk", "por", "edhe", "qe", "se", "ne", "te", "me", "ka", "do",
  "pas", "para", "mbi", "nen", "ndaj", "sipas", "rreth", "gjate", "deri",
  "ishte", "ishin", "duke", "si", "apo", "ose", "i", "e", "u", "sa",
  "the", "of", "in", "to", "and", "for", "on", "at", "by", "with", "has",
  "sot", "dje", "neser", "tha", "tjeter", "kete", "cila", "cilet", "bere",
  "mund", "duhet", "pritet", "pasi", "nese", "keshtu", "atehere", "megjithate",
  "qeverise", "kryeministri", "ministri", "parlamenti", "shqiperi", "tirane",
]);

/**
 * Extract significant content words from text (skip stop words, short words).
 */
function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\sëçàáâãäåèéêìíîòóôùúû]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  return new Set(words);
}

/**
 * Check if a trailing paragraph is off-topic compared to the article's main content.
 * Compares keyword overlap between the paragraph and the article title + first paragraphs.
 * Returns true if the paragraph appears to be about a completely different topic.
 */
function isOffTopicTrailing(
  paragraph: string,
  title: string,
  articleParagraphs: string[],
  index: number
): boolean {
  // Only check paragraphs in the last ~30% of the article
  const threshold = Math.max(3, Math.floor(articleParagraphs.length * 0.7));
  if (index < threshold) return false;

  // Build keyword set from title + first few paragraphs (the "topic fingerprint")
  const topicSource = [title, ...articleParagraphs.slice(0, Math.min(5, articleParagraphs.length))].join(" ");
  const topicKeywords = extractKeywords(topicSource);
  if (topicKeywords.size < 3) return false; // Not enough context to judge

  // Get keywords from this paragraph
  const paraKeywords = extractKeywords(paragraph);
  if (paraKeywords.size < 3) return false; // Too short to judge reliably

  // Count how many of this paragraph's keywords appear in the topic
  let overlap = 0;
  const paraArr = Array.from(paraKeywords);
  for (let i = 0; i < paraArr.length; i++) {
    if (topicKeywords.has(paraArr[i])) overlap++;
  }

  const overlapRatio = overlap / paraKeywords.size;

  // If less than 15% keyword overlap, this paragraph is about something else entirely
  if (overlapRatio < 0.15) return true;

  return false;
}

// ─── HTML Stripping ──────────────────────────────────────────────────

function stripHtmlDeep(html: string): string {
  let text = html;

  // Remove entire script/style/noscript blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove CDATA blocks
  text = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");

  // Remove elements with known junk classes
  text = text.replace(/<[^>]*class="[^"]*(?:sidebar|widget|ad-|advert|social-share|related-posts|newsletter|cookie|popup|modal|nav|menu|breadcrumb|ticker|breaking)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, "");

  // Convert block elements to newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section|header|footer|figcaption)>/gi, "\n");
  text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = decodeEntities(text);

  // Remove CSS that leaked as text
  text = text.replace(/\.[\w-]+\s*\{[^}]*\}/g, "");
  text = text.replace(/@media[^{]*\{[^}]*\}/g, "");
  text = text.replace(/@import\s+[^;]+;/g, "");
  text = text.replace(/@charset\s+[^;]+;/g, "");
  text = text.replace(/@font-face\s*\{[^}]*\}/g, "");
  text = text.replace(/\{[^}]*(?:display|margin|padding|font-size|color|background|border|position|width|height|overflow|text-align|float|clear)\s*:[^}]*\}/g, "");

  // Remove JS that leaked as text
  text = text.replace(/(?:var|let|const|function)\s+\w+\s*[=({]/g, "");
  text = text.replace(/document\.\w+/g, "");
  text = text.replace(/window\.\w+/g, "");
  text = text.replace(/console\.\w+/g, "");
  text = text.replace(/addEventListener\([^)]*\)/g, "");
  text = text.replace(/querySelector\([^)]*\)/g, "");

  // Remove data URIs
  text = text.replace(/data:[a-z]+\/[a-z+]+;base64,[A-Za-z0-9+/=]+/g, "");

  // Remove social media URLs
  text = text.replace(/https?:\/\/(?:www\.)?(?:facebook|twitter|instagram|youtube|tiktok|whatsapp)\.[a-z]+[^\s]*/gi, "");

  // Clean up whitespace
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

// ─── Text Cleaning ───────────────────────────────────────────────────

function cleanTitle(title: string): string {
  let clean = title;
  for (const pattern of TITLE_CLEANUP) {
    clean = clean.replace(pattern, "");
  }
  clean = decodeEntities(clean);
  clean = clean.replace(/<[^>]*>/g, "");
  return clean.trim();
}

/**
 * Check if a line is junk (metadata, navigation, labels, etc.)
 */
function isJunkLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;

  // Check against junk patterns
  if (JUNK_LINE_PATTERNS.some(p => p.test(trimmed))) return true;

  // Too many UPPERCASE words in a short line = likely a nav/label
  if (trimmed.length < 80) {
    const words = trimmed.split(/\s+/);
    const upperWords = words.filter(w => w === w.toUpperCase() && w.length > 2);
    if (upperWords.length >= 3) return true;
  }

  // Line is mostly numbers/punctuation (timestamps, counters)
  const alphaChars = trimmed.replace(/[^a-zA-ZçëÇËëàáâãäåèéêìíîòóôùúûüÿñ]/g, "");
  if (alphaChars.length < trimmed.length * 0.3 && trimmed.length < 60) return true;

  return false;
}

function isBoilerplate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;

  const lower = trimmed.toLowerCase();

  // CSS/JS artifacts
  if (/^[.#@]\w/.test(trimmed)) return true;
  if (/^(var|let|const|function|import|export)\s/.test(trimmed)) return true;
  if (/[{}]/.test(trimmed) && trimmed.length < 100) return true;

  if (BOILERPLATE_PATTERNS.some(p => p.test(lower))) return true;
  if (BOILERPLATE_ANYWHERE.some(p => p.test(lower))) return true;

  if (/^https?:\/\//.test(trimmed)) return true;
  if (/^\d[\d\s./:,-]*$/.test(trimmed)) return true;

  return false;
}

function cleanBranding(text: string): string {
  let cleaned = text;
  for (const pattern of SOURCE_BRANDING) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove "Live Updates" and similar prefixes inline
  cleaned = cleaned.replace(/\blive\s*updates?\s*[:–—-]?\s*/gi, "");
  cleaned = cleaned.replace(/\bbreaking\s*news\s*[:–—-]?\s*/gi, "");
  cleaned = cleaned.replace(/\bcreated\s+and\s+monetized\s+by\s+\w+[^.!?\n]*/gi, "");
  cleaned = cleaned.replace(/\bmonetized\s+by\s+\w+[^.!?\n]*/gi, "");

  // Remove "SHBA ngrin" type live update fragments at start of text
  cleaned = cleaned.replace(/^SHBA\s+"[^"]*"\s*/g, "");

  // Clean residual punctuation artifacts
  cleaned = cleaned.replace(/\s*[-–—]\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/\.\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\(\s*\)/g, "");
  cleaned = cleaned.replace(/"\s*"/g, "");
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  return cleaned.trim();
}

// ─── Smart Typography ────────────────────────────────────────────────

function applyTypography(text: string): string {
  let t = text;

  // Smart quotes
  t = t.replace(/"([^"]+)"/g, "\u201c$1\u201d");
  t = t.replace(/'([^']+)'/g, "\u2018$1\u2019");

  // Proper em-dashes
  t = t.replace(/\s*--\s*/g, " \u2014 ");
  t = t.replace(/\s*-\s*-\s*/g, " \u2014 ");

  // Bold quoted speech
  t = t.replace(/(\u201c[^\u201d]{10,}\u201d)/g, "<strong>$1</strong>");

  // Bold percentages and big numbers
  t = t.replace(/(\d+(?:\.\d+)?%)/g, "<strong>$1</strong>");
  t = t.replace(/(\d{1,3}(?:\.\d{3})+(?:\s*(?:euro|dollarë|lekë|USD|EUR|ALL)))/gi, "<strong>$1</strong>");

  return t;
}

// ─── Paragraph Merging & Splitting ───────────────────────────────────

function mergeParagraphs(paragraphs: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const current = paragraphs[i];

    if (
      current.length < 60 &&
      !/[.!?:]\s*$/.test(current) &&
      i + 1 < paragraphs.length
    ) {
      const next = paragraphs[i + 1];
      merged.push(current + " " + next);
      i++;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function splitLongParagraphs(paragraphs: string[]): string[] {
  const result: string[] = [];

  for (const p of paragraphs) {
    if (p.length > 500) {
      const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
      if (sentences.length >= 2) {
        const mid = Math.ceil(sentences.length / 2);
        result.push(sentences.slice(0, mid).join(" ").trim());
        result.push(sentences.slice(mid).join(" ").trim());
      } else {
        result.push(p);
      }
    } else {
      result.push(p);
    }
  }

  return result;
}

// ─── Leading Junk Stripper ──────────────────────────────────────────

/**
 * Many scraped articles start with navigation/ticker junk before the
 * actual article begins. This finds where real content starts by
 * looking for the first paragraph that reads like actual article text.
 */
function stripLeadingJunk(paragraphs: string[]): string[] {
  let startIndex = 0;

  for (let i = 0; i < Math.min(paragraphs.length, 8); i++) {
    const p = paragraphs[i];
    const trimmed = p.trim();

    // If this paragraph looks like real article content, start here
    // Real content: has proper sentences, decent length, no junk markers
    const hasSentenceStructure = /[.!?]/.test(trimmed) && trimmed.length > 80;
    const startsWithCapital = /^[A-ZÇËÀÁÂÃÄÅÈÉÊÌÍÎÒÓÔÙÚÛ]/.test(trimmed);
    const looksLikeArticle = hasSentenceStructure && startsWithCapital;

    if (looksLikeArticle) {
      startIndex = i;
      break;
    }

    // If it's clearly junk, skip it
    if (isJunkLine(trimmed) || isBoilerplate(trimmed)) {
      startIndex = i + 1;
      continue;
    }

    // Short fragments at the start are likely junk
    if (trimmed.length < 40 && i < 3) {
      startIndex = i + 1;
      continue;
    }

    // If we got here, it might be real content
    break;
  }

  return paragraphs.slice(startIndex);
}

// ─── Main Rewriter ───────────────────────────────────────────────────

function cleanContent(rawHtml: string, title: string = ""): string {
  // Step 1: Completely strip ALL HTML to get pure text
  const plainText = stripHtmlDeep(rawHtml);

  if (!plainText || plainText.length < 20) return "";

  // Step 2: Split into paragraphs
  const rawParagraphs = plainText
    .split(/\n\n+/)
    .flatMap(block => {
      if (block.length > 300) return block.split(/\n/).map(p => p.trim());
      return [block.trim()];
    })
    .filter(p => p.length > 0);

  // Step 3: Strip leading junk (Live Updates, nav crumbs, tickers)
  const withoutLeadingJunk = stripLeadingJunk(rawParagraphs);

  // Step 3.5: Remove paragraphs that are the article title (avoids duplicate title)
  const titleLower = title.toLowerCase().trim();
  const withoutTitle = titleLower
    ? withoutLeadingJunk.filter(p => {
        const pLower = p.toLowerCase().trim();
        // Skip if paragraph is the title or very similar to it
        if (pLower === titleLower) return false;
        if (titleLower.startsWith(pLower) && pLower.length > titleLower.length * 0.7) return false;
        if (pLower.startsWith(titleLower) && titleLower.length > pLower.length * 0.7) return false;
        return true;
      })
    : withoutLeadingJunk;

  // Step 4: Clean each paragraph
  let cleaned: string[] = [];
  for (let idx = 0; idx < withoutTitle.length; idx++) {
    const para = withoutTitle[idx];
    if (isJunkLine(para)) continue;
    if (isBoilerplate(para)) continue;
    if (isPromotionalTeaser(para, withoutTitle, idx)) continue;

    const cleanedText = cleanBranding(para);

    if (cleanedText.length < 5) continue;
    if (/[{};]/.test(cleanedText) && cleanedText.length < 60) continue;
    if (/^\s*(px|em|rem|%|auto|none|inherit|flex|grid|block|inline)[\s;,]/.test(cleanedText)) continue;

    cleaned.push(cleanedText);
  }

  if (cleaned.length === 0) return "";

  // Step 4.5: Remove off-topic trailing paragraphs (cross-article content)
  // Work backwards: once we hit an off-topic paragraph, remove it and everything after
  for (let i = cleaned.length - 1; i >= Math.max(3, Math.floor(cleaned.length * 0.7)); i--) {
    if (isOffTopicTrailing(cleaned[i], title, cleaned, i)) {
      cleaned = cleaned.slice(0, i);
    } else {
      break; // Stop as soon as we find an on-topic paragraph
    }
  }

  if (cleaned.length === 0) return "";

  // Step 5: Smart paragraph restructuring
  cleaned = mergeParagraphs(cleaned);
  cleaned = splitLongParagraphs(cleaned);

  // Remove near-duplicate paragraphs
  const seen = new Set<string>();
  cleaned = cleaned.filter(p => {
    const key = p.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (cleaned.length === 0) return "";

  // Step 6: Apply typography
  cleaned = cleaned.map(p => applyTypography(p));

  // Step 7: Build professional HTML
  let html = "";

  // Lead paragraph — plain text, CSS handles larger font via :first-child
  html += `<p>${cleaned[0]}</p>`;

  for (let i = 1; i < cleaned.length; i++) {
    // Visual divider only for long articles (10+ paragraphs), every 7 paragraphs
    if (cleaned.length >= 10 && i > 2 && i % 7 === 0 && i < cleaned.length - 2) {
      html += `<hr />`;
    }

    html += `<p>${cleaned[i]}</p>`;
  }

  return html;
}

/**
 * Rewrites an article — deeply cleans HTML, strips all source branding,
 * removes junk like "Live Updates", CSS/JS artifacts, restructures
 * paragraphs, applies professional typography, and outputs clean HTML.
 */
export async function rewriteArticle(
  title: string,
  content: string
): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Processing: ${title.substring(0, 60)}...`);

  try {
    const cleanedTitle = cleanTitle(title);
    const cleanedContent = cleanContent(content, cleanedTitle);

    if (!cleanedContent) {
      console.warn(`[Rewriter] Content empty after cleaning: ${title.substring(0, 60)}`);
      return { title: cleanedTitle, content: "" };
    }

    console.log(`[Rewriter] Done: ${cleanedTitle.substring(0, 50)}... (${cleanedContent.length} chars)`);
    return {
      title: cleanedTitle,
      content: cleanedContent,
    };
  } catch (error) {
    console.error("[Rewriter] Error:", error);
    return { title, content };
  }
}
