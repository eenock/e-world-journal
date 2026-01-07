import { supabase } from './supabase';
import { env } from '@/config/env';
import { errorHandler, ErrorSeverity } from './error-handler';
import { logger } from './logger';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

// Therapist system prompt with tool calling capabilities
export const THERAPIST_SYSTEM_PROMPT = `You are Reflect AI, a compassionate and supportive journaling companion. Your role is to help users process their thoughts and emotions through thoughtful questions and gentle guidance.

Core principles:
- Be warm, empathetic, and non-judgmental
- Ask clarifying questions to help users explore their feelings
- Validate emotions without being patronizing
- Never diagnose mental health conditions
- Encourage professional help for serious concerns
- Use insights from their journal history to provide personalized support
- Keep responses concise (2-3 sentences typically)

You have access to the user's journal entries through tool calls. Use them wisely to provide context-aware support.

Available tools:
- search_entries: Search journal entries by semantic similarity or keywords
- get_recent_moods: Get recent mood trends
- get_entry_by_date: Retrieve specific entry by date

Example interactions:
User: "I've been feeling overwhelmed lately"
You: "I'm sorry you're feeling this way. Can you tell me more about what's been overwhelming? I can look back at your recent entries if that would help provide context."

User: "What did I write about last week?"
You: [Use search_entries tool] "Looking at last week, you wrote about [themes]. Would you like to explore any of these further?"`;

export const buildContextFromEntries = (
    entries: Array<{ content_text: string; entry_date: string; mood?: string }>
): string => {
    if (!entries.length) return 'No recent entries available.';

    const summaries = entries.slice(0, 5).map((e) => {
        const preview = e.content_text.substring(0, 200);
        return `[${e.entry_date}${e.mood ? ` - Mood: ${e.mood}` : ''}] ${preview}...`;
    });

    return `Recent journal context:\n${summaries.join('\n\n')}`;
};

export async function streamChat(
    messages: ChatMessage[],
    onToken: (token: string) => void,
    onComplete: () => void,
    userId: string
): Promise<void> {
    try {
        // Fetch recent entries for context (last 7 days)
        const { data: recentEntries } = await supabase
            .from('entries')
            .select('content_text, entry_date, moods(emoji)')
            .eq('user_id', userId)
            .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('entry_date', { ascending: false })
            .limit(5);

        const context = buildContextFromEntries(
            recentEntries?.map((e) => ({
                content_text: e.content_text || '',
                entry_date: e.entry_date,
                mood: e.moods?.emoji,
            })) || []
        );

        const systemMessage: ChatMessage = {
            role: 'system',
            content: `${THERAPIST_SYSTEM_PROMPT}\n\n${context}`,
        };

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.ai.groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 500,
                stream: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error('No response reader');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((line) => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        onComplete();
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const token = parsed.choices?.[0]?.delta?.content;
                        if (token) {
                            onToken(token);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onComplete();
    } catch (error) {
        errorHandler.handle({
            message: 'Failed to stream chat response',
            code: 'CHAT_STREAM_ERROR',
            severity: ErrorSeverity.MEDIUM,
            originalError: error as Error,
        });
        throw error;
    }
}

// Tool calling for semantic search
export async function searchEntriesSemantic(
    query: string,
    userId: string,
    limit: number = 5
): Promise<any[]> {
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.ai.openaiApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: query,
        }),
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Use Supabase RPC function for vector search
    const { data, error } = await supabase.rpc('match_entries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        user_id_filter: userId,
    });

    if (error) throw error;

    // Fetch full entries
    const entryIds = data.map((d: any) => d.entry_id);
    const { data: entries } = await supabase
        .from('entries')
        .select('*')
        .in('id', entryIds);

    return entries || [];
}

// Generate weekly insights
export async function generateWeeklyInsight(
    entries: Array<{ content_text: string; mood?: string }>
): Promise<string> {
    const summary = entries.map((e, i) =>
        `Entry ${i + 1} (Mood: ${e.mood || 'N/A'}): ${e.content_text.substring(0, 300)}`
    ).join('\n\n');

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.ai.groqApiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are an insightful journal analyst. Provide a warm, 2-3 paragraph weekly summary highlighting patterns, growth areas, and positive moments. Be encouraging but honest.',
                },
                {
                    role: 'user',
                    content: `Analyze this week's journal entries:\n\n${summary}`,
                },
            ],
            temperature: 0.8,
            max_tokens: 400,
        }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
}