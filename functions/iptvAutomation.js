import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

export async function gerarTesteIPTV(solicitanteId) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    
    try {
        console.log('🔄 Acessando painel IPTV...');
        
        // Configurar viewport e user agent
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Acessar o site
        await page.goto('https://seventvpainel.top/#/sign-in', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        // Aguardar página carregar completamente
        await page.waitForTimeout(3000);

        console.log('🔐 Fazendo login...');
        
        // Aguardar campos de login específicos
        await page.waitForSelector('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(1) > input', { timeout: 20000 });
        await page.waitForSelector('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(2) > input', { timeout: 20000 });
        
        // Preencher credenciais
        await page.type('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(1) > input', 'imavyiptvbrasil@gmail.com', { delay: 100 });
        await page.type('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(2) > input', '@Chavesgt360', { delay: 100 });
        
        // Clicar no botão de login
        await page.click('button[type="submit"], .btn-primary, input[type="submit"]');
        
        // Aguardar redirecionamento após login
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
        
        console.log('✅ Login realizado com sucesso!');
        console.log('🔍 Procurando botão de teste IPTV...');
        
        // Aguardar e clicar no botão específico de teste IPTV
        await page.waitForSelector('button.btn.btn-sm.btn-bg-light.btn-active-color-primary', { timeout: 15000 });
        
        // Encontrar o botão correto pelo texto exato
        const botaoTeste = await page.evaluateHandle(() => {
            const botoes = Array.from(document.querySelectorAll('button.btn.btn-sm.btn-bg-light.btn-active-color-primary'));
            return botoes.find(btn => btn.textContent.includes('TESTE IPTV C/ ADULTOS 6H'));
        });
        
        if (!botaoTeste) {
            throw new Error('Botão de teste IPTV não encontrado');
        }
        
        await botaoTeste.click();
        console.log('🎯 Botão de teste clicado!');
        
        // Aguardar popup aparecer
        await page.waitForTimeout(3000);
        
        // Tentar aguardar o modal aparecer
        try {
            await page.waitForSelector('#playlistModal', { timeout: 10000 });
            console.log('💬 Popup #playlistModal detectado!');
            
            // Aguardar conteúdo carregar no modal
            await page.waitForTimeout(5000);
            
            // Aguardar especificamente pelo conteúdo com dados
            await page.waitForFunction(() => {
                const modal = document.querySelector('#playlistModal');
                return modal && modal.innerText.length > 100;
            }, { timeout: 15000 });
            
            console.log('📄 Conteúdo do modal carregado!');
        } catch {
            console.log('⚠️ Modal ou conteúdo não detectado, continuando...');
            await page.waitForTimeout(5000);
        }
        
        // Capturar informações do teste gerado - busca aprimorada
        const dadosTeste = await page.evaluate(() => {
            const dados = {
                usuario: '',
                senha: '',
                dataCriacao: '',
                dataVencimento: '',
                conexoes: '',
                linkPlano: '',
                textoCompleto: ''
            };
            
            // Buscar em múltiplos locais possíveis
            const modal = document.querySelector('#playlistModal, .modal-content, .modal-body, [role="dialog"]');
            const textoCompleto = modal ? modal.innerText : document.body.innerText;
            
            dados.textoCompleto = textoCompleto;
            
            // Tentar capturar de inputs primeiro
            const inputUsuario = document.querySelector('input[name="usuario"], input[id*="usuario"], input[placeholder*="usuário"], input[placeholder*="usuario"]');
            const inputSenha = document.querySelector('input[name="senha"], input[id*="senha"], input[placeholder*="senha"]');
            
            if (inputUsuario && inputUsuario.value) dados.usuario = inputUsuario.value;
            if (inputSenha && inputSenha.value) dados.senha = inputSenha.value;
            
            // Se não encontrou nos inputs, buscar no texto
            if (!dados.usuario || !dados.senha) {
                // Buscar por padrões de usuário e senha (números de 8-10 dígitos)
                const numerosPadrao = textoCompleto.match(/\b\d{8,10}\b/g);
                if (numerosPadrao && numerosPadrao.length >= 2) {
                    if (!dados.usuario) dados.usuario = numerosPadrao[0];
                    if (!dados.senha) dados.senha = numerosPadrao[1];
                }
            }
            
            // Buscar por datas no formato brasileiro
            const datasPadrao = textoCompleto.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/g);
            if (datasPadrao && datasPadrao.length >= 2) {
                dados.dataCriacao = datasPadrao[0];
                dados.dataVencimento = datasPadrao[1];
            }
            
            // Buscar por conexões
            const conexoesMatch = textoCompleto.match(/Conexões[:\*\s]*(\d+)/i);
            if (conexoesMatch) dados.conexoes = conexoesMatch[1];
            
            // Buscar por link do plano
            const linkMatch = textoCompleto.match(/(https:\/\/seventvpainel\.top\/#\/checkout\/[^\s]+)/i);
            if (linkMatch) dados.linkPlano = linkMatch[1];
            
            return dados;
        });
        
        // Log dos dados capturados
        console.log('📄 Dados capturados:', {
            usuario: dadosTeste.usuario,
            senha: dadosTeste.senha,
            dataCriacao: dadosTeste.dataCriacao,
            dataVencimento: dadosTeste.dataVencimento,
            conexoes: dadosTeste.conexoes,
            linkPlano: dadosTeste.linkPlano,
            textoLength: dadosTeste.textoCompleto.length
        });
        
        // Debug: screenshot e texto se não encontrou dados
        if (!dadosTeste.usuario) {
            console.log('🔍 Texto da página (primeiros 1000 chars):', dadosTeste.textoCompleto.substring(0, 1000));
            await page.screenshot({ path: 'debug-modal-captura.png', fullPage: true });
            console.log('📸 Screenshot salvo em debug-modal-captura.png');
        }
        
        await browser.close();
        
        // Gerar horários se não foram capturados
        const agora = new Date();
        const fim = new Date(agora.getTime() + 6 * 60 * 60 * 1000);
        
        return {
            success: true,
            solicitante: solicitanteId,
            data: agora.toLocaleDateString('pt-BR'),
            fim: fim.toLocaleString('pt-BR'),
            usuario: dadosTeste.usuario,
            senha: dadosTeste.senha,
            dataCriacao: dadosTeste.dataCriacao,
            dataVencimento: dadosTeste.dataVencimento,
            conexoes: dadosTeste.conexoes,
            linkPlano: dadosTeste.linkPlano,
            raw: dadosTeste
        };
        
    } catch (error) {
        await browser.close();
        console.error('❌ Erro na automação:', error.message);
        
        return {
            success: false,
            error: error.message,
            solicitante: solicitanteId
        };
    }
}

// Função para formatar mensagem do WhatsApp
export function formatarMensagemTeste(dados) {
    if (!dados.success) {
        return `❌ *Erro ao gerar teste IPTV*\n\n🆔 Solicitante: ${dados.solicitante}\n⚠️ Erro: ${dados.error}\n\n🤖 Tente novamente em alguns minutos.`;
    }
    
    const usuario = dados.usuario || 'N/A';
    const senha = dados.senha || 'N/A';
    
    return `✅ *ACESSO CRIADO COM SUCESSO* ✅

━━━━━━━━━━━━━━━━━━━
🆔 *Usuário:* _${usuario}_
🔑 *Senha:* _${senha}_
📅 *Criado em:* _${dados.dataCriacao || dados.data}_
⏳ *Vencimento:* _${dados.dataVencimento || dados.fim}_
📶 *Conexões:* _${dados.conexoes || '1'}_
━━━━━━━━━━━━━━━━━━━

💳 *Assinar/Renovar Plano:*
🔗 ${dados.linkPlano || 'Consulte administrador'}

────────────────────────────
📱 *ANDROID*
────────────────────────────

📥 *Baixar ntDown (PlayStore):*
https://play.google.com/store/apps/details?id=link.ntdev.ntdw&hl=pt_BR
_(Após instalar, digite o código de um dos nossos apps abaixo ⬇️)_

➡️ *App SEVEN V3 Smarters*
📦 *Loja ntDown:* 51427
📦 *APP Downloader:* 1052038
🔗 *LINK DIRETO:* https://dl.ntdev.in/51427

➡️ *App SEVEN TV*
📦 *Loja ntDown:* 22493
📦 *APP Downloader:* 946674
🔗 *LINK DIRETO:* https://dl.ntdev.in/22493

➡️ *App P2SEVEN IBO*
📦 *Loja ntDown:* 98475
📦 *APP Downloader:* 178954
🔗 *LINK DIRETO:* https://dl.ntdev.in/98475

🛒 *Loja de Apps:* https://wb.cdnlink.com.br/p2seven

────────────────────────────
📺 *SMART TV*
────────────────────────────

⭐ *APPS PARCEIROS SMART TV* ⭐
📺 *Brasil IPTV:* 3234
📺 *FlexPlay:* 3234
📺 *Assist+:* 00732
_(Use o código correspondente no app desejado.)_

────────────────────────────
🌐 *DNS CONFIGURAÇÕES*
────────────────────────────

🟠 *DNS XCIPTV:* http://cdnthor.top
🟠 *DNS SMARTERS:* http://cdnfive.top

🟠 *DNS ALTERNATIVAS:*
📡 http://cdnsuper.top
📡 http://cdnflash.top
📡 http://cdnbrr.click

📡 *DNS STB / SmartUp:* 54.39.78.240
📡 *DNS STB / SmartUp:* 54.39.85.45

💻 *WebPlayer:* http://webtv.iptvsmarters.com/

────────────────────────────
🔗 *LISTAS IPTV*
────────────────────────────

🟢 *Link (M3U):*
http://cdnthor.top/get.php?username=${usuario}&password=${senha}&type=m3u_plus&output=mpegts

🟡 *Link (HLS):*
http://cdnthor.top/get.php?username=${usuario}&password=${senha}&type=m3u_plus&output=hls

🟢 *Link Curto (M3U):*
http://e.cdnthor.top/p/${usuario}/${senha}/m3u

🟡 *Link Curto (HLS):*
http://e.cdnthor.top/p/${usuario}/${senha}/hls

🔴 *Link (SSIPTV):*
http://e.cdnthor.top/p/${usuario}/${senha}/ssiptv
━━━━━━━━━━━━━━━━━━━
🤖 *Gerenciado por:* _iMavyBot IPTV System_
📆 *Duração do Teste:* _6 Horas_`;
}

// Teste local (descomente para testar)
// if (import.meta.url === `file://${process.argv[1]}`) {
//     gerarTesteIPTV('teste123')
//         .then(resultado => {
//             console.log('Resultado:', resultado);
//             console.log('Mensagem formatada:');
//             console.log(formatarMensagemTeste(resultado));
//         })
//         .catch(console.error);
// }