import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { entryId } = await req.json();

        if (!entryId) {
            throw new Error('entryId is required');
        }

        // Fetch the entry
        const { data: entry, error: entryError } = await supabaseClient
            .from('entries')
            .select('id, user_id, content_text')
            .eq('id', entryId)
            .single();

        if (entryError) throw entryError;
        if (!entry.content_text || entry.content_text.trim().length === 0) {
            throw new Error('Entry has no content to embed');
        }

        // Generate embedding using OpenAI
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-ada-002',
                input: entry.content_text.substring(0, 8000), // Limit to ~8k chars
            }),
        });

        if (!embeddingResponse.ok) {
            const error = await embeddingResponse.text();
            throw new Error(`OpenAI API error: ${error}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Upsert embedding
        const { error: upsertError } = await supabaseClient
            .from('embeddings')
            .upsert({
                entry_id: entry.id,
                user_id: entry.user_id,
                embedding,
            });

        if (upsertError) throw upsertError;

        return new Response(
            JSON.stringify({ success: true, entryId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});