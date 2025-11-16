export async function sendWelcomeMessage(sock, groupId, newMemberJid) {
    try {
        // Obter informações do grupo
        const groupMetadata = await sock.groupMetadata(groupId);
        const groupName = groupMetadata.subject;
        
        // Obter nome do usuário
        const userNumber = newMemberJid.split('@')[0];
        
        const welcomeText = `🎉 Seja muito bem-vindo(a)! 🎉
━━━━━━━━━━━━━━━━━━━━━━━
👋 Olá, @${userNumber}!
É um prazer ter você aqui no grupo ${groupName} 💬

Antes de começar a interagir:
📜 Leia as regras: /regras
🧠 Conheça os comandos: /menu

✨ Mantenha o respeito, compartilhe boas ideias e aproveite o espaço!
Lembre-se: a convivência saudável depende de todos nós 💪

━━━━━━━━━━━━━━━━━━━━━━━
🤖 Mensagem automática enviada por: iMavyBot
💡 Dica: Envie um "oi" para testar o sistema de boas-vindas!
━━━━━━━━━━━━━━━━━━━━━━━`;
        
        await sock.sendMessage(groupId, { 
            text: welcomeText,
            mentions: [newMemberJid]
        });
        
        console.log(`✅ Mensagem de boas-vindas enviada para ${userNumber} no grupo ${groupName}`);
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem de boas-vindas:', error);
    }
}
