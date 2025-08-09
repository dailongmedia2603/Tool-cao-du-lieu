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
    const { group_url, firecrawlApiKey } = await req.json()
    if (!group_url) {
      return new Response(JSON.stringify({ success: false, error: 'group_url is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    if (!firecrawlApiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl API Key is required. Please set it in the API Keys page.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Use Firecrawl to scrape the page
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v0/scrape", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url: group_url,
        pageOptions: {
          onlyMainContent: false, // We need the full HTML to find the ID
        }
      })
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok || !firecrawlData.success) {
        throw new Error(`Firecrawl failed: ${firecrawlData.error || 'Unknown error'}`);
    }

    const content = firecrawlData.data?.html || firecrawlData.data?.markdown || '';
    
    if (!content) {
        throw new Error('Firecrawl did not return any content for the URL.');
    }

    // Use regex to find the group ID. Patterns can change, so we try a few.
    const regex = /"groupID":"(\d+)"|group_id=(\d+)|"group_id":"(\d+)"/
    const match = content.match(regex);

    if (match) {
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