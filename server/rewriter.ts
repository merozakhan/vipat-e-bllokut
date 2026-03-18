/**
 * Article Rewriter - Clean Version
 *
 * Cleans and reformats scraped articles:
 * 1. Strips source branding (JOQ, media names, etc.)
 * 2. Formats content with proper HTML paragraphs
 * 3. Keeps the original article text intact - no fake filler
 * 4. Adds copyright stamp
 */

// Source branding patterns to strip from content
const SOURCE_BRANDING = [
  /joq\s*albania/gi,
  /joq\s*news/gi,
  /\bjoq\b/gi,
  /jeta\s*osh?\s*qef/gi,
  /lexo\s*më\s*shumë[^.!?\n]*/gi,
  /burim[ieë]?:\s*[^.!?\n<]*[.!?]?/gi,
  /shkruar\s*nga\s*[A-Z][a-z]+\s*[A-Z][a-z]*/gi,
  /publikuar\s*më\s*\d{1,2}\.\d{1,2}\.\d{4}/gi,
  /©\s*\d{4}\s*[^<\n]*/gi,
  /të\s*gjitha\s*të\s*drejtat\s*e\s*rezervuara/gi,
  /\bnuk\s*lejohet\s*riprodhimi\b/gi,
  /\bpërdorimi\s*i\s*pa\s*autorizuar\b/gi,
];

// Patterns to remove from titles
const TITLE_CLEANUP = [
  /\s*[-–—|]\s*JOQ\s*Albania\s*/gi,
  /\s*[-–—|]\s*JOQ\s*/gi,
  /\s*[-–—|]\s*Jeta\s*Osh?\s*Qef\s*/gi,
];

function cleanTitle(title: string): string {
  let clean = title;

  // Remove source branding from title
  for (const pattern of TITLE_CLEANUP) {
    clean = clean.replace(pattern, "");
  }

  // Decode HTML entities
  clean = clean
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));

  return clean.trim();
}

function cleanContent(content: string): string {
  // Strip HTML tags for processing
  let text = content.replace(/<[^>]*>/g, " ");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Remove source branding
  for (const pattern of SOURCE_BRANDING) {
    text = text.replace(pattern, "");
  }

  // Clean up residual punctuation artifacts (e.g. "- ." left after branding removal)
  text = text.replace(/\s*[-–—]\s*\.\s*/g, ". ");
  text = text.replace(/\.\s*\.\s*/g, ". ");

  // Clean up whitespace again after removals
  text = text.replace(/\s+/g, " ").trim();

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  if (sentences.length === 0) {
    return `<p>${text}</p>`;
  }

  // Build clean HTML with proper paragraph breaks
  let html = "";

  // First sentence bold as lead
  if (sentences.length > 0) {
    html += `<p><strong>${sentences[0]!.trim()}</strong></p>`;
  }

  // Group remaining sentences into paragraphs of 2-3 sentences
  let paragraph = "";
  for (let i = 1; i < sentences.length; i++) {
    const sentence = sentences[i]!.trim();
    if (!sentence) continue;

    paragraph += sentence + " ";

    // Break into new paragraph every 2-3 sentences
    if ((i % 3 === 0 || i === sentences.length - 1) && paragraph.trim()) {
      html += `<p>${paragraph.trim()}</p>`;
      paragraph = "";
    }
  }

  // Any remaining text
  if (paragraph.trim()) {
    html += `<p>${paragraph.trim()}</p>`;
  }

  // Add copyright stamp
  html += `<p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; font-size: 0.9em; color: #666;">
    Ky artikull është publikuar nga <a href="https://vipatebllokut.com/">Vipat E Bllokut</a>. © 2026 Vipat E Bllokut.
  </p>`;

  return html;
}

/**
 * Rewrites an article - cleans branding, formats content properly.
 * No fake filler, no generic phrases. Just clean formatting.
 */
export async function rewriteArticle(title: string, content: string): Promise<{ title: string; content: string }> {
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
