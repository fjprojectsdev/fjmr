// Sistema de Estatísticas do Grupo

const groupStats = {
    totalViolations: 0,
    linksBlocked: 0,
    wordsBlocked: 0,
    lastReset: Date.now()
};

export function incrementViolation(type) {
    groupStats.totalViolations++;
    
    if (type.includes('link')) {
        groupStats.linksBlocked++;
    } else {
        groupStats.wordsBlocked++;
    }
    
    console.log('📊 STATS ATUALIZADAS:', {
        total: groupStats.totalViolations,
        links: groupStats.linksBlocked,
        words: groupStats.wordsBlocked
    });
}

export function getStats() {
    return {
        totalViolations: groupStats.totalViolations,
        linksBlocked: groupStats.linksBlocked,
        wordsBlocked: groupStats.wordsBlocked,
        lastReset: groupStats.lastReset
    };
}

export function resetDailyStats() {
    groupStats.totalViolations = 0;
    groupStats.linksBlocked = 0;
    groupStats.wordsBlocked = 0;
    groupStats.lastReset = Date.now();
    console.log('📊 Estatísticas diárias resetadas');
}

export async function getGroupStatus(sock, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        
        const totalMembers = participants.length;
        const admins = participants.filter(p => p.admin).length;
        
        const stats = getStats();
        const horasDesdeReset = Math.floor((Date.now() - stats.lastReset) / (1000 * 60 * 60));
        
        const statusMessage = `📊 *STATUS DO GRUPO* 📊
━━━━━━━━━━━━━━━━━━━━━━━

👥 *Membros:* ${totalMembers}
👮 *Administradores:* ${admins}
📈 *Atividade:* ${totalMembers > 50 ? 'Alta' : totalMembers > 20 ? 'Média' : 'Baixa'}

━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *SEGURANÇA (últimas ${horasDesdeReset}h)*

⚠️ *Violações totais:* ${stats.totalViolations}
🔗 *Links bloqueados:* ${stats.linksBlocked}
🚫 *Palavras bloqueadas:* ${stats.wordsBlocked}

━━━━━━━━━━━━━━━━━━━━━━━
🤖 *Bot:* iMavyBot v2.0
✅ *Status:* Online e protegendo o grupo!`;

        return statusMessage;
        
    } catch (error) {
        console.error('❌ Erro ao obter status:', error);
        return '❌ Erro ao obter status do grupo.';
    }
}

// Resetar estatísticas a cada 24 horas
setInterval(() => {
    resetDailyStats();
}, 24 * 60 * 60 * 1000);
