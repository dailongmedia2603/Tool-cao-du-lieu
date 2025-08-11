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

    // Update the request status to 'rejected'
    const { error } = await supabaseAdmin
      .from('upgrade_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', request_id);

    if (error) throw new Error(`Cập nhật yêu cầu thất bại: ${error.message}`);

    return new Response(JSON.stringify({ success: true, message: "Yêu cầu đã được từ chối." }), {
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