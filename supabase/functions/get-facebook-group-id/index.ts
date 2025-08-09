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
    const { group_url, apiUrl, token } = await req.json()
    if (!group_url) {
      return new Response(JSON.stringify({ success: false, error: 'group_url is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    if (!apiUrl || !token) {
      return new Response(JSON.stringify({ success: false, error: 'Facebook API URL and Token are required. Please set them in the API Keys page.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Use the provided proxy to query the Facebook Graph API
    // The Graph API can resolve a URL to an object ID
    const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
    const graphApiUrl = `${baseUrl}?id=${encodeURIComponent(group_url)}&fields=og_object{id}&access_token=${token}`;

    const response = await fetch(graphApiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      const errorMessage = `The proxy server returned an invalid JSON response (HTTP Status: ${response.status}). The response was: "${responseText.substring(0, 200)}..."`;
      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // The proxy might wrap the actual FB response.
    const facebookData = responseData.data || responseData;

    if (facebookData.og_object && facebookData.og_object.id) {
      const groupId = facebookData.og_object.id;
      return new Response(JSON.stringify({ success: true, groupId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else if (facebookData.error) {
      const errorMessage = facebookData.error.message || 'Facebook API returned an error.';
      return new Response(JSON.stringify({ success: false, error: `Graph API Error: ${errorMessage}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    else {
      return new Response(JSON.stringify({ success: false, error: 'Could not resolve Group ID from the URL via Graph API. Check if the URL is correct and public.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: `An unexpected error occurred: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})