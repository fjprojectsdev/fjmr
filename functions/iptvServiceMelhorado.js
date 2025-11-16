import { gerarTesteIPTVMelhorado, formatarMensagemWhatsApp, gerarJSONParaBot } from '../iptv-automation-improved.js';

// Função principal para ser chamada pelo bot WhatsApp
export async function processarSolicitacaoIPTV(solicitanteId, nomeUsuario = '', tipoTeste = '/2') {
    console.log(`📺 Processando solicitação IPTV para: ${solicitanteId}`);
    console.log(`🎯 Tipo de teste: ${tipoTeste}`);
    
    try {
        // Executar automação
        const resultado = await gerarTesteIPTVMelhorado(nomeUsuario || solicitanteId, tipoTeste);
        
        // Gerar JSON completo para logs
        const jsonCompleto = gerarJSONParaBot(resultado);
        console.log('📊 Dados gerados:', jsonCompleto);
        
        // Retornar mensagem formatada para o WhatsApp
        return {
            success: resultado.success,
            mensagem: formatarMensagemWhatsApp(resultado),
            dados: resultado,
            json: jsonCompleto
        };
        
    } catch (error) {
        console.error('❌ Erro ao processar solicitação IPTV:', error.message);
        
        return {
            success: false,
            mensagem: `❌ *Erro ao gerar teste IPTV*\n\n🆔 Solicitante: ${nomeUsuario || solicitanteId}\n⚠️ Erro: ${error.message}\n\n🤖 Tente novamente em alguns minutos.`,
            dados: { error: error.message },
            json: JSON.stringify({ success: false, error: error.message })
        };
    }
}

// Função para verificar se o usuário pode solicitar teste (rate limiting)
export function podeGerarTeste(userId, ultimasSolicitacoes = new Map()) {
    const agora = Date.now();
    const ultimaSolicitacao = ultimasSolicitacoes.get(userId);
    
    // Permitir 1 teste a cada 30 minutos
    const INTERVALO_MINIMO = 30 * 60 * 1000; // 30 minutos
    
    if (ultimaSolicitacao && (agora - ultimaSolicitacao) < INTERVALO_MINIMO) {
        const tempoRestante = Math.ceil((INTERVALO_MINIMO - (agora - ultimaSolicitacao)) / 60000);
        return {
            pode: false,
            tempoRestante: tempoRestante
        };
    }
    
    ultimasSolicitacoes.set(userId, agora);
    return { pode: true };
}

// Função para limpar cache de solicitações antigas
export function limparCacheAntigo(ultimasSolicitacoes = new Map()) {
    const agora = Date.now();
    const TEMPO_CACHE = 2 * 60 * 60 * 1000; // 2 horas
    
    for (const [userId, timestamp] of ultimasSolicitacoes.entries()) {
        if ((agora - timestamp) > TEMPO_CACHE) {
            ultimasSolicitacoes.delete(userId);
        }
    }
}