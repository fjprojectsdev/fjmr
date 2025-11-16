import fetch from 'node-fetch';
import 'dotenv/config';

const IPTV_PANEL_URL = process.env.IPTV_PANEL_URL || 'https://seventvpainel.top';
const PANEL_USERNAME = process.env.IPTV_PANEL_USERNAME || 'admin';
const PANEL_PASSWORD = process.env.IPTV_PANEL_PASSWORD || 'password';
const PANEL_PORT = process.env.IPTV_PANEL_PORT || '8080';

export async function generateIPTVTest() {
    try {
        console.log('🔄 Gerando teste IPTV real...');
        
        // Gerar credenciais únicas
        const timestamp = Date.now();
        const testUsername = `teste_${timestamp}`;
        const testPassword = Math.random().toString(36).substring(2, 10);
        
        // Tentar criar usuário no painel (implementação básica)
        const testData = await createTestUser(testUsername, testPassword);
        
        return testData;
    } catch (error) {
        console.error('❌ Erro ao gerar teste IPTV:', error);
        // Retorna dados de fallback em caso de erro
        return {
            url: `http://seventvpainel.top:${PANEL_PORT}`,
            username: `teste_${Date.now()}`,
            password: Math.random().toString(36).substring(2, 10),
            expiry: '6 horas',
            status: 'fallback'
        };
    }
}

async function createTestUser(username, password) {
    try {
        // Implementação para criar usuário no painel
        // Esta é uma implementação genérica - ajuste conforme sua API
        
        const response = await fetch(`${IPTV_PANEL_URL}/api/create_test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify({
                username: username,
                password: password,
                duration: 6, // 6 horas
                max_connections: 1
            }),
            timeout: 10000
        });

        if (response.ok) {
            const result = await response.json();
            return {
                url: `http://seventvpainel.top:${PANEL_PORT}`,
                username: username,
                password: password,
                expiry: '6 horas',
                status: 'success'
            };
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Erro na criação do usuário:', error);
        throw error;
    }
}

async function getAuthToken() {
    try {
        // Implementação para obter token de autenticação
        const response = await fetch(`${IPTV_PANEL_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: PANEL_USERNAME,
                password: PANEL_PASSWORD
            }),
            timeout: 5000
        });

        if (response.ok) {
            const data = await response.json();
            return data.token || 'default_token';
        } else {
            throw new Error('Falha na autenticação');
        }
    } catch (error) {
        console.error('❌ Erro na autenticação:', error);
        return 'fallback_token';
    }
}