import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { request_id } = await req.json();
    if (!request_id) {
      throw new Error("Cần có ID của yêu cầu.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from('upgrade_requests')
      .select('user_id, requested_plan_id')
      .eq('id', request_id)
      .single();

    if (requestError) throw new Error(`Không tìm thấy yêu cầu: ${requestError.message}`);

    // Update user's profile with the new plan
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ plan_id: request.requested_plan_id })
      .eq('id', request.user_id);

    if (profileError) throw new Error(`Cập nhật hồ sơ thất bại: ${profileError.message}`);

    // Update the request status to 'approved'
    const { error: updateRequestError } = await supabaseAdmin
      .from('upgrade_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', request_id);

    if (updateRequestError) throw new Error(`Cập nhật yêu cầu thất bại: ${updateRequestError.message}`);

    return new Response(JSON.stringify({ success: true, message: "Yêu cầu đã được duyệt thành công." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})