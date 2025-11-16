import puppeteer from 'puppeteer';

async function debugModalFinal() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://seventvpainel.top/#/sign-in');
        await page.waitForTimeout(3000);
        
        // Login
        await page.type('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(1) > input', 'imavyiptvbrasil@gmail.com');
        await page.type('#app > div.d-flex.flex-column.flex-lg-row.flex-column-fluid.auth-layout > div > div > div > div:nth-child(1) > form > div:nth-child(2) > div:nth-child(2) > input', '@Chavesgt360');
        await page.click('#kt_sign_in_submit');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // Clicar no botão de teste
        const seletor = '#kt_content_container > div:nth-child(1) > div.dashboard-grid.dashboard-grid-2-col > div:nth-child(2) > div > div:nth-child(1) > div > div.widget-content > div > div.card-xl-stretch.card > div.card-body.pt-0 > div > button:nth-child(3)';
        await page.waitForSelector(seletor);
        await page.click(seletor);
        
        await page.waitForTimeout(3000);
        
        // Aguardar qualquer modal aparecer
        await page.waitForTimeout(5000);
        
        // Tentar clicar em botão de confirmar se houver modal de créditos
        try {
            const botaoConfirmar = await page.$('button:contains("Renovar"), button:contains("Confirmar")');
            if (botaoConfirmar) {
                await botaoConfirmar.click();
                await page.waitForTimeout(3000);
            }
        } catch (e) {
            console.log('⚠️ Nenhum botão de confirmação encontrado');
        }
        
        // Capturar TUDO que aparece na tela
        const dadosCompletos = await page.evaluate(() => {
            return {
                bodyText: document.body.innerText,
                modalPlaylist: document.querySelector('#playlistModal') ? document.querySelector('#playlistModal').innerHTML : 'NÃO ENCONTRADO',
                todosModais: Array.from(document.querySelectorAll('.modal, [role="dialog"]')).map(modal => ({
                    id: modal.id,
                    classes: modal.className,
                    texto: modal.innerText,
                    html: modal.innerHTML.substring(0, 1000)
                })),
                todosInputs: Array.from(document.querySelectorAll('input')).map(input => ({
                    type: input.type,
                    value: input.value,
                    placeholder: input.placeholder,
                    name: input.name,
                    id: input.id
                }))
            };
        });
        
        console.log('📋 DADOS COMPLETOS DA PÁGINA:');
        console.log('================================');
        console.log('🔍 TEXTO COMPLETO DO BODY:');
        console.log(dadosCompletos.bodyText);
        console.log('\n🎯 MODAL PLAYLIST:');
        console.log(dadosCompletos.modalPlaylist);
        console.log('\n📦 TODOS OS MODAIS:');
        console.log(JSON.stringify(dadosCompletos.todosModais, null, 2));
        console.log('\n📝 TODOS OS INPUTS:');
        console.log(JSON.stringify(dadosCompletos.todosInputs, null, 2));
        
        await page.screenshot({ path: 'modal-final-debug.png', fullPage: true });
        console.log('\n📸 Screenshot salvo: modal-final-debug.png');
        
        await page.waitForTimeout(15000);
        await browser.close();
        
    } catch (error) {
        console.error('❌ Erro:', error);
        await browser.close();
    }
}

debugModalFinal();