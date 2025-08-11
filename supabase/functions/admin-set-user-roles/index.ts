// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_id, role_ids } = await req.json();
    if (!user_id || !Array.isArray(role_ids)) {
        throw new Error("Cần có user_id và một mảng role_ids.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // This is not a true transaction, but it's the standard way in edge functions
    // 1. Delete existing roles for the user
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) throw deleteError;

    // 2. Insert new roles if any are provided
    if (role_ids.length > 0) {
      const rolesToInsert = role_ids.map(role_id => ({
        user_id: user_id,
        role_id: role_id,
      }));

      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert(rolesToInsert);

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true, message: "Cập nhật quyền thành công." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})