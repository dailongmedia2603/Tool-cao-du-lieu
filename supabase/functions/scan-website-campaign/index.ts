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

const logScan = async (supabaseAdmin: any, campaign_id: string, status: string, message: string, details: any = null) => {
    if (!campaign_id) return;
    await supabaseAdmin.from('scan_logs').insert({
        campaign_id,
        status,
        message,
        details
    });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  let campaign_id_from_req: string | null = null;

  try {
    const { campaign_id } = await req.json();
    campaign_id_from_req = campaign_id;

    if (!campaign_id) {
      throw new Error("Cần có ID chiến dịch.");
    }

    const [apiKeyRes, campaignRes] = await Promise.all([
        supabaseAdmin.from('luu_api_key').select('firecrawl_api_key, gemini_api_key, gemini_model').eq('id', 1).single(),
        supabaseAdmin.from('danh_sach_chien_dich').select('*').eq('id', campaign_id).single()
    ]);

    if (apiKeyRes.error) throw new Error(`Lấy API key thất bại: ${apiKeyRes.error.message}`);
    const { firecrawl_api_key, gemini_api_key, gemini_model } = apiKeyRes.data || {};
    
    if (!firecrawl_api_key) {
        await logScan(supabaseAdmin, campaign_id, 'error', "API Key của Firecrawl chưa được cấu hình.");
        throw new Error("API Key của Firecrawl chưa được cấu hình.");
    }
    if (!gemini_api_key || !gemini_model) {
        await logScan(supabaseAdmin, campaign_id, 'error', "API Key hoặc Model của Gemini chưa được cấu hình.");
        throw new Error("API Key hoặc Model của Gemini chưa được cấu hình.");
    }

    if (campaignRes.error) throw new Error(`Lấy chiến dịch thất bại: ${campaignRes.error.message}`);
    if (!campaignRes.data) throw new Error("Không tìm thấy chiến dịch.");
    const campaign = campaignRes.data;

    const websiteUrls = campaign.sources.filter((s: string) => s.startsWith('http') || s.startsWith('www'));
    if (websiteUrls.length === 0) {
        await logScan(supabaseAdmin, campaign_id, 'success', 'Chiến dịch không có nguồn website nào để quét.');
        return new Response(JSON.stringify({ success: true, message: "Không có nguồn website nào để quét." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const genAI = new GoogleGenerativeAI(gemini_api_key);
    const aiModel = genAI.getGenerativeModel({ model: gemini_model });
    const allExtractedListings = [];

    for (const url of websiteUrls) {
        const firecrawlUrl = `https://api.firecrawl.dev/v0${campaign.website_scan_type || '/scrape'}`;
        const body = { url: url, pageOptions: { onlyMainContent: true } };

        const response = await fetch(firecrawlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawl_api_key}` },
            body: JSON.stringify(body),
        });

        const responseData = await response.json();

        if (!response.ok || !responseData.success) {
            console.error(`Firecrawl API call failed for URL ${url}:`, responseData.error || 'Unknown error');
            continue;
        }

        const rawContent = responseData.data.markdown || responseData.data.content;
        if (!rawContent) continue;

        const prompt = `
            You are an expert data extraction agent. Analyze the provided Markdown content from a webpage and identify all individual posts or listings.
            For each listing you find, extract the following information:
            - title: The main title of the listing.
            - description: A short summary of the listing content.
            - price: The price, including currency or unit (e.g., "1.5 tỷ", "15 triệu/tháng").
            - area: The area or size, including units (e.g., "50 m²").
            - address: The address or general location of the property.
            - listing_url: The direct URL to the specific listing if available, otherwise use the main page URL.
            - posted_date_string: The relative date text as it appears on the page (e.g., "Hôm nay", "Đăng 3 ngày trước").

            Return the result as a JSON array of objects. Each object represents one listing.
            If a specific field is not found for a listing, use null for its value.
            Your response MUST be only a valid JSON array, without any other text or markdown formatting.

            Here is the Markdown content to analyze:
            ---
            ${rawContent}
            ---
        `;

        try {
            const result = await aiModel.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const extractedData = JSON.parse(responseText);

            if (Array.isArray(extractedData)) {
                const listings = extractedData.map(item => ({
                    campaign_id: campaign.id,
                    title: item.title || null,
                    description: item.description || null,
                    price: item.price || null,
                    area: item.area || null,
                    address: item.address || null,
                    listing_url: item.listing_url || url,
                    posted_date_string: item.posted_date_string || null,
                    source_url: url,
                    ...(campaign.type === 'Tổng hợp' && { source_type: 'Website' })
                }));
                allExtractedListings.push(...listings);
            }
        } catch (e) {
            console.error(`Gemini AI processing failed for URL ${url}:`, e.message);
            await logScan(supabaseAdmin, campaign_id, 'error', `Phân tích AI thất bại cho URL: ${url}`, { error: e.message });
        }
    }

    if (allExtractedListings.length > 0) {
        const reportTable = campaign.type === 'Tổng hợp' ? 'Bao_cao_tong_hop' : 'Bao_cao_Website';
        const { error: insertError } = await supabaseAdmin.from(reportTable).insert(allExtractedListings);

        if (insertError) {
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
    }
    
    const successMessage = `Quét Website hoàn tất. Đã xử lý ${websiteUrls.length} URL và trích xuất được ${allExtractedListings.length} tin đăng.`;
    await logScan(supabaseAdmin, campaign_id, 'success', successMessage, { found_items: allExtractedListings.length });

    return new Response(JSON.stringify({ success: true, message: successMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error);
    await logScan(supabaseAdmin, campaign_id_from_req, 'error', error.message, { stack: error.stack });
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
});