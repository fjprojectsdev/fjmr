// groupResponder.js
import { processarSolicitacaoIPTV } from './iptvServiceMelhorado.js';
import { getGroupStatus } from './groupStats.js';
import { addBlockedWord, addBlockedLink, removeBlockedWord, removeBlockedLink, getCustomBlacklist } from './customBlacklist.js';
import { askChatGPT } from './chatgpt.js';

const TARGET_GROUP = '120363420952651026@g.us';
const BOT_TRIGGER = 'bot';

// Respostas pré-definidas
const RESPONSES = {
    'oi': '👋 Olá! Como posso ajudar?',
    'ajuda': '📋 Comandos disponíveis:\n- oi\n- ajuda\n- status\n- info\n- /fechar\n- /abrir\n- /fixar\n- /regras\n- /status\n- /lista\n- /comandos\n- /gpt\n- /testeiptv',
    'status': '✅ Bot online e funcionando!',
    'info': '🤖 iMavyBot v1.0 - Bot simples para WhatsApp'
};

export async function handleGroupMessages(sock, message) {
    const groupId = message.key.remoteJid;
    const isGroup = groupId.endsWith('@g.us');
    const senderId = message.key.participant || message.key.remoteJid;

    const contentType = Object.keys(message.message)[0];
    let text = '';
    
    // Permitir /comandos no PV
    switch(contentType) {
        case 'conversation':
            text = message.message.conversation;
            break;
        case 'extendedTextMessage':
            text = message.message.extendedTextMessage.text;
            break;
    }
    
    // Verificar se é resposta a uma mensagem do bot
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo;
    if (isGroup && quotedMessage && quotedMessage.participant && text) {
        // Verificar se a mensagem citada é do bot
        const quotedFromBot = quotedMessage.fromMe || quotedMessage.participant.includes('bot');
        
        if (quotedFromBot || message.message?.extendedTextMessage?.contextInfo?.stanzaId) {
            console.log('🔄 Resposta detectada para mensagem do bot');
            const resposta = await askChatGPT(text, senderId);
            await sock.sendMessage(groupId, { 
                text: resposta,
                quoted: message
            });
            return;
        }
    }
    
    if (!isGroup && text.toLowerCase().includes('/comandos')) {
        const comandosMsg = `🤖 *LISTA COMPLETA DE COMANDOS - iMavyBot* 🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👮 *COMANDOS ADMINISTRATIVOS:*

• 🔒 */fechar* - Fecha o grupo
• 🔓 */abrir* - Abre o grupo
• 📌 */fixar [mensagem]* - Fixa mensagem importante
• 🚫 */banir @membro [motivo]* - Remove e bane membro
• 🚫 */bloqueartermo [palavra]* - Bloqueia palavra
• 🔗 */bloquearlink [dominio]* - Bloqueia link/domínio
• ✏️ */removertermo [palavra]* - Remove palavra bloqueada
• 🔓 */removerlink [dominio]* - Remove link bloqueado
• 📝 */listatermos* - Lista termos e links bloqueados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *COMANDOS DE INFORMAÇÃO:*

• 📊 */status* - Status e estatísticas do grupo
• 📋 */regras* - Exibe regras do grupo
• 📱 */comandos* - Lista todos os comandos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📺 *COMANDOS IPTV:*

• 📺 */lista* - Lista testes IPTV disponíveis
• 📺 */1 a /10* - Gera teste IPTV específico
• 🧪 */testeiptv* - Teste manual IPTV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *COMANDOS DO BOT:*

• 👋 *bot oi* - Saudação
• ❓ *bot ajuda* - Ajuda rápida
• ✅ *bot status* - Status do bot
• ℹ️ *bot info* - Informações do bot
• 🤖 */gpt [pergunta]* - Pergunte ao ChatGPT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 *COMANDOS DE TESTE:*

• 🎉 */testar_boasvindas* - Testa mensagem de boas-vindas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 *Sistema de Segurança Ativo*
• Anti-spam automático
• Sistema de strikes (3 = expulsão)
• Bloqueio de links e palavras proibidas
• Notificação automática aos admins
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *iMavyBot v2.0* - Protegendo seu grupo 24/7`;
        
        await sock.sendMessage(senderId, { text: comandosMsg });
        return;
    }

    if (!isGroup || groupId !== TARGET_GROUP) return;

    text = '';

    switch(contentType) {
        case 'conversation':
            text = message.message.conversation;
            break;
        case 'extendedTextMessage':
            text = message.message.extendedTextMessage.text;
            break;
        default:
            return;
    }

    console.log(`💬 Mensagem de ${senderId}: "${text}"`);

    // Comandos de teste IPTV /1 a /10
    const comandosIPTV = ['/1', '/2', '/3', '/4', '/5', '/6', '/7', '/8', '/9', '/10'];
    if (comandosIPTV.some(cmd => text.trim() === cmd)) {
        try {
            await sock.sendMessage(groupId, { text: '⏳ Gerando teste IPTV...' });
            
            const resultado = await processarSolicitacaoIPTV(senderId, senderId, text.trim());
            
            if (resultado.success) {
                await sock.sendMessage(groupId, { text: resultado.mensagem });
                console.log('✅ Teste IPTV enviado com sucesso');
            } else {
                await sock.sendMessage(groupId, { text: resultado.mensagem });
                console.log('❌ Erro ao gerar teste IPTV');
            }
        } catch (error) {
            await sock.sendMessage(groupId, { text: '❌ Erro ao processar solicitação. Tente novamente.' });
            console.error('❌ Erro:', error);
        }
        return;
    }

    // Comandos /fechar, /abrir, /fixar, /regras, /lista, /status, /banir, /bloqueartermo, /bloquearlink, /removertermo, /removerlink, /listatermos, /comandos, /gpt e /testeiptv
    if (text.toLowerCase().includes('/fechar') || text.toLowerCase().includes('/abrir') || text.toLowerCase().includes('/fixar') || text.toLowerCase().includes('/regras') || text.toLowerCase().includes('/lista') || text.toLowerCase().includes('/status') || text.toLowerCase().includes('/banir') || text.toLowerCase().includes('/bloqueartermo') || text.toLowerCase().includes('/bloquearlink') || text.toLowerCase().includes('/removertermo') || text.toLowerCase().includes('/removerlink') || text.toLowerCase().includes('/listatermos') || text.toLowerCase().includes('/comandos') || text.toLowerCase().includes('/gpt') || text.toLowerCase().includes('/testeiptv')) {
        try {
            if (text.toLowerCase().includes('/fechar')) {
                await sock.groupSettingUpdate(groupId, 'announcement');
                const closeMessage = `🕛 Mensagem de Fechamento (00:00)

🌙 Encerramento do Grupo 🌙
🔒 O grupo está sendo fechado agora (00:00)!
Agradecemos a participação de todos 💬
Descansem bem 😴💤
Voltamos com tudo às 07:00 da manhã! ☀️💪`;
                const msgFechar = await sock.sendMessage(groupId, { text: closeMessage });
                console.log(msgFechar ? '✅ Grupo fechado e mensagem enviada' : '❌ Falha ao enviar mensagem de fechamento');
            } else if (text.toLowerCase().includes('/abrir')) {
                await sock.groupSettingUpdate(groupId, 'not_announcement');
                const openMessage = `🌅 Mensagem de Abertura (07:00)

☀️ Bom dia, pessoal! ☀️
🔓 O grupo foi reaberto (07:00)!
Desejamos a todos um ótimo início de dia 💫
Vamos com foco, energia positiva e boas conversas 💬✨`;
                const msgAbrir = await sock.sendMessage(groupId, { text: openMessage });
                console.log(msgAbrir ? '✅ Grupo aberto e mensagem enviada' : '❌ Falha ao enviar mensagem de abertura');
            } else if (text.toLowerCase().includes('/fixar')) {
                // Extrair menções da mensagem original
                const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                
                // Remover apenas o comando /fixar
                let messageToPin = text.replace(/\/fixar/i, '').trim();
                
                if (messageToPin) {
                    const dataHora = new Date().toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                    
                    const pinnedMsg = `📌 *MENSAGEM IMPORTANTE* 📌
━━━━━━━━━━━━━━━━━━━━━━━━━
${messageToPin}
━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Fixado por iMavyBot | 📅 ${dataHora}`;
                    
                    const sentMsg = await sock.sendMessage(groupId, { 
                        text: pinnedMsg,
                        mentions: mentionedJids
                    });
                    console.log(sentMsg ? '✅ Mensagem fixada enviada' : '❌ Falha ao enviar mensagem fixada');
                } else {
                    const msgErroFixar = await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/fixar sua mensagem aqui`\n\nExemplo: `/fixar Reunião amanhã às 15h`' }, { quoted: message });
                    console.log(msgErroFixar ? '✅ Mensagem de erro fixar enviada' : '❌ Falha ao enviar erro fixar');
                }
            } else if (text.toLowerCase().includes('/regras')) {
                const rulesMessage = `🌟 *⚠️ REGRAS OFICIAIS DO GRUPO ⚠️* 🌟
━━━━━━━━━━━━━━━━━━━━━━━
👋 *Bem-vindo(a) ao grupo!*
_Leia com atenção antes de participar das conversas!_ 💬

━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ **Respeito acima de tudo!**
_Nada de xingamentos, discussões ou qualquer tipo de preconceito._ 🙅‍♂️

2️⃣ **Proibido SPAM e divulgação sem permissão.**
_Mensagens repetidas, links suspeitos e propaganda não autorizada serão removidos._ 🚫

3️⃣ **Mantenha o foco do grupo.**
_Conversas fora do tema principal atrapalham todos._ 🎯

4️⃣ **Conteúdo inadequado não será tolerado.**
_Nada de conteúdo adulto, político, religioso ou violento._ ❌

5️⃣ **Use o bom senso.**
_Se não agregou, não envie._ 🤝

6️⃣ **Apenas administradores podem alterar o grupo.**
_Nome, foto e descrição são gerenciados pelos ADMs._ 🧑‍💻

7️⃣ **Dúvidas?**
_Use o comando_ \`/ajuda\` _ou marque um administrador._ 💬

━━━━━━━━━━━━━━━━━━━━━━━
🕒 **Horários do Grupo:**
☀️ _Abertura automática:_ **07:00**
🌙 _Fechamento automático:_ **00:00**

━━━━━━━━━━━━━━━━━━━━━━━
🤖 **Gerenciado por:** *iMavyBot*
💡 _Dica:_ Digite **/menu** para ver todos os comandos disponíveis.
━━━━━━━━━━━━━━━━━━━━━━━
🔥 _Seu comportamento define a qualidade do grupo._ 🔥`;
                const msgRegras = await sock.sendMessage(groupId, { text: rulesMessage });
                console.log(msgRegras ? '✅ Regras enviadas com sucesso' : '❌ Falha ao enviar regras');
            } else if (text.toLowerCase().includes('/banir')) {
                const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                
                // Extrair motivo do banimento
                let banReason = text.replace(/\/banir/i, '').replace(/@\d+/g, '').trim();
                if (!banReason) {
                    banReason = 'Violação das regras';
                }
                
                if (mentionedJids.length > 0) {
                    // Buscar metadados do grupo ANTES de remover
                    const groupMetadata = await sock.groupMetadata(groupId);
                    
                    for (const memberId of mentionedJids) {
                        try {
                            // Buscar número real ANTES de remover
                            const participant = groupMetadata.participants.find(p => p.id === memberId);
                            let memberNumber = memberId.split('@')[0];
                            if (participant && participant.jid) {
                                memberNumber = participant.jid.split('@')[0];
                            }
                            
                            console.log('🔍 DEBUG memberId:', memberId);
                            console.log('🔍 DEBUG participant.jid:', participant?.jid);
                            console.log('🔍 DEBUG memberNumber extraído:', memberNumber);
                            
                            // Formatar número
                            let formattedNumber = memberNumber;
                            if (memberNumber.length >= 12) {
                                const country = memberNumber.substring(0, 2);
                                const ddd = memberNumber.substring(2, 4);
                                const part1 = memberNumber.substring(4, 8);
                                const part2 = memberNumber.substring(8);
                                formattedNumber = `+${country} (${ddd}) ${part1}-${part2}`;
                            }
                            
                            // Enviar mensagem no PV antes de banir
                            const dataHoraBrasilia = new Date().toLocaleString('pt-BR', { 
                                timeZone: 'America/Sao_Paulo',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                            
                            const banMessage = `────── 🕒 ${dataHoraBrasilia} 🕒 ──────

🚫❌ *Você foi banido do grupo!* ❌🚫

Olá! 👋
O sistema identificou uma violação grave das regras e, por esse motivo, você foi removido automaticamente pelo bot.

📌 *Detalhes do banimento:*
• ⚠️ Motivo: ${banReason}
• 🔨 Ação aplicada: Banimento automático
• 🔐 Status: Acesso bloqueado

Se você acredita que ocorreu um engano, entre em contato com a equipe de administração. 📨

🔒 Seu acesso ao grupo permanecerá restrito até que uma liberação oficial seja aprovada.

────── 🕒 ${dataHoraBrasilia} 🕒 ──────`;
                            
                            await sock.sendMessage(memberId, { text: banMessage });
                            
                            // Remover do grupo
                            await sock.groupParticipantsUpdate(groupId, [memberId], 'remove');
                            // Notificar no grupo
                            await sock.sendMessage(groupId, { 
                                text: `🚫 *Membro banido*\n\n@${memberNumber} foi removido do grupo.`,
                                mentions: [memberId]
                            });
                            
                            // Notificar administradores
                            const admins = groupMetadata.participants.filter(p => p.admin && p.id !== memberId).map(p => p.id);
                            const dataHoraAdm = new Date().toLocaleString('pt-BR', { 
                                timeZone: 'America/Sao_Paulo',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                            
                            const adminNotification = `────── 🕒 ${dataHoraAdm} 🕒 ──────

🔥👮 *Atenção, Administradores!* 👮🔥
O sistema detectou e neutralizou uma violação nas regras do grupo.

Um usuário foi automaticamente penalizado pelo bot. Seguem os detalhes:

📌 *Informações do Usuário:*
• 🆔 ID: ${memberId}
• 📱 Número: ${formattedNumber}
• ⚠️ Motivo: ${banReason}

🚫 A ação automática foi executada conforme as políticas do grupo.
Os administradores podem revisar o caso e decidir por medidas adicionais, se necessário. ⚖️

🔍 Recomendação: Verificar o histórico do grupo para mais detalhes.

────── 🕒 ${dataHoraAdm} 🕒 ──────`;
                            
                            for (const adminId of admins) {
                                await sock.sendMessage(adminId, { text: adminNotification });
                            }
                            
                            console.log(`✅ Membro ${memberNumber} banido e administradores notificados`);
                        } catch (e) {
                            await sock.sendMessage(groupId, { text: `❌ Erro ao banir membro: ${e.message}` });
                            console.error('❌ Erro ao banir:', e.message);
                        }
                    }
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/banir @membro [motivo]`\n\nExemplos:\n• `/banir @pessoa`\n• `/banir @pessoa Spam excessivo`\n• `/banir @pessoa Desrespeito aos membros`' });
                }
            } else if (text.toLowerCase().includes('/bloqueartermo')) {
                const termo = text.replace(/\/bloqueartermo/i, '').trim();
                if (termo) {
                    const result = addBlockedWord(termo);
                    
                    if (result.success) {
                        const dataHora = new Date().toLocaleString('pt-BR', { 
                            timeZone: 'America/Sao_Paulo',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        // Buscar número do admin
                        const groupMetadata = await sock.groupMetadata(groupId);
                        const adminParticipant = groupMetadata.participants.find(p => p.id === senderId);
                        let adminNumber = senderId.split('@')[0];
                        if (adminParticipant && adminParticipant.jid) {
                            adminNumber = adminParticipant.jid.split('@')[0];
                        }
                        
                        // Formatar número
                        let formattedAdmin = adminNumber;
                        if (adminNumber.length >= 12) {
                            const country = adminNumber.substring(0, 2);
                            const ddd = adminNumber.substring(2, 4);
                            const part1 = adminNumber.substring(4, 8);
                            const part2 = adminNumber.substring(8);
                            formattedAdmin = `+${country} (${ddd}) ${part1}-${part2}`;
                        }
                        
                        const confirmMsg = `✅ *_TERMO PROIBIDO BLOQUEADO COM SUCESSO_* ✅

_🔒 O sistema de segurança do bot bloqueou um termo proibido._
_Esta notificação foi enviada automaticamente aos administradores._

*📌 Detalhes do bloqueio:*
• ❗ Termo: ${termo}
• 👮 Admin Bloqueador: ${formattedAdmin}
• 🗓️ Data e Hora: ${dataHora}

☑️ Confirmação: O termo foi identificado e removido!`;
                        
                        // Enviar para todos os administradores no PV
                        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                        for (const adminId of admins) {
                            await sock.sendMessage(adminId, { text: confirmMsg });
                        }
                        
                        // Confirmação simples no grupo
                        await sock.sendMessage(groupId, { text: `✅ Termo "${termo}" bloqueado com sucesso!` });
                    } else {
                        await sock.sendMessage(groupId, { text: `⚠️ ${result.message}` });
                    }
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/bloqueartermo palavra`\n\nExemplo: `/bloqueartermo spam`' });
                }
            } else if (text.toLowerCase().includes('/bloquearlink')) {
                const link = text.replace(/\/bloquearlink/i, '').trim();
                if (link) {
                    const result = addBlockedLink(link);
                    
                    if (result.success) {
                        const dataHora = new Date().toLocaleString('pt-BR', { 
                            timeZone: 'America/Sao_Paulo',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        
                        // Buscar número do admin
                        const groupMetadata = await sock.groupMetadata(groupId);
                        const adminParticipant = groupMetadata.participants.find(p => p.id === senderId);
                        let adminNumber = senderId.split('@')[0];
                        if (adminParticipant && adminParticipant.jid) {
                            adminNumber = adminParticipant.jid.split('@')[0];
                        }
                        
                        // Formatar número
                        let formattedAdmin = adminNumber;
                        if (adminNumber.length >= 12) {
                            const country = adminNumber.substring(0, 2);
                            const ddd = adminNumber.substring(2, 4);
                            const part1 = adminNumber.substring(4, 8);
                            const part2 = adminNumber.substring(8);
                            formattedAdmin = `+${country} (${ddd}) ${part1}-${part2}`;
                        }
                        
                        const confirmMsg = `✅ *_LINK PROIBIDO BLOQUEADO COM SUCESSO_* ✅

_🔒 O sistema de segurança do bot bloqueou um link proibido._
_Esta notificação foi enviada automaticamente aos administradores._

*📌 Detalhes do bloqueio:*
• ❗ Link: ${link}
• 👮 Admin Bloqueador: ${formattedAdmin}
• 🗓️ Data e Hora: ${dataHora}

☑️ Confirmação: O link foi identificado e removido!`;
                        
                        // Enviar para todos os administradores no PV
                        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
                        for (const adminId of admins) {
                            await sock.sendMessage(adminId, { text: confirmMsg });
                        }
                        
                        // Confirmação simples no grupo
                        await sock.sendMessage(groupId, { text: `✅ Link "${link}" bloqueado com sucesso!` });
                    } else {
                        await sock.sendMessage(groupId, { text: `⚠️ ${result.message}` });
                    }
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/bloquearlink dominio`\n\nExemplo: `/bloquearlink exemplo.com`' });
                }
            } else if (text.toLowerCase().includes('/comandos')) {
                const comandosMsg = `🤖 *LISTA COMPLETA DE COMANDOS - iMavyBot* 🤖
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👮 *COMANDOS ADMINISTRATIVOS:*

• 🔒 */fechar* - Fecha o grupo
• 🔓 */abrir* - Abre o grupo
• 📌 */fixar [mensagem]* - Fixa mensagem importante
• 🚫 */banir @membro [motivo]* - Remove e bane membro
• 🚫 */bloqueartermo [palavra]* - Bloqueia palavra
• 🔗 */bloquearlink [dominio]* - Bloqueia link/domínio
• ✏️ */removertermo [palavra]* - Remove palavra bloqueada
• 🔓 */removerlink [dominio]* - Remove link bloqueado
• 📝 */listatermos* - Lista termos e links bloqueados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 *COMANDOS DE INFORMAÇÃO:*

• 📊 */status* - Status e estatísticas do grupo
• 📋 */regras* - Exibe regras do grupo
• 📱 */comandos* - Lista todos os comandos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📺 *COMANDOS IPTV:*

• 📺 */lista* - Lista testes IPTV disponíveis
• 📺 */1 a /10* - Gera teste IPTV específico
• 🧪 */testeiptv* - Teste manual IPTV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 *COMANDOS DO BOT:*

• 👋 *bot oi* - Saudação
• ❓ *bot ajuda* - Ajuda rápida
• ✅ *bot status* - Status do bot
• ℹ️ *bot info* - Informações do bot
• 🤖 */gpt [pergunta]* - Pergunte ao ChatGPT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 *COMANDOS DE TESTE:*

• 🎉 */testar_boasvindas* - Testa mensagem de boas-vindas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 *Sistema de Segurança Ativo*
• Anti-spam automático
• Sistema de strikes (3 = expulsão)
• Bloqueio de links e palavras proibidas
• Notificação automática aos admins
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *iMavyBot v2.0* - Protegendo seu grupo 24/7`;
                
                await sock.sendMessage(groupId, { text: comandosMsg });
            } else if (text.toLowerCase().includes('/removertermo')) {
                const termo = text.replace(/\/removertermo/i, '').trim();
                if (termo) {
                    const result = removeBlockedWord(termo);
                    const emoji = result.success ? '✅' : '⚠️';
                    await sock.sendMessage(groupId, { text: `${emoji} ${result.message}` });
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/removertermo palavra`\n\nExemplo: `/removertermo spam`' });
                }
            } else if (text.toLowerCase().includes('/removerlink')) {
                const link = text.replace(/\/removerlink/i, '').trim();
                if (link) {
                    const result = removeBlockedLink(link);
                    const emoji = result.success ? '✅' : '⚠️';
                    await sock.sendMessage(groupId, { text: `${emoji} ${result.message}` });
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/removerlink dominio`\n\nExemplo: `/removerlink exemplo.com`' });
                }
            } else if (text.toLowerCase().includes('/listatermos')) {
                const blacklist = getCustomBlacklist();
                const totalWords = blacklist.words.length;
                const totalLinks = blacklist.links.length;
                
                let listaMsg = `📝 *TERMOS E LINKS BLOQUEADOS* 📝
━━━━━━━━━━━━━━━━━━━━━━━

`;
                
                if (totalWords > 0) {
                    listaMsg += `🚫 *Palavras Bloqueadas:*\n\n`;
                    blacklist.words.forEach((word, index) => {
                        listaMsg += `${index + 1}. ${word}\n`;
                    });
                    listaMsg += `\n`;
                } else {
                    listaMsg += `🚫 *Palavras Bloqueadas:* Nenhuma\n\n`;
                }
                
                if (totalLinks > 0) {
                    listaMsg += `🔗 *Links Bloqueados:*\n\n`;
                    blacklist.links.forEach((link, index) => {
                        listaMsg += `${index + 1}. ${link}\n`;
                    });
                    listaMsg += `\n`;
                } else {
                    listaMsg += `🔗 *Links Bloqueados:* Nenhum\n\n`;
                }
                
                listaMsg += `━━━━━━━━━━━━━━━━━━━━━━━
📊 *Total:* ${totalWords + totalLinks} bloqueios personalizados`;
                
                await sock.sendMessage(groupId, { text: listaMsg });
            } else if (text.toLowerCase().includes('/gpt')) {
                const pergunta = text.replace(/\/gpt/i, '').trim();
                if (pergunta) {
                    const resposta = await askChatGPT(pergunta, senderId);
                    await sock.sendMessage(groupId, { text: resposta });
                } else {
                    await sock.sendMessage(groupId, { text: '❌ *Uso incorreto!*\n\n📝 Use: `/gpt sua pergunta`\n\nExemplo: `/gpt O que é inteligência artificial?`' });
                }
            } else if (text.toLowerCase().includes('/status')) {
                console.log('📊 ➜ Comando /status executado');
                const statusMessage = await getGroupStatus(sock, groupId);
                console.log('📊 ➜ Mensagem de status gerada');
                const msgStatus = await sock.sendMessage(groupId, { text: statusMessage });
                console.log(msgStatus ? '✅ Status enviado com sucesso' : '❌ Falha ao enviar status');
            } else if (text.toLowerCase().includes('/lista')) {
                const listaMessage = `🎬 LISTA DE TESTES IPTV DISPONÍVEIS (6 HORAS)

Olá! 👋
Aqui estão os testes disponíveis no momento.
Digite o número da opção (ou o comando / correspondente) para gerar seu teste automático:

/1️⃣ TESTE IPTV 🔞 C/ ADULTOS
/2️⃣ TESTE IPTV 🚫 S/ ADULTOS

/3️⃣ TESTE ASSIST+ 🔞 C/ ADULTOS [ROKU - LG - SAMSUNG]
/4️⃣ TESTE ASSIST+ 🚫 S/ ADULTOS [ROKU - LG - SAMSUNG]

/5️⃣ TESTE BRASIL IPTV 🔞 C/ ADULTOS [ROKU - LG - SAMSUNG]
/6️⃣ TESTE BRASIL IPTV 🚫 S/ ADULTOS [ROKU - LG - SAMSUNG]

/7️⃣ TESTE FLEXPLAY 🔞 C/ ADULTOS [ROKU - LG - SAMSUNG]
/8️⃣ TESTE FLEXPLAY 🚫 S/ ADULTOS [ROKU - LG - SAMSUNG]

/9️⃣ TESTE ANDROID 🔞 C/ ADULTO [TV BOX - TV ANDROID - CELULAR]
/1️⃣0️⃣ TESTE ANDROID 🚫 S/ ADULTO [TV BOX - TV ANDROID - CELULAR]

🕒 Validade: 6 HORAS
💡 Digite o comando (ex: /1) para gerar seu teste agora.
📶 Servidores 100% estáveis e atualizados!`;
                const msgLista = await sock.sendMessage(groupId, { text: listaMessage });
                console.log(msgLista ? '✅ Lista enviada com sucesso' : '❌ Falha ao enviar lista');
            } else if (text.toLowerCase().includes('/testeiptv')) {
                // Este comando será processado pelo index.js
                return;
            }
        } catch (err) {
            console.error('❌ Erro ao executar comando:', err);
        }
        return;
    }

    if (!text || !text.toLowerCase().includes(BOT_TRIGGER)) return;

    // Busca resposta pré-definida
    const command = text.toLowerCase().replace(BOT_TRIGGER, '').trim();
    const reply = RESPONSES[command] || '❓ Comando não reconhecido. Digite "bot ajuda" para ver os comandos.';

    const msgResposta = await sock.sendMessage(groupId, { text: reply }, { quoted: message });
    console.log(msgResposta ? `✅ Resposta enviada: ${reply}` : `❌ Falha ao enviar: ${reply}`);
}