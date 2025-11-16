import fetch from 'node-fetch';

// Obter data e hora atual
export function getCurrentDateTime() {
    const now = new Date();
    const brasilia = now.toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'full',
        timeStyle: 'long'
    });
    return brasilia;
}

// Obter clima (wttr.in - 100% gratuito, sem chave)
export async function getWeather(city = 'Sao_Paulo') {
    try {
        const response = await fetch(`https://wttr.in/${city}?format=j1`);
        const data = await response.json();
        
        if (data.current_condition && data.current_condition[0]) {
            const current = data.current_condition[0];
            const desc = current.lang_pt && current.lang_pt[0] ? current.lang_pt[0].value : current.weatherDesc[0].value;
            return `${city.replace('_', ' ')}: ${desc}, ${current.temp_C}°C, umidade ${current.humidity}%`;
        }
    } catch (error) {
        console.error('Erro ao obter clima:', error);
    }
    return null;
}

// Obter taxa de câmbio (exchangerate-api - gratuito)
export async function getExchangeRate() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        
        if (data.rates && data.rates.BRL) {
            return `Dólar: R$ ${data.rates.BRL.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Erro ao obter câmbio:', error);
    }
    return null;
}

// Gerar contexto em tempo real
export async function getRealtimeContext(question) {
    const context = [];
    
    // Sempre incluir data/hora
    context.push(`Data e hora atual: ${getCurrentDateTime()}`);
    
    // Se perguntar sobre clima/temperatura
    const lowerQ = question.toLowerCase();
    if (lowerQ.includes('clima') || lowerQ.includes('tempo') || lowerQ.includes('temperatura') || lowerQ.includes('calor') || lowerQ.includes('frio') || lowerQ.includes('graus')) {
        // Tentar extrair cidade da pergunta
        let city = 'Sao_Paulo';
        if (lowerQ.includes('catalão') || lowerQ.includes('catalao')) {
            city = 'Catalao,Brazil';
        } else if (lowerQ.includes('goiânia') || lowerQ.includes('goiania')) {
            city = 'Goiania,Brazil';
        } else if (lowerQ.includes('brasília') || lowerQ.includes('brasilia')) {
            city = 'Brasilia,Brazil';
        } else if (lowerQ.includes('rio')) {
            city = 'Rio_de_Janeiro,Brazil';
        }
        
        const weather = await getWeather(city);
        if (weather) context.push(`Clima atual: ${weather}`);
    }
    
    // Se perguntar sobre dólar/câmbio
    if (question.toLowerCase().includes('dólar') || question.toLowerCase().includes('dolar') || question.toLowerCase().includes('câmbio')) {
        const exchange = await getExchangeRate();
        if (exchange) context.push(`Câmbio: ${exchange}`);
    }
    
    return context.join('\n');
}
