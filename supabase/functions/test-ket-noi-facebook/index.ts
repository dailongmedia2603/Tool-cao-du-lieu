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

    const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    const testUrl = `${baseUrl}me?fields=id&access_token=${token}`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      const errorMessage = `The API server returned an invalid response (HTTP Status: ${response.status}). The response was: "${responseText.substring(0, 200)}..."`;
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Check for a successful connection from either a direct API call or a proxy
    const isDirectSuccess = response.ok && responseData.id;
    const isProxySuccess = response.ok && responseData.success === true && responseData.data?.id;

    if (isDirectSuccess || isProxySuccess) {
      return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const errorMessage = responseData.message || responseData.error?.message || `Connection failed. The server returned: ${JSON.stringify(responseData)}`;
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
  } catch (error) {
    const errorMessage = `A network error occurred: ${error.message}. Please check the API URL and ensure the server is accessible.`;
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})