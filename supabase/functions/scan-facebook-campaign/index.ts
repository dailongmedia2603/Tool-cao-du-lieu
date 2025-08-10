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

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  let campaign_id_from_req = null;

  const logScan = async (campaign_id: string, status: string, message: string, details: any = null) => {
    if (!campaign_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        status,
        message,
        details
    });
  };

  try {
    const { campaign_id } = await req.json();
    campaign_id_from_req = campaign_id;

    if (!campaign_id) {
      throw new Error("Cần có ID chiến dịch.");
    }

    const [apiKeyRes, campaignRes] = await Promise.all([
        supabaseAdmin.from('luu_api_key').select('*').eq('id', 1).single(),
        supabaseAdmin.from('danh_sach_chien_dich').select('*').eq('id', campaign_id).single()
    ]);

    if (apiKeyRes.error) throw new Error(`Lấy API key thất bại: ${apiKeyRes.error.message}`);
    if (!apiKeyRes.data) throw new Error("Không tìm thấy cấu hình API key.");
    const apiKeys = apiKeyRes.data;

    if (campaignRes.error) throw new Error(`Lấy chiến dịch thất bại: ${campaignRes.error.message}`);
    if (!campaignRes.data) throw new Error("Không tìm thấy chiến dịch.");
    const campaign = campaignRes.data;

    if (campaign.type !== 'Facebook') {
        return new Response(JSON.stringify({ message: "Chức năng quét này chỉ dành cho các chiến dịch Facebook." }), {
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
        throw new Error("URL hoặc Token của API Facebook chưa được cấu hình trong cài đặt.");
    }

    const keywords = campaign.keywords ? campaign.keywords.split('\n').map(k => k.trim()).filter(k => k) : [];
    const allPostsData = [];
    const apiCallDetails = [];

    for (const groupId of campaign.sources) {
        const since = toUnixTimestamp(campaign.scan_start_date);
        const until = Math.floor(Date.now() / 1000);
        
        let url = `${facebook_api_url.replace(/\/$/, '')}/${groupId}/feed?fields=message,created_time,id,permalink_url,from&access_token=${facebook_api_token}`;
        if (since) {
            url += `&since=${since}`;
        }
        url += `&until=${until}`;

        const fbResponse = await fetch(url);
        const responseText = await fbResponse.text();
        
        apiCallDetails.push({
            url,
            status: fbResponse.status,
            response: responseText.substring(0, 2000) // Log first 2000 chars
        });

        if (!fbResponse.ok) {
            console.error(`Proxy server returned non-OK status for group ${groupId}: ${fbResponse.status} ${responseText}`);
            continue;
        }
        
        const proxyResponse = JSON.parse(responseText);

        if (proxyResponse.success && proxyResponse.data && proxyResponse.data.data) {
            const posts = proxyResponse.data.data;
            allPostsData.push(...posts.map((post: any) => ({ ...post, campaign_id: campaign.id })));
        } else {
            const errorMessage = proxyResponse.message || `Proxy returned success=false or malformed data for group ${groupId}`;
            console.error(errorMessage, JSON.stringify(proxyResponse));
        }
    }

    let filteredPosts = [];
    if (keywords.length > 0) {
        for (const post of allPostsData) {
            const foundKeywords = findKeywords(post.message, keywords);
            if (foundKeywords.length > 0) {
                filteredPosts.push({ ...post, keywords_found: foundKeywords });
            }
        }
    } else {
        filteredPosts = allPostsData.map(post => ({ ...post, keywords_found: [] }));
    }

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
                finalResults.push({
                    campaign_id: campaign.id,
                    content: post.message,
                    posted_at: post.created_time,
                    source_url: post.permalink_url,
                    keywords_found: post.keywords_found,
                    ai_evaluation: 'Xử lý bằng AI thất bại.',
                    sentiment: null,
                });
            }
        }
    } else {
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

    if (finalResults.length > 0) {
        const { error: insertError } = await supabaseAdmin
            .from('Bao_cao_Facebook')
            .insert(finalResults);

        if (insertError) {
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
    }
    
    const successMessage = `Quét hoàn tất. Đã tìm thấy và xử lý ${finalResults.length} bài viết.`;
    await logScan(campaign_id_from_req, 'success', successMessage, { api_calls: apiCallDetails, found_posts: finalResults.length });

    return new Response(JSON.stringify({ success: true, message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    await logScan(campaign_id_from_req, 'error', error.message, { stack: error.stack });
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})