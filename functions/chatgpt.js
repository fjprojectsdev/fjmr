import fetch from 'node-fetch';
import { getMemory, addToMemory } from './memory.js';
import { getRealtimeContext } from './realtime.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

// Tentar Groq primeiro, depois OpenRouter
async function callGroq(messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
}

async function callOpenRouter(messages) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://github.com/imavybot',
            'X-Title': 'iMavyBot'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`);
    }
    
    return response.json();
}

export async function askChatGPT(question, userId = 'default') {
    // Obter contexto em tempo real
    const realtimeInfo = await getRealtimeContext(question);
    
    const messages = [
        {
            role: 'system',
            content: `Você é o iMavyBot, um assistente útil e amigável de um grupo do WhatsApp. Responda de forma concisa e objetiva em português. Você tem memória das conversas anteriores.

INFORMAÇÕES EM TEMPO REAL:
${realtimeInfo}`
        },
        ...getMemory(userId),
        {
            role: 'user',
            content: question
        }
    ];

    try {
        // Tentar Groq primeiro
        if (GROQ_API_KEY) {
            try {
                const data = await callGroq(messages);
                if (data.choices && data.choices[0]) {
                    const resposta = data.choices[0].message.content.trim();
                    addToMemory(userId, 'user', question);
                    addToMemory(userId, 'assistant', resposta);
                    console.log('✅ Resposta via Groq');
                    return resposta;
                }
            } catch (error) {
                console.log(`⚠️ Groq falhou: ${error.message}, tentando OpenRouter...`);
            }
        }

        // Fallback para OpenRouter
        if (OPENROUTER_API_KEY) {
            try {
                const data = await callOpenRouter(messages);
                if (data.choices && data.choices[0]) {
                    const resposta = data.choices[0].message.content.trim();
                    addToMemory(userId, 'user', question);
                    addToMemory(userId, 'assistant', resposta);
                    console.log('✅ Resposta via OpenRouter (Gemini 2.0)');
                    return resposta;
                } else if (data.error) {
                    console.error('❌ OpenRouter retornou erro:', data.error);
                    throw new Error(data.error.message || 'Erro na API OpenRouter');
                }
            } catch (error) {
                console.error(`❌ OpenRouter também falhou: ${error.message}`);
                throw error; // Re-throw para ser capturado pelo catch externo
            }
        }

        return '❌ Nenhuma API disponível. Configure GROQ_API_KEY ou OPENROUTER_API_KEY no .env';

    } catch (error) {
        console.error('❌ Erro ao chamar IA:', error);
        return '❌ Erro ao conectar com IA. Tente novamente mais tarde.';
    }
}
