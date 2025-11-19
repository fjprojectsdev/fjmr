import puppeteer from 'puppeteer';

async function diagnosticarSite() {
    const browser = await puppeteer.launch({
        headless: false, // Mostrar navegador
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        console.log('🔍 DIAGNÓSTICO DO SITE IPTV');
        console.log('============================');
        
        // 1. Acessar página inicial
        console.log('1️⃣ Acessando página inicial...');
        await page.goto('https://seventvpainel.top/#/sign-in', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        await page.waitForTimeout(3000);
        console.log('✅ Página carregada');
        
        // 2. Verificar elementos de login
        console.log('\n2️⃣ Verificando elementos de login...');
        
        const seletoresLogin = [
            'input[type="email"]',
            'input[type="text"]',
            'input[placeholder*="email"]',
            'input[placeholder*="usuário"]',
            'input[name="email"]',
            'input[name="username"]',
            '#email',
            '#username'
        ];
        
        for (const seletor of seletoresLogin) {
            try {
                const elemento = await page.$(seletor);
                if (elemento) {
                    console.log(`✅ Encontrado campo email/usuário: ${seletor}`);
                    break;
                }
            } catch (e) {
                console.log(`❌ Não encontrado: ${seletor}`);
            }
        }
        
        const seletoresSenha = [
            'input[type="password"]',
            'input[placeholder*="senha"]',
            'input[name="password"]',
            '#password'
        ];
        
        for (const seletor of seletoresSenha) {
            try {
                const elemento = await page.$(seletor);
                if (elemento) {
                    console.log(`✅ Encontrado campo senha: ${seletor}`);
                    break;
                }
            } catch (e) {
                console.log(`❌ Não encontrado: ${seletor}`);
            }
        }
        
        // 3. Fazer login
        console.log('\n3️⃣ Tentando fazer login...');
        
        // ⚠️ REMOVIDO: Credenciais hardcoded por segurança
        // Configure as variáveis de ambiente: SITE_EMAIL e SITE_PASSWORD
        const email = process.env.SITE_EMAIL || '';
        const password = process.env.SITE_PASSWORD || '';
        
        if (!email || !password) {
            console.error('❌ SITE_EMAIL e SITE_PASSWORD não configurados no .env');
            return;
        }
        
        await page.type('input[type="email"], input[type="text"]', email);
        await page.type('input[type="password"]', password);
        
        const botaoLogin = await page.$('button[type="submit"], .btn-primary, input[type="submit"]');
        if (botaoLogin) {
            console.log('✅ Botão de login encontrado');
            await botaoLogin.click();
            
            await page.waitForTimeout(5000);
            console.log('✅ Login executado');
        }
        
        // 4. Verificar se logou
        console.log('\n4️⃣ Verificando se logou...');
        const urlAtual = page.url();
        console.log(`📍 URL atual: ${urlAtual}`);
        
        if (urlAtual.includes('dashboard') || urlAtual.includes('home') || !urlAtual.includes('sign-in')) {
            console.log('✅ Login bem-sucedido!');
            
            // 5. Procurar botões de teste
            console.log('\n5️⃣ Procurando botões de teste IPTV...');
            
            const todosBotoes = await page.$$eval('button', botoes => 
                botoes.map(btn => ({
                    texto: btn.textContent.trim(),
                    classes: btn.className,
                    id: btn.id
                }))
            );
            
            console.log('\n📋 TODOS OS BOTÕES ENCONTRADOS:');
            todosBotoes.forEach((btn, i) => {
                if (btn.texto.length > 0) {
                    console.log(`${i + 1}. "${btn.texto}" - Classes: ${btn.classes}`);
                }
            });
            
            // Procurar especificamente por botões com "TESTE" ou "IPTV"
            const botoesIPTV = todosBotoes.filter(btn => 
                btn.texto.toUpperCase().includes('TESTE') || 
                btn.texto.toUpperCase().includes('IPTV')
            );
            
            console.log('\n🎯 BOTÕES RELACIONADOS A IPTV/TESTE:');
            botoesIPTV.forEach((btn, i) => {
                console.log(`${i + 1}. "${btn.texto}" - Classes: ${btn.classes}`);
            });
            
        } else {
            console.log('❌ Login falhou ou ainda na página de login');
        }
        
        // 6. Screenshot para análise
        await page.screenshot({ path: 'diagnostico-atual.png', fullPage: true });
        console.log('\n📸 Screenshot salvo: diagnostico-atual.png');
        
        console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error.message);
    }
    
    // Manter navegador aberto por 30 segundos para inspeção manual
    console.log('\n⏳ Mantendo navegador aberto por 30 segundos...');
    await page.waitForTimeout(30000);
    
    await browser.close();
}

diagnosticarSite().catch(console.error);