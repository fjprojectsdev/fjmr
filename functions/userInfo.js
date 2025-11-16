// Sistema de Identificação de Usuários

export async function getUserName(sock, userId, groupId = null) {
    try {
        // Tentar obter nome do contato salvo
        const contact = await sock.onWhatsApp(userId);
        if (contact && contact[0]?.notify) {
            return contact[0].notify;
        }
        
        // Se estiver em grupo, pegar nome do participante
        if (groupId) {
            const groupMetadata = await sock.groupMetadata(groupId);
            const participant = groupMetadata.participants.find(p => p.id === userId);
            if (participant?.notify) {
                return participant.notify;
            }
        }
        
        // Fallback: usar número
        return userId.split('@')[0];
        
    } catch (error) {
        console.error('❌ Erro ao obter nome:', error.message);
        return userId.split('@')[0];
    }
}

export function formatUserMention(userName, userId) {
    const userNumber = userId.split('@')[0];
    return `${userName} (@${userNumber})`;
}
