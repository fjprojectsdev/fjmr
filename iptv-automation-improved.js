import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Configurações IPTV - BUSCA POR ÍNDICE
const TESTES_IPTV = {
    '/1': { indice: 0, nome: 'TESTE IPTV C/ ADULTOS 6H' },
    '/2': { indice: 1, nome: 'TESTE IPTV S/ ADULTOS 6H' },
    '/3': { indice: 2, nome: 'TESTE ASSIST+ C/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/4': { indice: 3, nome: 'TESTE ASSIST+ S/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/5': { indice: 4, nome: 'TESTE BRASIL IPTV C/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/6': { indice: 5, nome: 'TESTE BRASIL IPTV S/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/7': { indice: 6, nome: 'TESTE FLEXPLAY C/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/8': { indice: 7, nome: 'TESTE FLEXPLAY S/ ADULTOS 6H [ROKU - LG - SAMSUNG]' },
    '/9': { indice: 8, nome: 'TESTE ANDROID C/ ADULTO 6H [TV BOX - TV ANDROID - CELULAR]' },
    '/10': { indice: 9, nome: 'TESTE ANDROID S/ ADULTO 6H [TV BOX - TV ANDROID - CELULAR]' }
};

export async function gerarTesteIPTVMelhorado(solicitanteId, tipoTeste = '/2') {
    const puppeteer = await import('puppeteer');
    
    const browser = await puppeteer.default.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        const testeConfig = TESTES_IPTV[tipoTeste];
        if (!testeConfig) {
            return {
                success: false,
                error: 'Tipo de teste inválido',
                solicitante: solicitanteId
            };
        }
        
        console.log(`🎯 Gerando: ${testeConfig.nome}`);
        
        await page.goto('https://seventvpainel.top/#/sign-in');
        
        console.log('🔐 Fazendo login...');
        
        await page.waitForSelector('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(1) > input');
        
        await page.evaluate(() => {
            document.querySelector('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(1) > input').value = 'imavyiptvbrasil@gmail.com';
            document.querySelector('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(2) > input').value = '@Chavesgt360';
        });
        
        await page.click('#kt_sign_in_submit');
        await page.waitForNavigation();
        
        console.log('✅ Login realizado com sucesso!');
        
        // Fechar modal de aviso
        try {
            await page.evaluate(() => {
                const botaoOK = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('OK'));
                if (botaoOK) botaoOK.click();
            });
        } catch (e) {}
        
        console.log(`🔍 Clicando no botão índice ${testeConfig.indice}...`);
        
        // Buscar botão por índice
        try {
            await page.evaluate((indice) => {
                const botoesIPTV = Array.from(document.querySelectorAll('button')).filter(btn => 
                    btn.textContent.includes('TESTE') && (btn.textContent.includes('IPTV') || btn.textContent.includes('ASSIST') || btn.textContent.includes('BRASIL') || btn.textContent.includes('FLEXPLAY') || btn.textContent.includes('ANDROID'))
                );
                if (botoesIPTV[indice]) {
                    botoesIPTV[indice].click();
                }
            }, testeConfig.indice);
        } catch (e) {
            throw new Error('Erro ao clicar no botão: ' + e.message);
        }
        
        console.log('🎯 Botão de teste clicado!');
        
        // Verificar se apareceu modal de créditos e confirmar
        try {
            const textoModal = await page.$eval('body', el => el.innerText);
            if (textoModal.includes('créditos') && textoModal.includes('Renovar')) {
                console.log('💳 Modal de créditos detectado, confirmando...');
                
                // Procurar botão de confirmar/renovar
                const botaoRenovar = await page.$('button:contains("Renovar"), button:contains("Confirmar"), button:contains("Continuar")');
                if (botaoRenovar) {
                    await botaoRenovar.click();
                    await page.waitForTimeout(3000);
                } else {
                    // Tentar clicar no último botão se não encontrar por texto
                    const botoes = await page.$$('button');
                    if (botoes.length > 0) {
                        await botoes[botoes.length - 1].click();
                        await page.waitForTimeout(3000);
                    }
                }
            }
        } catch (e) {
            console.log('⚠️ Erro ao verificar modal de créditos:', e.message);
        }
        
        try {
            await page.waitForSelector('#playlistModal', { timeout: 10000 });
            console.log('💬 Popup #playlistModal detectado!');
            
            // Aguardar o loading desaparecer e conteúdo real aparecer
            await page.waitForFunction(() => {
                const modal = document.querySelector('#playlistModal');
                if (!modal) return false;
                
                const loading = modal.querySelector('.lds-ripple');
                if (loading) return false;
                
                const texto = modal.innerText;
                return texto.includes('Usuário') || texto.includes('Senha') || texto.match(/\d{8,12}/);
            }, { timeout: 10000 });
            
            console.log('📄 Conteúdo real do modal carregado!');
            
            // Não clicar em "Copiar e Fechar", apenas capturar os dados
            console.log('📋 Capturando dados do modal...');
            
        } catch {
            console.log('⚠️ Modal ou conteúdo não detectado, continuando...');
            await page.waitForTimeout(5000);
        }
        
        const dadosTeste = await page.evaluate(() => {
            const modal = document.querySelector('#playlistModal, .modal-content, .modal-body, [role="dialog"]');
            const textoCompleto = modal ? modal.innerText : document.body.innerText;
            
            // Buscar por múltiplos padrões de usuário e senha
            let usuario = '';
            let senha = '';
            
            // Padrão 1: Usuário: 12345678
            const userMatch1 = textoCompleto.match(/Usuário[:\s]*([^\s\n]+)/i);
            const passMatch1 = textoCompleto.match(/Senha[:\s]*([^\s\n]+)/i);
            
            if (userMatch1) usuario = userMatch1[1].trim();
            if (passMatch1) senha = passMatch1[1].trim();
            
            // Padrão 2: Números sequenciais de 8-12 dígitos
            if (!usuario || !senha) {
                const numeros = textoCompleto.match(/\b\d{8,12}\b/g);
                if (numeros && numeros.length >= 2) {
                    usuario = numeros[0];
                    senha = numeros[1];
                }
            }
            
            // Padrão 3: Buscar em inputs
            if (!usuario || !senha) {
                const inputs = document.querySelectorAll('input[type="text"], input[readonly]');
                const valores = Array.from(inputs).map(input => input.value).filter(v => v && v.length >= 8);
                if (valores.length >= 2) {
                    usuario = valores[0];
                    senha = valores[1];
                }
            }
            
            // Capturar datas
            const datasPadrao = textoCompleto.match(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/g);
            const dataCriacao = datasPadrao && datasPadrao[0] ? datasPadrao[0] : '';
            const dataVencimento = datasPadrao && datasPadrao[1] ? datasPadrao[1] : '';
            
            // Capturar conexões
            const conexoesMatch = textoCompleto.match(/Conexões[:\s]*(\d+)/i);
            const conexoes = conexoesMatch ? conexoesMatch[1] : '1';
            
            // Capturar link do plano
            const linkMatch = textoCompleto.match(/(https:\/\/seventvpainel\.top\/#\/checkout\/[^\s]+)/i);
            const linkPlano = linkMatch ? linkMatch[1] : 'https://seventvpainel.top';
            
            return {
                usuario: usuario,
                senha: senha,
                dataCriacao: dataCriacao,
                dataVencimento: dataVencimento,
                conexoes: conexoes,
                linkPlano: linkPlano,
                textoCompleto: textoCompleto
            };
        });
        
        console.log('📄 Dados capturados:', {
            usuario: dadosTeste.usuario,
            senha: dadosTeste.senha,
            dataCriacao: dadosTeste.dataCriacao,
            dataVencimento: dadosTeste.dataVencimento,
            conexoes: dadosTeste.conexoes,
            linkPlano: dadosTeste.linkPlano,
            textoLength: dadosTeste.textoCompleto.length
        });
        
        if (!dadosTeste.usuario) {
            console.log('🔍 Texto da página (primeiros 1000 chars):', dadosTeste.textoCompleto.substring(0, 1000));
            await page.screenshot({ path: 'debug-modal-captura.png', fullPage: true });
            console.log('📸 Screenshot salvo em debug-modal-captura.png');
        }
        
        await browser.close();
        
        const agora = new Date();
        const fim = new Date(agora.getTime() + 6 * 60 * 60 * 1000);
        
        return {
            success: true,
            solicitante: solicitanteId,
            tipoTeste: testeConfig.nome,
            usuario: dadosTeste.usuario,
            senha: dadosTeste.senha,
            criado: dadosTeste.dataCriacao || agora.toLocaleDateString('pt-BR'),
            vencimento: dadosTeste.dataVencimento || fim.toLocaleString('pt-BR'),
            conexoes: dadosTeste.conexoes || '1',
            linkPlano: dadosTeste.linkPlano || 'https://seventvpainel.top'
        };
        
    } catch (error) {
        try {
            if (browser && browser.isConnected && browser.isConnected()) {
                await browser.close();
            }
        } catch (e) {}
        
        console.error('❌ Erro na automação:', error.message);
        
        return {
            success: false,
            error: error.message,
            solicitante: solicitanteId
        };
    }
}

export function formatarMensagemWhatsApp(dados) {
    if (!dados.success) {
        return `❌ *Erro ao gerar teste IPTV*\n\n🆔 Solicitante: ${dados.solicitante}\n⚠️ Erro: ${dados.error}\n\n🤖 Tente novamente em alguns minutos.`;
    }
    
    const u = dados.usuario;
    const s = dados.senha;
    
    return `✅ *ACESSO CRIADO COM SUCESSO* ✅

✅ *Usuário:* ${u}
✅ *Senha:* ${s}
🗓️ *Criado em:* ${dados.criado}
🗓️ *Vencimento:* ${dados.vencimento}
📶 *Conexões:* ${dados.conexoes}

💳 *Assinar/Renovar Plano:* ${dados.linkPlano}

-------------- *ANDROID* --------------

✅ *ntDown PlayStore:* https://play.google.com/store/apps/details?id=link.ntdev.ntdw&hl=pt_BR
_(após instalar a loja digite o código de um dos nossos apps)_

➡️ *App SEVEN V3 Smarters*
📥 *Loja ntDown:* 51427
📥 *APP Downloader:* 1052038
📥 *LINK DIRETO:* https://dl.ntdev.in/51427

➡️ *App SEVEN TV*
📥 *Loja ntDown:* 22493
📥 *APP Downloader:* 946674
📥 *LINK DIRETO:* https://dl.ntdev.in/22493

➡️ *App P2SEVEN IBO*
📥 *Loja ntDown:* 98475
📥 *APP Downloader:* 178954
📥 *LINK DIRETO:* https://dl.ntdev.in/98475
 
*🛒Loja de Apps:* https://wb.cdnlink.com.br/p2seven

-------------- *SMART TV* --------------

*⭐APPs PARCEIROS SMART TV⭐*

📺 *Brasil IPTV:* 3234
📺 *FlexPlay:* 3234
📺 *Assist+:* 00732
_Use o código na hora que for adicionar a lista no aplicativo_

------------------- *DNS* -------------------

🟠 *DNS XCIPTV:* http://cdnthor.top
🟠 *DNS SMARTERS:* http://cdnfive.top

🟠 *DNS ALTERNATIVAS:* 
📺  http://cdnsuper.top
📺  http://cdnflash.top
📺  http://cdnbrr.click

📺 *DNS STB / SmartUp:* 54.39.78.240
📺 *DNS STB / SmartUp:* 54.39.85.45

📺 *WebPlayer:* http://webtv.iptvsmarters.com/

-------------------------------------------
 🟢 *Link (M3U):* http://cdnthor.top/get.php?username=${u}&password=${s}&type=m3u_plus&output=mpegts
 
🟡 *Link (HLS):* http://cdnthor.top/get.php?username=${u}&password=${s}&type=m3u_plus&output=hls

🟢 Link Curto (M3U): http://e.cdnthor.top/p/${u}/${s}/m3u
 
🟡 Link Curto (HLS): http://e.cdnthor.top/p/${u}/${s}/hls
 
🔴 Link (SSIPTV): http://e.cdnthor.top/p/${u}/${s}/ssiptv`;
}

export function gerarJSONParaBot(dados) {
    return JSON.stringify({
        success: dados.success,
        timestamp: new Date().toISOString(),
        data: {
            solicitante: dados.solicitante,
            tipoTeste: dados.tipoTeste,
            usuario: dados.usuario,
            senha: dados.senha,
            criado: dados.criado,
            vencimento: dados.vencimento,
            conexoes: dados.conexoes,
            linkPlano: dados.linkPlano
        },
        mensagemFormatada: formatarMensagemWhatsApp(dados),
        error: dados.error || null
    }, null, 2);
}
