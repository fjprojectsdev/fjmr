import { gerarTesteIPTVMelhorado, formatarMensagemWhatsApp } from './iptv-automation-improved.js';

async function testarNovoSistema() {
    console.log('🧪 TESTANDO NOVO SISTEMA IPTV');
    console.log('==============================');
    
    try {
        const resultado = await gerarTesteIPTVMelhorado('teste123', '/2');
        
        console.log('📊 Resultado:', resultado);
        
        if (resultado.success) {
            console.log('\n✅ TESTE BEM-SUCEDIDO!');
            console.log('📱 Mensagem formatada:');
            console.log(formatarMensagemWhatsApp(resultado));
        } else {
            console.log('\n❌ TESTE FALHOU:', resultado.error);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testarNovoSistema();