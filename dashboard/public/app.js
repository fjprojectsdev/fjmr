let token = localStorage.getItem('token');
let socket = null;

if (token) {
    document.getElementById('loginBox').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadDashboard();
    connectWebSocket();
}

function connectWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        showNotification('🔌 Conectado em tempo real', 'success');
    });
    
    socket.on('spam_detected', (data) => {
        showNotification(`🚨 Spam detectado: ${data.type}`, 'warning');
        loadDashboard();
    });
    
    socket.on('strike_added', () => {
        showNotification('⚠️ Strike adicionado', 'warning');
        loadDashboard();
    });
    
    socket.on('word_added', (data) => {
        showNotification(`✅ Palavra banida: ${data.word}`, 'success');
        loadDashboard();
    });
    
    socket.on('bot_status', (data) => {
        if (data.status === 'online') {
            showNotification('🤖 Bot online', 'success');
        }
    });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function login() {
    const password = document.getElementById('password').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    
    if (res.ok) {
        const data = await res.json();
        token = data.token;
        localStorage.setItem('token', token);
        document.getElementById('loginBox').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadDashboard();
        connectWebSocket();
    } else {
        document.getElementById('errorMsg').textContent = 'Senha incorreta!';
    }
}

function logout() {
    localStorage.removeItem('token');
    if (socket) socket.disconnect();
    location.reload();
}

async function loadDashboard() {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        const [stats, words, groups, admins, logs] = await Promise.all([
            fetch('/api/stats', { headers }).then(r => r.json()),
            fetch('/api/banned-words', { headers }).then(r => r.json()),
            fetch('/api/allowed-groups', { headers }).then(r => r.json()),
            fetch('/api/admins', { headers }).then(r => r.json()),
            fetch('/api/logs', { headers }).then(r => r.json())
        ]);

        document.getElementById('bannedWords').textContent = stats.bannedWords;
        document.getElementById('allowedGroups').textContent = stats.allowedGroups;
        document.getElementById('admins').textContent = stats.admins;
        document.getElementById('lembretes').textContent = stats.lembretes;

        document.getElementById('wordsList').innerHTML = words.length ? words.map(w => `
            <div class="list-item">
                <span>${w}</span>
                <button class="btn btn-danger btn-sm" onclick="removeWord('${w}')">Remover</button>
            </div>
        `).join('') : '<p class="empty-state">Nenhuma palavra banida</p>';

        document.getElementById('groupsList').innerHTML = groups.length ? groups.map(g => `
            <div class="list-item">
                <span>${g}</span>
                <button class="btn btn-danger btn-sm" onclick="removeGroup('${encodeURIComponent(g)}')">Remover</button>
            </div>
        `).join('') : '<p class="empty-state">Nenhum grupo permitido</p>';

        document.getElementById('adminsList').innerHTML = admins.length ? admins.map(a => `
            <div class="list-item">
                <span>${a}</span>
                <span class="badge badge-success">Ativo</span>
            </div>
        `).join('') : '<p class="empty-state">Nenhum administrador</p>';

        document.getElementById('logsList').innerHTML = logs.length ? logs.slice(0, 10).map(l => `
            <div class="log-item">
                <span class="log-time">${new Date(l.timestamp).toLocaleString('pt-BR')}</span>
                <span class="log-action">${l.action}</span>
            </div>
        `).join('') : '<p class="empty-state">Nenhum log disponível</p>';
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

async function addWord() {
    const word = document.getElementById('newWord').value.trim();
    if (!word) return;
    
    await fetch('/api/banned-words', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
    });
    
    document.getElementById('newWord').value = '';
    loadDashboard();
}

async function removeWord(word) {
    await fetch(`/api/banned-words/${word}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadDashboard();
}

async function addGroup() {
    const name = document.getElementById('newGroup').value.trim();
    if (!name) return;
    
    await fetch('/api/allowed-groups', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    
    document.getElementById('newGroup').value = '';
    loadDashboard();
}

async function removeGroup(name) {
    await fetch(`/api/allowed-groups/${name}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadDashboard();
}

setInterval(loadDashboard, 30000);

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .hidden { display: none !important; }
`;
document.head.appendChild(style);
