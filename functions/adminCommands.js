import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { getNumberFromJid } from './utils.js';
import { isAuthorized, checkAuth } from './authManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED_GROUPS_FILE = path.join(__dirname, '..', 'allowed_groups.json');
const ALLOWED_USERS_FILE = path.join(__dirname, '..', 'allowed_users.json');

// Re-exportar isAuthorized para compatibilidade
export { isAuthorized, checkAuth };

async function readAllowedGroups() {
    try {
        const raw = await fs.readFile(ALLOWED_GROUPS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (e) {
        return [];
    }
}

async function writeAllowedGroups(list) {
    const data = JSON.stringify(list, null, 2);
    await fs.writeFile(ALLOWED_GROUPS_FILE, data, 'utf8');
}

async function readAllowedUsers() {
    try {
        const raw = await fs.readFile(ALLOWED_USERS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [];
    } catch (e) {
        return [];
    }
}

async function writeAllowedUsers(list) {
    const data = JSON.stringify(list, null, 2);
    await fs.writeFile(ALLOWED_USERS_FILE, data, 'utf8');
}

export async function addAllowedGroup(senderId, groupName) {
    if (!(await isAuthorized(senderId))) {
        return { success: false, message: '❌ Você não tem permissão para usar este comando.' };
    }

    if (!groupName || typeof groupName !== 'string' || !groupName.trim()) {
        return { success: false, message: '❌ Parâmetro inválido. Use: /adicionargrupo Nome do Grupo ou /adicionargrupo 5511999999999@c.us' };
    }

    const param = groupName.trim();

    try {
        // Se o parâmetro parecer um JID (contém '@'), salvamos como usuário permitido
        if (param.includes('@')) {
            const currentUsers = await readAllowedUsers();
            if (currentUsers.includes(param)) {
                return { success: false, message: `⚠️ O usuário "${param}" já está habilitado para o bot.` };
            }
            currentUsers.push(param);
            await writeAllowedUsers(currentUsers);
            return { success: true, message: `✅ Usuário "${param}" adicionado com sucesso à lista de permitidos.` };
        }

        // Caso contrário, salvamos como nome de grupo
        const name = param;
        const current = await readAllowedGroups();
        if (current.includes(name)) {
            return { success: false, message: `⚠️ O grupo "${name}" já está habilitado para o bot.` };
        }

        current.push(name);
        await writeAllowedGroups(current);
        return { success: true, message: `✅ Grupo "${name}" adicionado com sucesso à lista de grupos permitidos.` };
    } catch (e) {
        console.error('Erro ao adicionar permitido:', e);
        return { success: false, message: '❌ Falha ao salvar a alteração. Veja os logs do bot.' };
    }
}

export async function listAllowedGroups() {
    const groups = await readAllowedGroups();
    const users = await readAllowedUsers();

    // Retornar array combinado para compatibilidade com o handler existente
    const combined = [];
    for (const g of groups) combined.push(`Grupo: ${g}`);
    for (const u of users) combined.push(`Usuário: ${u}`);
    return combined;
}

export async function removeAllowedGroup(senderId, groupName) {
    if (!(await isAuthorized(senderId))) {
        return { success: false, message: '❌ Você não tem permissão para usar este comando.' };
    }

    if (!groupName || typeof groupName !== 'string' || !groupName.trim()) {
        return { success: false, message: '❌ Parâmetro inválido. Use: /removergrupo Nome do Grupo ou /removergrupo 5511999999999@c.us' };
    }

    const param = groupName.trim();

    try {
        if (param.includes('@')) {
            const currentUsers = await readAllowedUsers();
            const index = currentUsers.indexOf(param);
            if (index === -1) {
                return { success: false, message: `⚠️ O usuário "${param}" não está na lista de permitidos.` };
            }
            currentUsers.splice(index, 1);
            await writeAllowedUsers(currentUsers);
            return { success: true, message: `✅ Usuário "${param}" removido com sucesso da lista de permitidos.` };
        }

        const current = await readAllowedGroups();
        const index = current.indexOf(param);
        if (index === -1) {
            return { success: false, message: `⚠️ O grupo "${param}" não está na lista de permitidos.` };
        }

        current.splice(index, 1);
        await writeAllowedGroups(current);
        return { success: true, message: `✅ Grupo "${param}" removido com sucesso da lista de grupos permitidos.` };
    } catch (e) {
        console.error('Erro ao remover permitido:', e);
        return { success: false, message: '❌ Falha ao salvar alteração. Veja os logs do bot.' };
    }
}
