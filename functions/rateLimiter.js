// rateLimiter.js
const userRequests = new Map();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutos
const MAX_REQUESTS = 1; // 1 teste por usuário a cada 5 minutos

export function checkRateLimit(userId) {
    const now = Date.now();
    const userHistory = userRequests.get(userId) || [];
    
    // Remove requests antigas
    const validRequests = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= MAX_REQUESTS) {
        const oldestRequest = Math.min(...validRequests);
        const timeLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000 / 60);
        return { allowed: false, timeLeft };
    }
    
    // Adiciona nova request
    validRequests.push(now);
    userRequests.set(userId, validRequests);
    
    return { allowed: true };
}