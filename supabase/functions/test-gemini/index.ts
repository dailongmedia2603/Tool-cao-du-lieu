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
    const { apiKey } = await req.json()
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }],
      }),
    });

    const responseData = await response.json();

    if (response.ok) {
      return new Response(JSON.stringify({ success: true, message: 'Connection successful!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } else {
      return new Response(JSON.stringify({ success: false, message: responseData.error?.message || 'Connection failed. Please check your API key.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status,
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})