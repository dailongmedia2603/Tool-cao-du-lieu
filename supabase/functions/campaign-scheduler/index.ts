// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hàm tính toán thời gian quét tiếp theo
const calculateNextScan = (lastScan: Date, frequency: number, unit: string): Date => {
    const nextScan = new Date(lastScan.getTime());
    switch (unit) {
        case 'minute':
            nextScan.setMinutes(nextScan.getMinutes() + frequency);
            break;
        case 'hour':
            nextScan.setHours(nextScan.getHours() + frequency);
            break;
        case 'day':
            nextScan.setDate(nextScan.getDate() + frequency);
            break;
        default: // Mặc định là giờ nếu đơn vị không xác định
            nextScan.setHours(nextScan.getHours() + frequency);
            break;
    }
    return nextScan;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const now = new Date();
        const nowISO = now.toISOString();

        // 1. Lấy tất cả các chiến dịch có khả năng chạy (đang hoạt động và chưa hết hạn)
        const { data: activeCampaigns, error } = await supabaseAdmin
            .from('danh_sach_chien_dich')
            .select('*')
            .eq('status', 'active')
            .or(`end_date.is.null,end_date.gt.${nowISO}`);

        if (error) {
            throw new Error(`Lỗi khi lấy danh sách chiến dịch đang hoạt động: ${error.message}`);
        }

        if (!activeCampaigns || activeCampaigns.length === 0) {
            return new Response(JSON.stringify({ message: "Không có chiến dịch nào đang hoạt động hoặc chưa hết hạn." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. Lọc trong code để tìm các chiến dịch thực sự đến hạn quét
        const campaignsToRun = activeCampaigns.filter(campaign => {
            if (!campaign.next_scan_at) {
                return true; // Chưa từng được lên lịch, chạy ngay.
            }
            const nextScanTime = new Date(campaign.next_scan_at);
            return nextScanTime <= now; // Kiểm tra xem thời gian quét đã đến chưa.
        });

        if (campaignsToRun.length === 0) {
            return new Response(JSON.stringify({ message: "Không có chiến dịch nào đến hạn quét." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        console.log(`Tìm thấy ${campaignsToRun.length} chiến dịch cần quét.`);

        for (const campaign of campaignsToRun) {
            console.log(`Đang xử lý chiến dịch: ${campaign.name} (${campaign.id})`);

            let scanFunctionName = '';
            if (campaign.type === 'Facebook') {
                scanFunctionName = 'scan-facebook-campaign';
            } else {
                console.log(`Bỏ qua chiến dịch '${campaign.name}' loại '${campaign.type}' vì chưa có chức năng quét.`);
                const nextScanAt = calculateNextScan(new Date(), campaign.scan_frequency, campaign.scan_unit);
                 await supabaseAdmin
                    .from('danh_sach_chien_dich')
                    .update({ next_scan_at: nextScanAt.toISOString() })
                    .eq('id', campaign.id);
                continue;
            }

            try {
                // Gọi hàm quét cụ thể
                const { error: invokeError } = await supabaseAdmin.functions.invoke(scanFunctionName, {
                    body: { campaign_id: campaign.id },
                });

                if (invokeError) {
                    console.error(`Lỗi khi gọi hàm quét cho chiến dịch ${campaign.id}:`, invokeError.message);
                } else {
                    console.log(`Đã gọi hàm quét thành công cho chiến dịch ${campaign.id}.`);
                }

            } catch (e) {
                console.error(`Lỗi không mong muốn khi xử lý chiến dịch ${campaign.id}:`, e.message);
            } finally {
                 // Luôn cập nhật thời gian quét tiếp theo để tránh vòng lặp vô hạn khi quét lỗi
                const nextScanAt = calculateNextScan(new Date(), campaign.scan_frequency, campaign.scan_unit);

                const { error: updateError } = await supabaseAdmin
                    .from('danh_sach_chien_dich')
                    .update({ next_scan_at: nextScanAt.toISOString() })
                    .eq('id', campaign.id);

                if (updateError) {
                    console.error(`Cập nhật next_scan_at thất bại cho chiến dịch ${campaign.id}:`, updateError.message);
                } else {
                    console.log(`Đã cập nhật next_scan_at cho chiến dịch ${campaign.id} thành ${nextScanAt.toISOString()}`);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, message: `Đã xử lý ${campaignsToRun.length} chiến dịch.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Hàm lập lịch thất bại:", error);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});