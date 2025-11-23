# 🚀 DEPLOY DASHBOARD - VERCEL

## ⚠️ IMPORTANTE:

**WebSocket NÃO funciona no Vercel** (serverless)

---

## ✅ OPÇÕES DE DEPLOY:

### 1️⃣ **VERCEL (Sem WebSocket)**
- ✅ Grátis
- ✅ Fácil
- ❌ Sem tempo real
- ✅ Atualiza a cada 30s

**Como fazer:**
```bash
cd dashboard
npm install -g vercel
vercel login
vercel
```

**Variáveis de ambiente:**
- `JWT_SECRET` = sua_chave_secreta
- `ADMIN_PASSWORD` = FJMR2025

---

### 2️⃣ **RAILWAY (COM WebSocket)** ⭐ RECOMENDADO
- ✅ WebSocket funciona
- ✅ Tempo real
- ✅ $5/mês (500h grátis)
- ✅ Deploy automático

**Como fazer:**
1. Acesse: https://railway.app
2. Login com GitHub
3. New Project → Deploy from GitHub
4. Selecione o repositório
5. Configure variáveis:
   - `JWT_SECRET` = sua_chave_secreta
   - `ADMIN_PASSWORD` = FJMR2025
   - `PORT` = 3000

---

### 3️⃣ **RENDER (COM WebSocket)**
- ✅ WebSocket funciona
- ✅ Grátis (com limitações)
- ⚠️ Dorme após 15min inativo

**Como fazer:**
1. Acesse: https://render.com
2. New → Web Service
3. Connect GitHub
4. Configure:
   - Build: `npm install`
   - Start: `node server.js`
5. Variáveis de ambiente

---

### 4️⃣ **HEROKU (COM WebSocket)**
- ✅ WebSocket funciona
- ⚠️ $7/mês (sem plano grátis)

---

## 📋 PREPARAR PARA DEPLOY:

### 1. Criar repositório GitHub:
```bash
cd dashboard
git init
git add .
git commit -m "Dashboard iMavyBot"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/imavy-dashboard.git
git push -u origin main
```

### 2. Adicionar .env.example:
```env
JWT_SECRET=sua_chave_secreta_aqui
ADMIN_PASSWORD=FJMR2025
PORT=3000
```

---

## 🔗 CONECTAR BOT AO DASHBOARD ONLINE:

No arquivo `.env` do bot:
```env
DASHBOARD_URL=https://seu-dashboard.railway.app
```

---

## 💡 RECOMENDAÇÃO:

**Use RAILWAY** para ter WebSocket funcionando!

Vercel é bom para sites estáticos, mas não suporta WebSocket.

---

## 🆘 PROBLEMAS COMUNS:

**WebSocket não conecta:**
- Vercel não suporta WebSocket
- Use Railway ou Render

**Dashboard não atualiza:**
- Verifique variáveis de ambiente
- Confirme que bot está rodando

**Erro 401:**
- Senha incorreta
- Verifique ADMIN_PASSWORD

---

## ✅ CHECKLIST DEPLOY:

- [ ] Criar repositório GitHub
- [ ] Subir código
- [ ] Criar conta Railway/Render
- [ ] Conectar GitHub
- [ ] Configurar variáveis
- [ ] Deploy
- [ ] Testar acesso
- [ ] Conectar bot

**Pronto para deploy! 🚀**
