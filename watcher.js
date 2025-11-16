import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let botProcess = null;

function startBot() {
    console.log('🚀 Iniciando bot...');
    
    botProcess = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    
    botProcess.on('exit', (code) => {
        console.log(`⚠️ Bot encerrado com código ${code}`);
    });
}

function restartBot() {
    console.log('\n🔄 Reiniciando bot...\n');
    
    if (botProcess) {
        botProcess.kill();
    }
    
    setTimeout(() => {
        startBot();
    }, 1000);
}

// Monitorar alterações em todos os arquivos .js
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.js') && !filename.includes('watcher.js')) {
        console.log(`📝 Arquivo alterado: ${filename}`);
        restartBot();
    }
});

console.log('👁️ Monitorando alterações em todos os arquivos...');
startBot();
