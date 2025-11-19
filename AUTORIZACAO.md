# 🔐 SISTEMA DE AUTORIZAÇÃO - Guia Completo

## 📋 **FORMAS DE AUTORIZAR USUÁRIOS PARA COMANDOS ADMINISTRATIVOS**

O bot suporta **múltiplas formas** de autorização, combinadas para máxima flexibilidade:

---

## 🎯 **MÉTODOS DE AUTORIZAÇÃO DISPONÍVEIS:**

### **1️⃣ Variáveis de Ambiente (.env)** ⭐ Recomendado para produção

**Vantagens:**
- ✅ Seguro (não é commitado no Git)
- ✅ Fácil de gerenciar em servidores na nuvem
- ✅ Prioridade mais alta (verificado primeiro)

**Como configurar:**

Crie/edite o arquivo `.env`:

```env
# IDs separados por vírgula
AUTHORIZED_IDS=227349882745008@lid,225919675449527@lid,5564993344024
```

**Formatos aceitos:**
- JID completo: `227349882745008@lid`
- Número puro: `5564993344024`
- Misturado: `227349882745008@lid,5564993344024`

---

### **2️⃣ Arquivo JSON (admins.json)** ⭐ Recomendado para gestão dinâmica

**Vantagens:**
- ✅ Pode ser modificado via comandos do bot
- ✅ Fácil de visualizar e editar manualmente
- ✅ Persistente entre reinicializações

**Como configurar:**

Crie o arquivo `admins.json`:

```json
{
  "admins": [
    "227349882745008@lid",
    "225919675449527@lid",
    "5564993344024"
  ],
  "lastUpdate": "2024-01-01T00:00:00.000Z"
}
```

**Formato:** Array de strings com JIDs ou números

---

### **3️⃣ Administradores do Grupo WhatsApp** ⚠️ Opcional (precisa ser habilitado)

**Vantagens:**
- ✅ Automático (usa permissões do WhatsApp)
- ✅ Sincroniza com grupo

**Como habilitar:**

Você precisa modificar o código para usar `checkAuth()` com `allowGroupAdmins: true`:

```javascript
import { checkAuth } from './functions/authManager.js';

// Verificar autorização permitindo admins do grupo
const authorized = await checkAuth(sock, senderId, groupId, {
    allowGroupAdmins: true,  // Permitir admins do grupo
    requireAuth: true         // Requer autorização
});
```

**⚠️ Atenção:** Isso permite que QUALQUER admin do grupo use comandos administrativos!

---

## 📝 **COMANDOS ADMINISTRATIVOS DO BOT**

Os seguintes comandos requerem autorização:

### **Comandos que JÁ verificam autorização:**
- `/adicionargrupo` - Adiciona grupo à lista permitida
- `/removergrupo` - Remove grupo da lista permitida
- `/listargrupos` - Lista grupos permitidos

### **Comandos que DEVEM verificar (ainda não implementado):**
- `/fechar` - Fecha o grupo
- `/abrir` - Abre o grupo
- `/fixar [mensagem]` - Fixa mensagem importante
- `/banir @membro [motivo]` - Bane membro do grupo
- `/bloqueartermo [palavra]` - Bloqueia palavra proibida
- `/bloquearlink [dominio]` - Bloqueia link/domínio
- `/removertermo [palavra]` - Remove palavra bloqueada
- `/removerlink [dominio]` - Remove link bloqueado
- `/listatermos` - Lista termos e links bloqueados

---

## 🆕 **NOVOS COMANDOS DE GESTÃO DE ADMINS**

### **`/adicionaradmin @usuario`** 
Adiciona um novo administrador ao bot.

**Uso:**
```
/adicionaradmin @5564993344024
/adicionaradmin 5564993344024@c.us
```

**Requisitos:**
- Apenas admins existentes podem adicionar
- Funciona via PV ou grupo

---

### **`/removeradmin @usuario`**
Remove um administrador do bot.

**Uso:**
```
/removeradmin @5564993344024
/removeradmin 5564993344024@c.us
```

**Requisitos:**
- Apenas admins existentes podem remover
- Não pode remover a si mesmo

---

### **`/listaradmins`**
Lista todos os administradores do bot.

**Resposta mostra:**
- Admins do `.env` (marcados como "ENV")
- Admins do `admins.json` (marcados como "JSON")

---

## 🔄 **ORDEM DE VERIFICAÇÃO DE AUTORIZAÇÃO**

O bot verifica nesta ordem (primeira que retornar `true` autoriza):

```
1. Variáveis de Ambiente (.env)
   ↓ (se não encontrado)
2. Arquivo JSON (admins.json)
   ↓ (se não encontrado)
3. Admin do Grupo WhatsApp (se habilitado)
   ↓ (se não encontrado)
4. ❌ NÃO AUTORIZADO
```

---

## 💡 **EXEMPLOS DE USO**

### **Exemplo 1: Autorização via .env (Produção)**

```env
# .env
AUTHORIZED_IDS=227349882745008@lid,5564993344024
```

✅ Usuários autorizados automaticamente ao iniciar o bot

---

### **Exemplo 2: Autorização dinâmica via arquivo**

```bash
# Criar admins.json manualmente
{
  "admins": ["227349882745008@lid"]
}
```

✅ Admin pode adicionar outros via `/adicionaradmin`

---

### **Exemplo 3: Híbrido (.env + JSON)**

```env
# .env - Admins principais (sempre autorizados)
AUTHORIZED_IDS=227349882745008@lid
```

```json
// admins.json - Admins temporários/secundários
{
  "admins": ["5564993344024", "5511999999999"]
}
```

✅ Combinação de ambos os métodos

---

## 🔒 **SEGURANÇA**

### **Recomendações:**

1. **Produção:**
   - Use `.env` para admins principais
   - Use `admins.json` para admins secundários
   - ⚠️ NUNCA commite `.env` ou `admins.json`

2. **Desenvolvimento:**
   - Use `admins.json` para testes
   - Facilita adicionar/remover admins

3. **Backup:**
   - Mantenha backup do `admins.json`
   - Anote os IDs principais em local seguro

---

## 🛠️ **IMPLEMENTAÇÃO EM COMANDOS**

### **Como verificar autorização em um comando:**

```javascript
import { checkAuth } from './functions/authManager.js';

// Em um comando administrativo:
const authorized = await checkAuth(sock, senderId, groupId, {
    allowGroupAdmins: false,  // Não permitir admins do grupo
    requireAuth: true         // Requer autorização
});

if (!authorized) {
    await sock.sendMessage(groupId, { 
        text: '❌ Você não tem permissão para usar este comando.' 
    });
    return;
}

// Continuar com o comando...
```

### **Verificação simples (apenas bot admins):**

```javascript
import { isAuthorized } from './functions/authManager.js';

if (!await isAuthorized(senderId)) {
    // Não autorizado
    return;
}
```

---

## 📊 **ESTATÍSTICAS E MONITORAMENTO**

Use a função `getAdminStats()` para verificar:

```javascript
import { getAdminStats } from './functions/authManager.js';

const stats = await getAdminStats();
console.log('Total de admins:', stats.total);
console.log('Do .env:', stats.fromEnv);
console.log('Do JSON:', stats.fromFile);
```

---

## ❓ **FAQ**

### **P: Posso usar apenas .env?**
✅ Sim! Apenas configure `AUTHORIZED_IDS` no `.env`

### **P: Posso usar apenas admins.json?**
✅ Sim! Crie o arquivo `admins.json` e configure os admins lá

### **P: O que acontece se usar ambos?**
✅ Os dois são verificados, então admins em qualquer um dos métodos funcionam

### **P: Posso adicionar admin via comando sem ser admin?**
❌ Não! Apenas admins existentes podem adicionar outros

### **P: Como remover um admin do .env?**
📝 Edite manualmente o arquivo `.env` e reinicie o bot

### **P: Como remover um admin do admins.json?**
✅ Use o comando `/removeradmin` ou edite manualmente o arquivo

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Configure o `.env`** com seus IDs principais
2. **Crie `admins.json`** se quiser gestão dinâmica
3. **Teste os comandos** `/adicionaradmin` e `/listaradmins`
4. **Implemente verificação** nos outros comandos administrativos (se necessário)

---

**✅ Resumo:** Você tem 3 formas de autorizar usuários:
1. **Variáveis de ambiente** (.env) - Melhor para produção
2. **Arquivo JSON** (admins.json) - Melhor para gestão dinâmica
3. **Admins do grupo WhatsApp** - Opcional, requer código

