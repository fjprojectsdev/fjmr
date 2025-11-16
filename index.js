// index.js
import 'dotenv/config';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, getContentType } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendWelcomeMessage } from './functions/welcomeMessage.js';
import { processarSolicitacaoIPTV } from './functions/iptvServiceMelhorado.js';
import { checkViolation, notifyAdmins, notifyUser, logViolation } from './functions/antiSpam.js';
import { addStrike, applyPunishment } from './functions/strikeSystem.js';
import { incrementViolation, getGroupStatus } from './functions/groupStats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { handleGroupMessages } from './functions/groupResponder.js';
import { scheduleGroupMessages } from './functions/scheduler.js';

async function startBot() {
    console.log("===============================================");
    console.log("🚀 Iniciando iMavyBot - Respostas Pré-Definidas");
    console.log("===============================================");



    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && connection !== 'open') {
            console.log("🚨 Escaneie este QR code no WhatsApp:");
            qrcode.generate(qr, { small: true });
        }

        console.log('📡 Status da conexão:', connection);

        if (connection === 'open') {
            console.log('✅ Conectado ao WhatsApp com sucesso!');
            botStartTime = Date.now();
            console.log('⏰ Ignorando mensagens anteriores a:', new Date(botStartTime).toLocaleString('pt-BR'));
            // Ativa o agendador (fechar e abrir grupo)
            scheduleGroupMessages(sock);
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log('Motivo do fechamento:', reason);

            if (reason === DisconnectReason.loggedOut) {
                console.log('⚠️ Sessão desconectada. Escaneie o QR novamente.');
            } else {
                console.log('🔄 Reconectando em 5 segundos...');
                setTimeout(() => startBot(), 5000);
            }
        }
    });

    let botStartTime = Date.now();

    // Evento de mensagens recebidas
    sock.ev.on('messages.upsert', async (msgUpsert) => {
        const messages = msgUpsert.messages;

        for (const message of messages) {
            if (!message.key.fromMe && message.message) {
                const messageTime = message.messageTimestamp * 1000;
                
                // Ignorar mensagens antigas (anteriores ao bot iniciar)
                if (messageTime < botStartTime) {
                    console.log('⏭️ Mensagem antiga ignorada');
                    continue;
                }

                const senderId = message.key.participant || message.key.remoteJid;
                const isGroup = message.key.remoteJid.endsWith('@g.us');
                const groupId = isGroup ? message.key.remoteJid : null;

                const contentType = getContentType(message.message);
                const content = message.message[contentType];

                console.log('\n╔════════════════════════════════════════════════════════════╗');
                console.log('║           📨 NOVA MENSAGEM RECEBIDA                       ║');
                console.log('╠════════════════════════════════════════════════════════════╣');
                console.log('║ 📋 Tipo:', contentType.padEnd(45), '║');
                console.log('║ 👤 De:', senderId.substring(0, 45).padEnd(47), '║');
                if (groupId) console.log('║ 👥 Grupo:', groupId.substring(0, 42).padEnd(44), '║');
                console.log('║ 💬 Texto:', (content?.text || 'N/A').substring(0, 43).padEnd(45), '║');
                console.log('╚════════════════════════════════════════════════════════════╝\n');

                const messageText = content?.text || content;
                
                // Ignorar anti-spam para comandos administrativos
                const isAdminCommand = messageText && typeof messageText === 'string' && (
                    messageText.toLowerCase().includes('/removertermo') ||
                    messageText.toLowerCase().includes('/removerlink') ||
                    messageText.toLowerCase().includes('/bloqueartermo') ||
                    messageText.toLowerCase().includes('/bloquearlink') ||
                    messageText.toLowerCase().includes('/listatermos')
                );
                
                if (isAdminCommand) {
                    console.log('⚙️ Comando administrativo detectado, pulando anti-spam');
                    await handleGroupMessages(sock, message);
                    continue;
                }

                // Verificar violações (anti-spam)
                console.log('🔍 DEBUG: Verificando anti-spam...');
                console.log('🔍 isGroup:', isGroup);
                console.log('🔍 messageText:', messageText);
                console.log('🔍 typeof:', typeof messageText);
                
                if (isGroup && typeof messageText === 'string') {
                    console.log('🔍 Executando checkViolation...');
                    const violation = checkViolation(messageText);
                    console.log('🔍 Resultado:', violation);
                    
                    if (violation.violated) {
                        console.log('\n🚨 ═══════════════════════════════════════════════════════');
                        console.log('🚨 VIOLAÇÃO DETECTADA!');
                        console.log('🚨 Tipo:', violation.type);
                        console.log('🚨 Usuário:', senderId);
                        console.log('🚨 Mensagem:', messageText.substring(0, 50));
                        console.log('🚨 ═══════════════════════════════════════════════════════\n');
                        
                        // Deletar mensagem
                        try {
                            await sock.sendMessage(groupId, {
                                delete: message.key
                            });
                            console.log('✅ ➜ Mensagem deletada com sucesso');
                        } catch (e) {
                            console.error('❌ ➜ Erro ao deletar mensagem:', e.message);
                        }
                        
                        // Obter informações do usuário
                        const userNumber = senderId.split('@')[0];
                        const violationData = {
                            userName: userNumber,
                            userId: senderId,
                            userNumber: userNumber,
                            dateTime: new Date().toLocaleString('pt-BR'),
                            message: messageText
                        };
                        
                        // Notificar admins
                        console.log('📢 ➜ Notificando administradores...');
                        await notifyAdmins(sock, groupId, violationData);
                        
                        // Notificar usuário
                        console.log('📩 ➜ Notificando usuário infrator...');
                        await notifyUser(sock, senderId, groupId, messageText);
                        
                        // Registrar violação
                        logViolation(violationData);
                        incrementViolation(violation.type);
                        
                        // Sistema de strikes
                        console.log('⚖️ ➜ Aplicando sistema de strikes...');
                        const strikeCount = addStrike(senderId, { type: violation.type, message: messageText });
                        console.log(`📊 ➜ Usuário agora tem ${strikeCount} strike(s)`);
                        
                        // Aplicar punição baseada no número de strikes
                        await applyPunishment(sock, groupId, senderId, strikeCount);
                        
                        console.log('✅ ➜ Violação processada completamente\n');
                        
                        continue; // Pular processamento normal
                    }
                }

                await handleGroupMessages(sock, message);
                
                // Comandos para gerar teste IPTV
                const tiposIPTV = ['/1', '/2', '/3', '/4', '/5', '/6', '/7', '/8', '/9', '/10'];
                
                if (isGroup && tiposIPTV.includes(messageText)) {
                    console.log('\n📺 ═══════════════════════════════════════════════════════');
                    console.log('📺 SOLICITAÇÃO DE TESTE IPTV');
                    console.log('📺 Tipo:', messageText);
                    console.log('📺 Usuário:', senderId);
                    console.log('📺 ═══════════════════════════════════════════════════════\n');
                    
                    console.log('⏳ ➜ Enviando mensagem de aguarde...');
                    const msgAguarde = await sock.sendMessage(groupId, { text: '⏳ Gerando seu teste IPTV, aguarde...' });
                    console.log(msgAguarde ? '✅ ➜ Mensagem enviada' : '❌ ➜ Falha ao enviar');
                    
                    console.log('🔄 ➜ Processando automação IPTV...');
                    const resultado = await processarSolicitacaoIPTV(senderId, '', messageText);
                    
                    console.log('📤 ➜ Enviando credenciais IPTV...');
                    const msgTeste = await sock.sendMessage(groupId, { text: resultado.mensagem });
                    console.log(msgTeste ? '✅ ➜ Teste IPTV enviado com sucesso\n' : '❌ ➜ Falha ao enviar teste IPTV\n');
                }
                
                // Teste manual de boas-vindas
                if (isGroup && messageText === '/testar_boasvindas') {
                    console.log('\n🧪 ═══════════════════════════════════════════════════════');
                    console.log('🧪 TESTE DE BOAS-VINDAS');
                    console.log('🧪 ═══════════════════════════════════════════════════════\n');
                    const msgBoasVindas = await sendWelcomeMessage(sock, groupId, senderId);
                    console.log(msgBoasVindas ? '✅ ➜ Boas-vindas enviada\n' : '❌ ➜ Falha ao enviar boas-vindas\n');
                }
            }
        }
    });

    // Evento para detectar novos membros no grupo
    sock.ev.on('group-participants.update', async (update) => {
        try {
            console.log('📋 Atualização de participantes:', JSON.stringify(update, null, 2));
            const { id: groupId, participants, action } = update;
            
            if (action === 'add') {
                console.log('\n🎉 ═══════════════════════════════════════════════════════');
                console.log('🎉 NOVO MEMBRO DETECTADO');
                console.log('🎉 Grupo:', groupId);
                console.log('🎉 ═══════════════════════════════════════════════════════\n');
                
                for (const participant of participants) {
                    console.log('👤 ➜ Enviando boas-vindas para:', participant);
                    await sendWelcomeMessage(sock, groupId, participant);
                    console.log('✅ ➜ Boas-vindas enviada\n');
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay de 1s
                }
            }
        } catch (error) {
            console.error('❌ Erro no evento de participantes:', error);
        }
    });

    // Evento alternativo para capturar mudanças no grupo
    sock.ev.on('groups.update', async (updates) => {
        console.log('🔄 Atualização de grupos:', JSON.stringify(updates, null, 2));
    });
}

startBot();
