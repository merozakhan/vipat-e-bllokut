/**
 * Article Rewriter - Enhanced Version with Longer Content
 * 
 * This rewriter uses a free approach to transform articles:
 * 1. Enhances titles with controversy keywords
 * 2. Significantly expands content with additional context and details
 * 3. Restructures content with professional formatting
 * 4. Adds the copyright stamp
 * 5. Makes articles much longer and more engaging
 * 
 * No paid API required!
 */

const CONTROVERSY_KEYWORDS = [
  "skandal", "arrestim", "akuzë", "korrupsion", "protestë", "krizë", 
  "dënim", "hetim", "dorëheqje", "përplasje", "tensione", "konflikt",
  "luftë", "sulm", "shpërthim", "tërmet", "urgjencë", "alarm", "tragjedi",
  "katastrofë", "emergjencë", "rrezik", "kërcënim", "vdekje", "plagë"
];

const AMPLIFYING_WORDS = [
  "EKSKLUZIVE:", "BREAKING:", "KËTU ËSHTË:", "ZBULUAR:", "KONFIRMUAR:",
  "TRONDITËSE:", "SHOKUESE:", "DRAMATIKE:", "KRITIKE:", "URGJENTE:",
  "NXITJE:", "PARALAJMËRIM:", "ALARMI:", "SKANDALI:"
];

const EXPANSION_PHRASES = [
  "Sipas burimeve të besueshme,",
  "Në zhvillimet më të fundit,",
  "Ekspertët thonë se",
  "Sipas analistëve,",
  "Ky incident është pjesë e një serie më të gjerë",
  "Për më tepër,",
  "Në kontekstin e këtyre ngjarjeve,",
  "Është e rëndësishme të theksohet se",
  "Dëshira për të kuptuar këtë situatë kërkon",
  "Ndërkohë, në skenën politike,",
  "Në aspektin ekonomik,",
  "Nga perspektiva shoqërore,",
  "Sipas të dhënave të fundit,",
  "Në raportet më të reja,",
  "Duhet të përmendet se",
  "Në këtë kontekst,",
  "Është vërejtur se",
  "Sipas deklaratave zyrtare,",
  "Në përgjigje të këtij zhvillimi,",
  "Nuk duhet të harrojmë se"
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

function expandContent(content: string): string {
  // Remove HTML tags for processing
  let text = content.replace(/<[^>]*>/g, " ");
  
  // Clean up excessive whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  if (sentences.length === 0) {
    return content;
  }

  // Expand content significantly
  let expanded = "";
  
  // Opening paragraph with strong lead
  if (sentences.length > 0) {
    expanded += `<p><strong>${sentences[0].trim()}</strong></p>`;
  }

  // Add context paragraph
  expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} ${sentences[0].trim().toLowerCase()} ka ndodhur në një kohë kur situata në vend mbetet e tensionuar. Ky zhvillim ka nxitur reagime të menjëhershme nga të ndryshëve.</p>`;

  // Main content section with multiple paragraphs
  if (sentences.length > 1) {
    expanded += "<h3>Detajet Kryesore të Ngjarjes</h3>";
    
    // First paragraph of details
    expanded += "<p>";
    for (let i = 1; i < Math.min(3, sentences.length); i++) {
      expanded += sentences[i].trim() + " ";
    }
    expanded += "</p>";

    // Add analysis paragraph
    expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} ky incident përfaqëson një pikë të rëndësishme në zhvillimet e fundit. Shumë analistë besojnë se kjo do të ketë pasoja të rëndësishme në muajt në ardhje.</p>`;
  }

  // Background/context section
  if (sentences.length > 4) {
    expanded += "<h3>Konteksti Historik</h3>";
    expanded += "<p>";
    
    for (let i = 3; i < Math.min(6, sentences.length); i++) {
      expanded += sentences[i].trim() + " ";
    }
    
    expanded += "</p>";

    // Add contextual analysis
    expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} këto ngjarje duhet të kuptohen në kontekstin e zhvillimeve më të gjerë që po ndodhin në shoqërinë tonë. Ekspertët thonë se ky incident nuk është i izoluar dhe lidhet me probleme më të thella.</p>`;
  }

  // Implications section
  if (sentences.length > 7) {
    expanded += "<h3>Implikimet dhe Pasojat</h3>";
    expanded += "<p>";
    
    for (let i = 6; i < Math.min(9, sentences.length); i++) {
      expanded += sentences[i].trim() + " ";
    }
    
    expanded += "</p>";

    // Add implications analysis
    expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} ky zhvillim mund të ketë pasoja të mëdha për të ardhmen. Duhet të vëzhgojmë me kujdes se si do të zhvillohet situata në ditët dhe javët në ardhje.</p>`;
  }

  // Additional commentary section
  if (sentences.length > 10) {
    expanded += "<h3>Reagimet dhe Komentaret</h3>";
    expanded += "<p>";
    
    for (let i = 9; i < Math.min(12, sentences.length); i++) {
      expanded += sentences[i].trim() + " ";
    }
    
    expanded += "</p>";
  }

  // Remaining content
  if (sentences.length > 12) {
    expanded += "<p>";
    
    for (let i = 12; i < sentences.length; i++) {
      expanded += sentences[i].trim() + " ";
    }
    
    expanded += "</p>";
  }

  // Add expert opinion section
  expanded += `<h3>Perspektiva e Ekspertëve</h3>`;
  expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} sipas ekspertëve të fushës, ky incident ka rëndësi të madhe për të ardhmen e shoqërisë tonë. Ata sugjerojnë se nevojiten masa të menjëhershme për të adresuar këtë çështje dhe për të parandaluar zhvillimet e ngjashme në të ardhmen.</p>`;

  // Conclusion section
  expanded += `<h3>Përfundim</h3>`;
  expanded += `<p>${EXPANSION_PHRASES[Math.floor(Math.random() * EXPANSION_PHRASES.length)]} ky incident mbetet një nga më të rëndësishmit në kohën e fundit. Ndërsa situata vazhdon të zhvillohet, duhet të qëndrojmë të informuar dhe të vëmendshëm ndaj zhvillimeve të ardhshme. Vipat E Bllokut do të vazhdojë të ndjekë këtë histori dhe do të sjellë përditësimet më të fundit.</p>`;

  // Add copyright stamp
  expanded += `<p style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; font-style: italic; font-size: 0.9em; color: #666;">
    Ky artikull është publikuar nga <a href="https://vipatebllokut.com/">Vipat E Bllokut</a> dhe ky përmbajtje është e mbrojtur me të drejta autori. © 2026 Vipat E Bllokut Ltd.
  </p>`;

  return expanded;
}

/**
 * Rewrites an article's title and content to make it unique and viral.
 * Uses a free, simple approach without requiring any paid APIs.
 * Now generates significantly longer content!
 */
export async function rewriteArticle(title: string, content: string): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Rewriting article: ${title.substring(0, 50)}...`);
  
  try {
    // Enhance the title with controversy keywords and amplifying words
    const enhancedTitle = enhanceTitle(title);
    
    // Expand the content significantly with additional context and analysis
    const expandedContent = expandContent(content);
    
    console.log(`[Rewriter] Successfully rewrote article: ${enhancedTitle.substring(0, 50)}...`);
    
    return {
      title: enhancedTitle,
      content: expandedContent
    };
  } catch (error) {
    console.error("[Rewriter] Error rewriting article:", error);
    // Fallback to original content if rewriting fails
    return { title, content };
  }
}
