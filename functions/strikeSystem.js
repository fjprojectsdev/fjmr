// Sistema de Strikes e Moderação Automática
// 1 strike = Aviso
// 2 strikes = Aviso severo (última chance)
// 3 strikes = Expulsão automática

import { getUserName } from './userInfo.js';

const userStrikes = new Map(); // userId -> { count, violations: [] }

export function addStrike(userId, violation) {
    if (!userStrikes.has(userId)) {
        userStrikes.set(userId, { count: 0, violations: [] });
    }
    
    const userData = userStrikes.get(userId);
    userData.count++;
    userData.violations.push({
        type: violation.type,
        message: violation.message,
        date: new Date().toISOString()
    });
    
    return userData.count;
}

export function getStrikes(userId) {
    return userStrikes.get(userId)?.count || 0;
}

export function resetStrikes(userId) {
    userStrikes.delete(userId);
}

export async function applyPunishment(sock, groupId, userId, strikeCount) {
    const userNumber = userId.split('@')[0];
    const userName = await getUserName(sock, userId, groupId);
    
    try {
        if (strikeCount === 1) {
            // 1ª violação: Aviso
            const avisoMsg = `⚠️ *PRIMEIRO AVISO* ⚠️

@${userNumber}, você recebeu seu primeiro aviso por violar as regras do grupo.

📌 *Strikes:* 1/3
⚠️ Não viole regras
🚫 *3 violações:* Expulsão automática do grupo

Por favor, respeite as regras!`;

            await sock.sendMessage(groupId, { 
                text: avisoMsg,
                mentions: [userId]
            });
            
            console.log(`⚠️ Strike 1/3 aplicado para ${userNumber}`);
            
        } else if (strikeCount === 2) {
            // 2ª violação: Aviso severo
            const avisoMsg = `🚨 *SEGUNDO AVISO - ÚLTIMA CHANCE* 🚨

@${userNumber}, você recebeu seu segundo aviso!

📌 *Strikes:* 2/3
⚠️ *Próxima violação:* EXPULSÃO AUTOMÁTICA DO GRUPO
🚫 *Esta é sua última chance!*

Respeite as regras ou será removido permanentemente!`;

            await sock.sendMessage(groupId, { 
                text: avisoMsg,
                mentions: [userId]
            });
            
            console.log(`🚨 Strike 2/3 aplicado para ${userNumber} - ÚLTIMA CHANCE`);
            
        } else if (strikeCount >= 3) {
            // 3ª violação: Expulsão
            const avisoMsg = `🚫 *EXPULSÃO AUTOMÁTICA* 🚫

@${userNumber} foi expulso do grupo por acumular 3 violações.

📌 *Strikes:* 3/3
⚠️ *Motivo:* Múltiplas violações das regras
🚫 *Ação:* Expulsão permanente

As regras existem para manter a ordem do grupo!`;

            await sock.sendMessage(groupId, { 
                text: avisoMsg,
                mentions: [userId]
            });
            
            // Remover do grupo
            await sock.groupParticipantsUpdate(groupId, [userId], 'remove');
            
            console.log(`🚫 Strike 3/3 aplicado para ${userNumber} - EXPULSO`);
            
            // Resetar strikes após expulsão
            resetStrikes(userId);
        }
        
    } catch (error) {
        console.error('❌ Erro ao aplicar punição:', error.message);
    }
}

export function getViolationHistory(userId) {
    return userStrikes.get(userId)?.violations || [];
}

// Limpar strikes antigos (opcional - após 7 dias)
export function cleanOldStrikes() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const [userId, userData] of userStrikes.entries()) {
        const recentViolations = userData.violations.filter(v => 
            new Date(v.date) > sevenDaysAgo
        );
        
        if (recentViolations.length === 0) {
            userStrikes.delete(userId);
        } else {
            userData.violations = recentViolations;
            userData.count = recentViolations.length;
        }
    }
    
    console.log('🧹 Strikes antigos limpos');
}
