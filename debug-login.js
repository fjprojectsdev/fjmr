import puppeteer from 'puppeteer';

async function debugLogin() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        await page.goto('https://seventvpainel.top/#/sign-in');
        await page.waitForTimeout(5000);
        
        // Capturar todos os inputs
        const inputs = await page.$$eval('input', elements => 
            elements.map(el => ({
                type: el.type,
                name: el.name,
                id: el.id,
                placeholder: el.placeholder,
                className: el.className
            }))
        );
        
        console.log('📋 INPUTS ENCONTRADOS:');
        inputs.forEach((input, i) => {
            console.log(`${i + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Placeholder: ${input.placeholder}`);
        });
        
        await page.waitForTimeout(10000);
        await browser.close();
        
    } catch (error) {
        console.error('Erro:', error);
        await browser.close();
    }
}

debugLogin();