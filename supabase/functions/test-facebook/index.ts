// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { apiUrl, token } = await req.json()
    if (!apiUrl) {
      return new Response(JSON.stringify({ success: false, message: 'API URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    if (!token) {
        return new Response(JSON.stringify({ success: false, message: 'Token is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }

    // Ensure apiUrl ends with a slash
    const formattedApiUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    const testUrl = `${formattedApiUrl}me?fields=id&access_token=${token}`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseData = await response.json();

    if (response.ok && responseData.id) {
      return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const errorMessage = responseData.error?.message || 'Connection failed. Please check your URL and Token.';
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})