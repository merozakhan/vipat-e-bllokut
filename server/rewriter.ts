/**
 * Article Rewriter — Deep HTML Cleaner & Formatter
 *
 * Aggressively strips ALL HTML artifacts, CSS, JS, inline styles,
 * data attributes, and source branding. Extracts pure text, then
 * rebuilds clean, well-structured HTML paragraphs.
 *
 * Pipeline: raw HTML → strip everything → extract sentences →
 *           remove boilerplate → clean branding → rebuild HTML
 */

// ─── Source Branding Patterns ────────────────────────────────────────

const SOURCE_BRANDING = [
  // Source names
  /\bjoq\s*albania\b/gi,
  /\bjoq\s*news\b/gi,
  /\bjeta\s*osh?\s*qef\b/gi,
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
  /\bredaksia\s*(vox|versus|joq)\b/gi,
  /\bnga\s*redaksia\b/gi,
  /\bshkruar\s*nga\s*redaksia[^.!?\n]*/gi,
  /\bshkruar\s*nga\s*[A-ZÇË][a-zçë]+\s*[A-ZÇË][a-zçë]*/gi,
  // Read more / CTA
  /lexo\s*më\s*shumë[^.!?\n]*/gi,
  /lexo\s*artikullin\s*e\s*plotë[^.!?\n]*/gi,
  /kliko\s*këtu[^.!?\n]*/gi,
  /vazhdo\s*leximin[^.!?\n]*/gi,
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
];

const TITLE_CLEANUP = [
  /\s*[-–—|]\s*JOQ\s*Albania\s*/gi,
  /\s*[-–—|]\s*JOQ\s*News\s*/gi,
  /\s*[-–—|]\s*JOQ\s*/gi,
  /\s*[-–—|]\s*Jeta\s*Osh?\s*Qef\s*/gi,
  /\s*[-–—|]\s*Vec\s*[eë]\s*Jona\s*/gi,
  /\s*[-–—|]\s*VOX\s*News\s*/gi,
  /\s*[-–—|]\s*VoxNews\s*/gi,
  /\s*[-–—|]\s*Versus\s*/gi,
  /\s*[-–—|]\s*Koha\.net\s*/gi,
  /\s*[-–—|]\s*Telegrafi\s*/gi,
  /\s*[-–—|]\s*Albeu\s*/gi,
  /\s*[-–—|]\s*Reporter\.al\s*/gi,
];

// ─── Boilerplate Detection ───────────────────────────────────────────

const BOILERPLATE_PATTERNS = [
  /^©/,
  /^\s*burim/i,
  /^\s*lexo\s*më\s*shumë/i,
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
];

const BOILERPLATE_ANYWHERE = [
  /versus\s+është\s+një\s+media/i,
  /vox\s*news\s+është/i,
  /joq\s+është/i,
  /në\s+interes\s+të\s+publikut/i,
  /raportimi\s+i\s+paanshëm/i,
  /ne\s+qëndrojmë\s+përballë/i,
  /nxjerrja\s+në\s+dritë/i,
  /ka\s+nisur\s+publikimet/i,
  /qëllimi\s+ynë\s+është/i,
  /për\s+t['']u\s+informuar\s+mbi/i,
  /ne\s+do\s+t['']a\s+ndjekim/i,
];

// ─── HTML Stripping ──────────────────────────────────────────────────

/**
 * Aggressively strip ALL HTML to get pure text.
 * Handles nested tags, inline styles, scripts, CSS, comments, etc.
 */
function stripHtmlDeep(html: string): string {
  let text = html;

  // Remove entire script/style/noscript blocks
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  text = text.replace(/<svg[\s\S]*?<\/svg>/gi, "");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // Remove CDATA blocks
  text = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");

  // Convert block elements to newlines (paragraphs, divs, headings, etc.)
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|article|section|header|footer|figcaption)>/gi, "\n");
  text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = decodeEntities(text);

  // Remove CSS that leaked as text (common scraping artifact)
  text = text.replace(/\.[\w-]+\s*\{[^}]*\}/g, ""); // .class { ... }
  text = text.replace(/@media[^{]*\{[^}]*\}/g, "");  // @media { ... }
  text = text.replace(/@import\s+[^;]+;/g, "");       // @import ...;
  text = text.replace(/@charset\s+[^;]+;/g, "");      // @charset ...;
  text = text.replace(/@font-face\s*\{[^}]*\}/g, ""); // @font-face { ... }
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

  // Remove URLs that are clearly not part of article text
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
  // Remove any leftover HTML tags in title
  clean = clean.replace(/<[^>]*>/g, "");
  return clean.trim();
}

function isBoilerplate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 5) return true;

  const lower = trimmed.toLowerCase();

  // Too short to be a real paragraph
  if (trimmed.length < 15 && !/[.!?]/.test(trimmed)) return true;

  // Looks like a CSS class or JS variable
  if (/^[.#@]\w/.test(trimmed)) return true;
  if (/^(var|let|const|function|import|export)\s/.test(trimmed)) return true;
  if (/[{}]/.test(trimmed) && trimmed.length < 100) return true;

  // Known boilerplate starts
  if (BOILERPLATE_PATTERNS.some(p => p.test(lower))) return true;

  // Known boilerplate anywhere
  if (BOILERPLATE_ANYWHERE.some(p => p.test(lower))) return true;

  // Looks like a URL list or navigation
  if (/^https?:\/\//.test(trimmed)) return true;

  // Just numbers or dates
  if (/^\d[\d\s./:,-]*$/.test(trimmed)) return true;

  return false;
}

function cleanBranding(text: string): string {
  let cleaned = text;
  for (const pattern of SOURCE_BRANDING) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean residual punctuation artifacts from removals
  cleaned = cleaned.replace(/\s*[-–—]\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/\.\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\(\s*\)/g, "");      // empty parentheses
  cleaned = cleaned.replace(/"\s*"/g, "");          // empty quotes
  cleaned = cleaned.replace(/\s{2,}/g, " ");

  return cleaned.trim();
}

// ─── Main Rewriter ───────────────────────────────────────────────────

function cleanContent(rawHtml: string): string {
  // Step 1: Completely strip ALL HTML to get pure text
  const plainText = stripHtmlDeep(rawHtml);

  if (!plainText || plainText.length < 30) return "";

  // Step 2: Split into paragraphs
  const rawParagraphs = plainText
    .split(/\n\n+|\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // Step 3: Clean each paragraph
  const cleaned: string[] = [];
  for (const para of rawParagraphs) {
    // Skip boilerplate
    if (isBoilerplate(para)) continue;

    // Strip source branding
    const cleanedText = cleanBranding(para);

    // Skip if too short after cleaning
    if (cleanedText.length < 15) continue;

    // Skip if it looks like code/CSS/JS after cleaning
    if (/[{};]/.test(cleanedText) && cleanedText.length < 80) continue;
    if (/^\s*(px|em|rem|%|auto|none|inherit|flex|grid|block|inline)[\s;,]/.test(cleanedText)) continue;

    cleaned.push(cleanedText);
  }

  if (cleaned.length === 0) return "";

  // Step 4: Build clean HTML
  let html = "";

  // First paragraph gets bold lead
  html += `<p><strong>${cleaned[0]}</strong></p>`;

  // Remaining paragraphs
  for (let i = 1; i < cleaned.length; i++) {
    html += `<p>${cleaned[i]}</p>`;
  }

  return html;
}

/**
 * Rewrites an article — deeply cleans HTML, strips all source branding,
 * removes CSS/JS artifacts, and outputs clean formatted HTML paragraphs.
 */
export async function rewriteArticle(
  title: string,
  content: string
): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Cleaning: ${title.substring(0, 60)}...`);

  try {
    const cleanedTitle = cleanTitle(title);
    const cleanedContent = cleanContent(content);

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
