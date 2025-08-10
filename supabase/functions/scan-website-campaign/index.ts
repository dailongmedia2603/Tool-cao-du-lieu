// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
        supabaseAdmin.from('luu_api_key').select('firecrawl_api_key').eq('id', 1).single(),
        supabaseAdmin.from('danh_sach_chien_dich').select('*').eq('id', campaign_id).single()
    ]);

    if (apiKeyRes.error) throw new Error(`Lấy API key thất bại: ${apiKeyRes.error.message}`);
    if (!apiKeyRes.data || !apiKeyRes.data.firecrawl_api_key) {
        await logScan(supabaseAdmin, campaign_id, 'error', "API Key của Firecrawl chưa được cấu hình trong cài đặt.");
        throw new Error("API Key của Firecrawl chưa được cấu hình trong cài đặt.");
    }
    const { firecrawl_api_key } = apiKeyRes.data;

    if (campaignRes.error) throw new Error(`Lấy chiến dịch thất bại: ${campaignRes.error.message}`);
    if (!campaignRes.data) throw new Error("Không tìm thấy chiến dịch.");
    const campaign = campaignRes.data;

    if (campaign.type !== 'Website' && campaign.type !== 'Tổng hợp') {
        return new Response(JSON.stringify({ message: "Chức năng quét này chỉ dành cho các chiến dịch Website hoặc Tổng hợp." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const websiteUrls = campaign.sources.filter((s: string) => s.startsWith('http') || s.startsWith('www'));
    if (websiteUrls.length === 0) {
        await logScan(supabaseAdmin, campaign_id, 'success', 'Chiến dịch không có nguồn website nào để quét.', { urls: websiteUrls });
        return new Response(JSON.stringify({ success: true, message: "Không có nguồn website nào để quét." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

    const allResults = [];
    const apiCallDetails = [];

    for (const url of websiteUrls) {
        const firecrawlUrl = `https://api.firecrawl.dev/v0${campaign.website_scan_type || '/scrape'}`;
        
        const body = {
            url: url,
            pageOptions: {
                onlyMainContent: true
            }
        };

        const response = await fetch(firecrawlUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firecrawl_api_key}`,
            },
            body: JSON.stringify(body),
        });

        const responseData = await response.json();
        apiCallDetails.push({ url: firecrawlUrl, requestBody: body, status: response.status, response: responseData });

        if (response.ok && responseData.success) {
            const scrapedData = responseData.data;
            const itemsToProcess = Array.isArray(scrapedData) ? scrapedData : [scrapedData];

            for (const item of itemsToProcess) {
                 allResults.push({
                    campaign_id: campaign.id,
                    content: item.content || item.markdown,
                    author: item.metadata?.author || null,
                    posted_at: item.metadata?.date || null,
                    sentiment: null,
                    source_url: item.metadata?.sourceURL || url,
                });
            }
        } else {
            console.error(`Firecrawl API call failed for URL ${url}:`, responseData.error || 'Unknown error');
        }
    }

    if (allResults.length > 0) {
        const reportTable = campaign.type === 'Tổng hợp' ? 'Bao_cao_tong_hop' : 'Bao_cao_Website';
        const dataToInsert = campaign.type === 'Tổng hợp' 
            ? allResults.map(r => ({ ...r, source_type: 'Website' })) 
            : allResults;

        const { error: insertError } = await supabaseAdmin
            .from(reportTable)
            .insert(dataToInsert);

        if (insertError) {
            throw new Error(`Thêm dữ liệu báo cáo thất bại: ${insertError.message}`);
        }
    }
    
    const successMessage = `Quét Website hoàn tất. Đã xử lý ${websiteUrls.length} URL và lưu ${allResults.length} kết quả.`;
    await logScan(supabaseAdmin, campaign_id, 'success', successMessage, { 
        api_calls: apiCallDetails, 
        found_items: allResults.length,
    });

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