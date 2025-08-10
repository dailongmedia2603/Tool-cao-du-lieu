// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to convert date to Unix timestamp
const toUnixTimestamp = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  return Math.floor(new Date(dateStr).getTime() / 1000);
};

// Helper to find keywords in content
const findKeywords = (content: string, keywords: string[]): string[] => {
    const found: string[] = [];
    if (!content) return found;
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
        if (lowerContent.includes(keyword.toLowerCase())) {
            found.push(keyword);
        }
    }
    return found;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { campaign_id } = await req.json();
    if (!campaign_id) {
      throw new Error("Campaign ID is required.");
    }

    // Use the SERVICE_ROLE_KEY for admin-level access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch API keys and campaign details in parallel
    const [apiKeyRes, campaignRes] = await Promise.all([
        supabaseAdmin.from('luu_api_key').select('*').eq('id', 1).single(),
        supabaseAdmin.from('campaigns').select('*').eq('id', campaign_id).single()
    ]);

    if (apiKeyRes.error) throw new Error(`Failed to fetch API keys: ${apiKeyRes.error.message}`);
    if (!apiKeyRes.data) throw new Error("API key configuration not found.");
    const apiKeys = apiKeyRes.data;

    if (campaignRes.error) throw new Error(`Failed to fetch campaign: ${campaignRes.error.message}`);
    if (!campaignRes.data) throw new Error("Campaign not found.");
    const campaign = campaignRes.data;

    if (campaign.type !== 'Facebook') {
        return new Response(JSON.stringify({ message: "Scan is only for Facebook campaigns." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const {
        facebook_api_url,
        facebook_api_token,
        gemini_api_key,
        gemini_model
    } = apiKeys;

    if (!facebook_api_url || !facebook_api_token) {
        throw new Error("Facebook API URL or Token is not configured in settings.");
    }

    const keywords = campaign.keywords ? campaign.keywords.split('\n').map(k => k.trim()).filter(k => k) : [];
    const allPostsData = [];

    // 2. Fetch data from Facebook API for each group
    for (const groupId of campaign.sources) {
        const since = toUnixTimestamp(campaign.scan_start_date);
        const until = Math.floor(Date.now() / 1000);
        
        let url = `${facebook_api_url.replace(/\/$/, '')}/${groupId}/feed?fields=message,created_time,id,permalink_url,from&access_token=${facebook_api_token}`;
        if (since) {
            url += `&since=${since}`;
        }
        url += `&until=${until}`;

        const fbResponse = await fetch(url);
        if (!fbResponse.ok) {
            console.error(`Error fetching data for group ${groupId}: ${await fbResponse.text()}`);
            continue; // Skip to next group on error
        }
        const fbData = await fbResponse.json();

        if (fbData.data) {
            allPostsData.push(...fbData.data.map((post: any) => ({ ...post, campaign_id: campaign.id })));
        }
    }

    // 3. Filter posts by keywords
    let filteredPosts = [];
    if (keywords.length > 0) {
        for (const post of allPostsData) {
            const foundKeywords = findKeywords(post.message, keywords);
            if (foundKeywords.length > 0) {
                filteredPosts.push({ ...post, keywords_found: foundKeywords });
            }
        }
    } else {
        // If no keywords, process all posts
        filteredPosts = allPostsData.map(post => ({ ...post, keywords_found: [] }));
    }

    // 4. Process with AI if enabled
    let finalResults = [];
    if (campaign.ai_filter_enabled && campaign.ai_prompt && gemini_api_key && gemini_model) {
        const genAI = new GoogleGenerativeAI(gemini_api_key);
        const model = genAI.getGenerativeModel({ model: gemini_model });

        for (const post of filteredPosts) {
            const prompt = `
                ${campaign.ai_prompt}
                
                Analyze the following post content:
                "${post.message}"

                Based on my request, provide a JSON response with two keys:
                1. "evaluation": (string) Your evaluation based on my request.
                2. "sentiment": (string) The sentiment of the post, which must be one of: 'positive', 'negative', or 'neutral'.
                
                Your response must be a valid JSON object only.
            `;

            try {
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const aiResult = JSON.parse(responseText);
                
                finalResults.push({
                    campaign_id: campaign.id,
                    content: post.message,
                    posted_at: post.created_time,
                    source_url: post.permalink_url,
                    keywords_found: post.keywords_found,
                    ai_evaluation: aiResult.evaluation,
                    sentiment: aiResult.sentiment,
                });

            } catch (e) {
                console.error("Error processing with AI for post:", post.id, e);
                // Add post without AI data if AI fails
                finalResults.push({
                    campaign_id: campaign.id,
                    content: post.message,
                    posted_at: post.created_time,
                    source_url: post.permalink_url,
                    keywords_found: post.keywords_found,
                    ai_evaluation: 'AI processing failed.',
                    sentiment: null,
                });
            }
        }
    } else {
        // If AI is not enabled, just format the data
        finalResults = filteredPosts.map(post => ({
            campaign_id: campaign.id,
            content: post.message,
            posted_at: post.created_time,
            source_url: post.permalink_url,
            keywords_found: post.keywords_found,
            ai_evaluation: null,
            sentiment: null,
        }));
    }

    // 5. Insert results into the database
    if (finalResults.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .from('Bao_cao_Facebook')
            .insert(finalResults);

        if (insertError) {
            throw new Error(`Failed to insert report data: ${insertError.message}`);
        }
    }

    return new Response(JSON.stringify({ success: true, message: `Scan complete. Found and processed ${finalResults.length} posts.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})