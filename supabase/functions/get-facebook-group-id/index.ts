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
    const { group_url } = await req.json()
    if (!group_url) {
      return new Response(JSON.stringify({ success: false, error: 'group_url is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fetch the HTML content of the Facebook group page
    const response = await fetch(group_url, {
      headers: {
        // Mimic a browser user agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the page, status: ${response.status}`);
    }

    const html = await response.text();

    // Use regex to find the group ID. Patterns can change, so we try a few.
    const regex = /"groupID":"(\d+)"|group_id=(\d+)|"group_id":"(\d+)"/
    const match = html.match(regex);

    if (match) {
      // The actual ID will be in one of the capturing groups
      const groupId = match[1] || match[2] || match[3];
      return new Response(JSON.stringify({ success: true, groupId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Could not find Group ID. The group might be private, the URL is incorrect, or Facebook structure has changed.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})