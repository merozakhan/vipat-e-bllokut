import OpenAI from "openai";

const client = new OpenAI();

/**
 * Rewrites an article's title and content using an LLM to make it unique and viral.
 * The output is always in Albanian.
 */
export async function rewriteArticle(title: string, content: string): Promise<{ title: string; content: string }> {
  console.log(`[Rewriter] Rewriting article: ${title.substring(0, 50)}...`);
  
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional Albanian news editor for "Vipat E Bllokut". 
Your task is to rewrite the provided news article to make it unique, engaging, and viral.
Rules:
1. The output MUST be in Albanian.
2. The title should be catchy and include controversy keywords if appropriate (e.g., skandal, arrestim, akuzë, korrupsion, protestë).
3. The content should be well-structured with HTML tags like <p>, <h3>, and <strong>.
4. Maintain the original facts but change the wording completely to avoid plagiarism.
5. Aim for a premium, professional yet "viral" tone.
6. Return the result in JSON format with "title" and "content" fields.`
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (result.title && result.content) {
      console.log(`[Rewriter] Successfully rewrote article: ${result.title.substring(0, 50)}...`);
      return {
        title: result.title,
        content: result.content
      };
    }
    
    throw new Error("Invalid response format from LLM");
  } catch (error) {
    console.error("[Rewriter] Failed to rewrite article:", error);
    // Fallback to original content if rewriting fails
    return { title, content };
  }
}
