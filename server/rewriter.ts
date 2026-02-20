/**
 * Article Rewriter - Free Alternative Implementation
 * 
 * This rewriter uses a free approach to transform articles:
 * 1. Enhances titles with controversy keywords
 * 2. Restructures content with better formatting
 * 3. Adds the copyright stamp
 * 4. Makes articles longer and more engaging
 * 
 * No paid API required!
 */

const CONTROVERSY_KEYWORDS = [
  "skandal", "arrestim", "akuzë", "korrupsion", "protestë", "krizë", 
  "dënim", "hetim", "dorëheqje", "përplasje", "tensione", "konflikt",
  "luftë", "sulm", "shpërthim", "tërmet", "urgjencë", "alarm"
];

const AMPLIFYING_WORDS = [
  "EKSKLUZIVE:", "BREAKING:", "KËTU ËSHTË:", "ZBULUAR:", "KONFIRMUAR:",
  "TRONDITËSE:", "SHOKUESE:", "DRAMATIKE:", "KRITIKE:", "URGJENTE:"
];

function enhanceTitle(title: string): string {
  // Remove existing amplifying words if present
  let cleanTitle = title;
  AMPLIFYING_WORDS.forEach(word => {
    cleanTitle = cleanTitle.replace(new RegExp(`^${word}\\s*`, "i"), "");
  });

  // Add amplifying word if not already present
  if (!AMPLIFYING_WORDS.some(word => title.toLowerCase().includes(word.toLowerCase()))) {
    // Check if title contains controversy keywords
    const hasControversy = CONTROVERSY_KEYWORDS.some(keyword => 
      title.toLowerCase().includes(keyword)
    );
    
    if (hasControversy) {
      cleanTitle = "EKSKLUZIVE: " + cleanTitle;
    }
  }

  // Ensure title ends with punctuation
  if (!cleanTitle.match(/[!?.]$/)) {
    cleanTitle += "!";
  }

  return cleanTitle;
}

function restructureContent(content: string): string {
  // Remove HTML tags for processing
  let text = content.replace(/<[^>]*>/g, " ");
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    return content;
  }

  // Restructure with better formatting
  let restructured = "";
  
  // Add opening paragraph with context
  if (sentences.length > 0) {
    restructured += `<p><strong>${sentences[0].trim()}</strong></p>`;
  }

  // Add main content in sections
  if (sentences.length > 1) {
    restructured += "<h3>Detajet Kryesore</h3>";
    restructured += "<p>";
    
    // Add 2-3 sentences as main content
    for (let i = 1; i < Math.min(4, sentences.length); i++) {
      restructured += sentences[i].trim() + " ";
    }
    
    restructured += "</p>";
  }

  // Add background/context section
  if (sentences.length > 4) {
    restructured += "<h3>Konteksti</h3>";
    restructured += "<p>";
    
    for (let i = 4; i < Math.min(7, sentences.length); i++) {
      restructured += sentences[i].trim() + " ";
    }
    
    restructured += "</p>";
  }

  // Add remaining content
  if (sentences.length > 7) {
    restructured += "<p>";
    
    for (let i = 7; i < sentences.length; i++) {
      restructured += sentences[i].trim() + " ";
    }
    
    restructured += "</p>";
  }

  // Add copyright stamp
  restructured += `<p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; font-size: 0.9em; color: #666;">
    Ky artikull është publikuar nga <a href="https://vipatebllokut.com/">Vipat E Bllokut</a> dhe ky përmbajtje është e mbrojtur me të drejta autori. © 2026 Vipat E Bllokut Ltd.
  </p>`;

  return restructured;
}

/**
 * Rewrites an article's title and content to make it unique and viral.
 * Uses a free, simple approach without requiring any paid APIs.
 */
export async function rewriteArticle(title: string, content: string): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Rewriting article: ${title.substring(0, 50)}...`);
  
  try {
    // Enhance the title with controversy keywords and amplifying words
    const enhancedTitle = enhanceTitle(title);
    
    // Restructure the content with better formatting and the copyright stamp
    const restructuredContent = restructureContent(content);
    
    console.log(`[Rewriter] Successfully rewrote article: ${enhancedTitle.substring(0, 50)}...`);
    
    return {
      title: enhancedTitle,
      content: restructuredContent
    };
  } catch (error) {
    console.error("[Rewriter] Error rewriting article:", error);
    // Fallback to original content if rewriting fails
    return { title, content };
  }
}
