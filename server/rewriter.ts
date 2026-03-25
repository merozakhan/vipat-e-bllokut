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

// ─── Fallback Regex Cleaner (when AI is unavailable) ────────────────

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

  // Basic cleaning: remove very short lines, duplicates, obvious junk
  const titleLower = title.toLowerCase().trim();
  const seen = new Set<string>();
  const cleaned = paragraphs.filter(p => {
    const trimmed = p.trim();
    if (trimmed.length < 15) return false;

    // Skip title duplicates
    const pLower = trimmed.toLowerCase();
    if (pLower === titleLower) return false;

    // Skip duplicates
    const key = trimmed.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);

    // Skip obvious junk
    if (/^[.#@{}]/.test(trimmed)) return false;
    if (/^\s*(px|em|rem|%|auto|none|inherit|flex|grid|block|inline)[\s;,]/.test(trimmed)) return false;
    if (/[{};]/.test(trimmed) && trimmed.length < 60) return false;
    if (/^https?:\/\//.test(trimmed)) return false;
    if (/^\d[\d\s./:,-]*$/.test(trimmed)) return false;
    if (/^\s*©/.test(trimmed)) return false;
    if (/lexo\s*(edhe|më\s*shumë|gjithashtu)/i.test(trimmed)) return false;
    if (/na\s*ndiqni/i.test(trimmed)) return false;

    return true;
  });

  if (cleaned.length === 0) return "";

  let html = "";
  for (let i = 0; i < cleaned.length; i++) {
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
