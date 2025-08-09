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

    // Ensure the base URL ends with a slash to correctly resolve the 'me' endpoint.
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
      // The response was not valid JSON.
      const errorMessage = `The proxy server returned an invalid response (HTTP Status: ${response.status}). The response was: "${responseText.substring(0, 200)}..."`;
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (response.ok && responseData.id) {
      return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      const errorMessage = responseData.error?.message || `Connection failed. The proxy returned: ${JSON.stringify(responseData)}`;
      return new Response(JSON.stringify({ success: false, message: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
  } catch (error) {
    // This catches network errors, like DNS resolution failure or if the server is unreachable.
    const errorMessage = `A network error occurred: ${error.message}. Please check the API URL and ensure the server is accessible.`;
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})