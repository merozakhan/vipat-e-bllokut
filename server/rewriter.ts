/**
 * Article Rewriter - Smart Version
 *
 * Preserves 60%+ of the original article text and structure.
 * Only cleans source branding and reformats HTML minimally.
 * No fake filler, no AI expansion, no generic phrases.
 */

// Source branding patterns to strip from content
const SOURCE_BRANDING = [
  /joq\s*albania/gi,
  /joq\s*news/gi,
  /\bjoq\b/gi,
  /jeta\s*osh?\s*qef/gi,
  /\bvox\s*news\b/gi,
  /\bvoxnews\b/gi,
  /\bredaksia\s*vox\b/gi,
  /\bversus\.al\b/gi,
  /\bversus\s*news\b/gi,
  /\bredaksia\s*versus\b/gi,
  /shkruar\s*nga\s*redaksia\s*vox/gi,
  /shkruar\s*nga\s*redaksia\s*versus/gi,
  /lexo\s*më\s*shumë[^.!?\n]*/gi,
  /burim[ieë]?:\s*[^.!?\n<]*[.!?]?/gi,
  /shkruar\s*nga\s*[A-Z][a-z]+\s*[A-Z][a-z]*/gi,
  /publikuar\s*më\s*\d{1,2}\.\d{1,2}\.\d{4}/gi,
  /©\s*\d{4}\s*[^<\n]*/gi,
  /të\s*gjitha\s*të\s*drejtat\s*e\s*rezervuara/gi,
  /\bnuk\s*lejohet\s*riprodhimi\b/gi,
  /\bpërdorimi\s*i\s*pa\s*autorizuar\b/gi,
  /\bnga\s*redaksia\b/gi,
  /\bredaksia\s*joq\b/gi,
  /\bvec\s*e\s*jona\b/gi,
];

// Patterns to remove from titles
const TITLE_CLEANUP = [
  /\s*[-–—|]\s*JOQ\s*Albania\s*/gi,
  /\s*[-–—|]\s*JOQ\s*News\s*/gi,
  /\s*[-–—|]\s*JOQ\s*/gi,
  /\s*[-–—|]\s*Jeta\s*Osh?\s*Qef\s*/gi,
  /\s*[-–—|]\s*Vec\s*[eë]\s*Jona\s*/gi,
  /\s*[-–—|]\s*VOX\s*News\s*/gi,
  /\s*[-–—|]\s*VoxNews\s*/gi,
  /\s*[-–—|]\s*Versus\s*/gi,
];

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
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
}

function cleanTitle(title: string): string {
  let clean = title;

  for (const pattern of TITLE_CLEANUP) {
    clean = clean.replace(pattern, "");
  }

  clean = decodeEntities(clean);
  return clean.trim();
}

/**
 * Strips branding from a single paragraph's text, preserving the rest.
 */
function cleanParagraphText(text: string): string {
  let cleaned = text;

  for (const pattern of SOURCE_BRANDING) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean residual punctuation artifacts
  cleaned = cleaned.replace(/\s*[-–—]\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/\.\s*\.\s*/g, ". ");
  cleaned = cleaned.replace(/,\s*,/g, ",");
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
}

/**
 * Checks if a paragraph is purely boilerplate (copyright, CTA, etc.)
 * and should be dropped entirely.
 */
function isBoilerplateParagraph(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (lower.length < 5) return true;

  const boilerplate = [
    /^©/,
    /^\s*burim/i,
    /^\s*lexo\s*më\s*shumë/i,
    /^\s*nuk\s*lejohet/i,
    /^\s*të\s*gjitha\s*të\s*drejtat/i,
    /^\s*shkruar\s*nga/i,
    /^\s*publikuar\s*më/i,
    /^\s*ndiqni?\s*në\s*/i,
    /^\s*na\s*ndiqni/i,
    /^\s*share\s*this/i,
    /^\s*shpërnda/i,
    /^\s*tags?\s*:/i,
    /^\s*etiket/i,
    /^\s*foto\s*:\s*/i,
    /^\s*video\s*:\s*/i,
  ];

  return boilerplate.some((p) => p.test(lower));
}

/**
 * Preserves original paragraph structure from HTML.
 * Strips branding from each paragraph, drops boilerplate paragraphs,
 * keeps everything else intact.
 */
function cleanContent(content: string): string {
  // Extract paragraphs from the original HTML structure
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = paragraphRegex.exec(content)) !== null) {
    matches.push(m);
  }

  let paragraphs: string[];

  if (matches.length > 0) {
    // Preserve original paragraph structure
    paragraphs = matches
      .map((m) => {
        // Strip inner HTML tags but keep text
        const text = m[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]*>/g, "")
          .trim();
        return decodeEntities(text);
      })
      .filter((p) => p.length > 0);
  } else {
    // No <p> tags - fall back to splitting on double newlines or <br>
    const text = content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();
    paragraphs = decodeEntities(text)
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }

  // Clean branding from each paragraph, drop boilerplate ones
  const cleaned: string[] = [];
  for (const para of paragraphs) {
    // Skip boilerplate paragraphs entirely
    if (isBoilerplateParagraph(para)) continue;

    const cleanedText = cleanParagraphText(para);

    // After cleaning, skip if paragraph became too short (was mostly branding)
    if (cleanedText.length < 10) continue;

    cleaned.push(cleanedText);
  }

  if (cleaned.length === 0) {
    return "";
  }

  // Build HTML preserving original paragraph count and structure
  let html = "";

  // First paragraph gets bold lead treatment
  html += `<p><strong>${cleaned[0]}</strong></p>`;

  // Remaining paragraphs stay as-is (original structure preserved)
  for (let i = 1; i < cleaned.length; i++) {
    html += `<p>${cleaned[i]}</p>`;
  }

  // Copyright stamp
  html += `<p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; font-size: 0.9em; color: #666;">Ky artikull është publikuar nga <a href="https://vipatebllokut.com/">Vipat E Bllokut</a>. © 2026 Vipat E Bllokut.</p>`;

  return html;
}

/**
 * Rewrites an article - strips source branding, preserves original text
 * and paragraph structure. No fake filler, no AI expansion.
 */
export async function rewriteArticle(
  title: string,
  content: string
): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Cleaning article: ${title.substring(0, 50)}...`);

  try {
    const cleanedTitle = cleanTitle(title);
    const cleanedContent = cleanContent(content);

    return {
      title: cleanedTitle,
      content: cleanedContent,
    };
  } catch (error) {
    console.error("[Rewriter] Error cleaning article:", error);
    return { title, content };
  }
}
