// js/chat.js - Chat
function openChat() {
    document.getElementById('chatModal').style.display = 'flex';
}

function closeChat() {
    document.getElementById('chatModal').style.display = 'none';
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const question = input.value.trim();
    if (!question) return;
    const messages = document.getElementById('chatMessages');
    messages.innerHTML += `<div class="chat-message user">${currentLang === 'cs' ? 'Vy' : 'You'}: ${question}</div>`;
    let answer = '';
    const q = question.toLowerCase();
    if (q.includes('saving') || q.includes('úspor')) {
        answer = currentLang === 'cs' ? 'Úspory: 15 000-30 000 Kč/rok.' : 'Savings: 15,000-30,000 Kč/year.';
    } else if (q.includes('střech') || q.includes('roof')) {
        answer = currentLang === 'cs' ? 'Nahrajte snímek střechy pro AI analýzu.' : 'Upload roof image for AI analysis.';
    } else if (q.includes('dotac') || q.includes('grant')) {
        answer = currentLang === 'cs' ? 'Dotace až 50% od ECUK.' : 'Grants up to 50% from ECUK.';
    } else {
        answer = currentLang === 'cs' ? 'Nahrajte snímek střechy.' : 'Upload a roof image.';
    }
    messages.innerHTML += `<div class="chat-message bot">🤖 SolarAI: ${answer}</div>`;
    messages.scrollTop = messages.scrollHeight;
    input.value = '';
}

function initChat() {
    const messages = document.getElementById('chatMessages');
    if (messages) {
        messages.innerHTML = `<div class="chat-message bot">${currentLang === 'cs' ? '👋 Ahoj!' : '👋 Hello!'}</div>`;
    }
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.placeholder = currentLang === 'cs' ? 'Napište otázku...' : 'Type your question...';
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });
    }
}

window.addEventListener('languageChanged', initChat);
