const Utils = {
    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    apiFetch(endpoint, options = {}) {
        const url = CONFIG.API_URL + endpoint;
        const config = {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        };
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return fetch(url, config).then(res => {
            if (!res.ok) return res.json().then(e => Promise.reject(e));
            return res.json();
        });
    },

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.app-notification');
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.className = 'app-notification';
        el.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; padding: 12px 20px;
            background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1565c0'};
            color: white; border-radius: 8px; z-index: 2000;
            font-size: 14px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: notifyFadeIn 0.3s ease;
        `;
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; setTimeout(() => el.remove(), 500); }, 3000);
    }
};

if (!document.querySelector('#notifyStyle')) {
    const style = document.createElement('style');
    style.id = 'notifyStyle';
    style.textContent = `
        @keyframes notifyFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
}
