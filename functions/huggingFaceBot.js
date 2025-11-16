// huggingFaceBot.js
import fetch from 'node-fetch';
import 'dotenv/config';

const HF_API = process.env.HUGGING_FACE_API;
const MODEL_ID = 'meta-llama/Llama-3.1-8B-Instruct';
const MODEL_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

/**
 * Chama o modelo GPT-OSS-20B no Hugging Face Router API
 * @param {string} prompt Texto do usuário
 * @returns {string} Resposta gerada pelo modelo
 */
export async function generateHuggingFaceReply(prompt) {
    if (!HF_API) {
        console.error('❌ Hugging Face API Key não encontrada no .env');
        return '🤖 Não foi possível acessar a IA. Verifique a configuração.';
    }

    try {
        const response = await fetch(MODEL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 256,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true
                }
            })
        });

        // Lê a resposta bruta
        const raw = await response.text();

        // Tenta converter em JSON
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            console.error('⚠️ Resposta não-JSON recebida:', raw);
            return '🤖 O modelo não respondeu corretamente.';
        }

        // Interpreta formatos possíveis da resposta
        if (Array.isArray(data) && data[0]?.generated_text) {
            return data[0].generated_text.trim();
        } else if (data?.generated_text) {
            return data.generated_text.trim();
        } else if (data?.error) {
            console.error('⚠️ Erro Hugging Face:', data.error);
            return `🤖 Erro: ${data.error}`;
        } else {
            console.warn('⚠️ Resposta vazia ou inesperada:', data);
            return '🤖 Não consegui gerar uma resposta.';
        }

    } catch (err) {
        console.error('❌ Erro ao chamar Hugging Face:', err);
        return '🤖 Ocorreu um erro ao tentar gerar a resposta.';
    }
}
