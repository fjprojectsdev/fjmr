import puppeteer from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

async function debugSite() {
    const browser = await puppeteer.launch({
        headless: false, // Mostrar navegador para debug
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        console.log('🔍 Acessando site para debug...');
        
        await page.setViewport({ width: 1366, height: 768 });
        await page.goto(process.env.SITE_URL, { waitUntil: 'networkidle2' });
        
        console.log('🔐 Fazendo login...');
        
        // Login
        await page.waitForSelector('input[type="email"], input[name="email"], #email');
        await page.type('input[type="email"], input[name="email"], #email', process.env.USER);
        await page.type('input[type="password"], input[name="password"], #password', process.env.PASS);
        await page.click('button[type="submit"], .btn-primary, input[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        console.log('✅ Login realizado! Analisando botões...');
        
        // Aguardar página carregar
        await page.waitForTimeout(3000);
        
        // Listar todos os botões disponíveis
        const botoes = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(btn => ({
                texto: btn.textContent.trim(),
                classes: btn.className,
                id: btn.id,
                type: btn.type
            })).filter(btn => btn.texto.includes('TESTE') || btn.texto.includes('IPTV'));
        });
        
        console.log('🎯 Botões encontrados com "TESTE" ou "IPTV":');
        botoes.forEach((btn, index) => {
            console.log(`${index + 1}. Texto: "${btn.texto}"`);
            console.log(`   Classes: ${btn.classes}`);
            console.log(`   ID: ${btn.id}`);
            console.log(`   Type: ${btn.type}\n`);
        });
        
        // Procurar especificamente pelo botão correto
        const botaoCorreto = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const botao = buttons.find(btn => 
                btn.textContent.includes('TESTE IPTV S/ ADULTOS 6H')
            );
            
            if (botao) {
                return {
                    texto: botao.textContent.trim(),
                    classes: botao.className,
                    id: botao.id,
                    outerHTML: botao.outerHTML
                };
            }
            return null;
        });
        
        if (botaoCorreto) {
            console.log('✅ Botão correto encontrado:');
            console.log(JSON.stringify(botaoCorreto, null, 2));
        } else {
            console.log('❌ Botão "TESTE IPTV S/ ADULTOS 6H" não encontrado');
        }
        
        console.log('\n⏳ Aguardando 10 segundos para inspeção manual...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
    } finally {
        await browser.close();
    }
}

debugSite();