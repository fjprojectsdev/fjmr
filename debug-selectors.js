import puppeteer from 'puppeteer';

async function debugSelectors() {
    const browser = await puppeteer.launch({
        headless: false, // Mostrar navegador para debug
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    try {
        console.log('🔍 Acessando site para debug...');
        await page.goto('https://seventvpainel.top/#/sign-in', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Aguardar página carregar
        await page.waitForTimeout(5000);

        // Capturar todos os inputs da página
        const inputs = await page.evaluate(() => {
            const allInputs = Array.from(document.querySelectorAll('input'));
            return allInputs.map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                className: input.className,
                placeholder: input.placeholder,
                outerHTML: input.outerHTML.substring(0, 200)
            }));
        });

        console.log('📋 Inputs encontrados:');
        console.log(JSON.stringify(inputs, null, 2));

        // Capturar todos os botões
        const buttons = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button'));
            return allButtons.map(btn => ({
                type: btn.type,
                className: btn.className,
                textContent: btn.textContent?.trim(),
                outerHTML: btn.outerHTML.substring(0, 200)
            }));
        });

        console.log('🔘 Botões encontrados:');
        console.log(JSON.stringify(buttons, null, 2));

        // Aguardar 10 segundos para inspeção manual
        console.log('⏳ Aguardando 10 segundos para inspeção manual...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await browser.close();
    }
}

debugSelectors();