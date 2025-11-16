import fetch from 'node-fetch';
import 'dotenv/config';

const HF_API = process.env.HUGGING_FACE_API; // Sua API Key Hugging Face

export async function generateHuggingFaceReply(prompt) {
    try {
        const response = await fetch('https://router.huggingface.co/hf-inference/gpt-oss-20b', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 250,
                    temperature: 0.7,
                    top_p: 0.9
                }
            })
        });

        const data = await response.json();

        if (data?.error) {
            console.log('⚠️ Hugging Face retornou erro:', data.error);
            return null;
        }

        // Retorna o texto gerado
        return data?.generated_text || data?.[0]?.generated_text || null;
    } catch (err) {
        console.error('❌ Erro ao gerar resposta via Hugging Face:', err);
        return null;
    }
}
