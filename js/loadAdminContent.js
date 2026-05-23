// js/loadAdminContent.js - Load admin editable content to main page

const API_URL = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : '/api';

async function loadAdminContent() {
    try {
        const response = await fetch(`${API_URL}/content`);
        const data = await response.json();
        
        // Update main page editable elements
        const siteTitle = document.getElementById('siteTitle');
        if (siteTitle) {
            siteTitle.innerHTML = data.siteTitle || '🌞 AI Solar Roof Analyzer';
        }
        
        const aboutText = document.getElementById('aboutText');
        if (aboutText) {
            aboutText.innerHTML = data.description || 'AI analyzuje satelitní snímky a určuje vhodnost střech pro solární panely. Vytvořeno pro ECUK.';
        }
        
        const tipsText = document.getElementById('tipsText');
        if (tipsText && data.tipsText) {
            tipsText.innerHTML = data.tipsText;
        }
        
        const mapTitle = document.getElementById('mapTitle');
        if (mapTitle && data.mapTitle) {
            mapTitle.innerHTML = data.mapTitle;
        }
        
        const heroText = document.getElementById('heroTextDisplay');
        if (heroText && data.heroText) {
            heroText.innerHTML = data.heroText;
        }
        
        const fundingInfo = document.getElementById('fundingInfoDisplay');
        if (fundingInfo && data.fundingInfo) {
            fundingInfo.innerHTML = data.fundingInfo;
        }
        
        const footerText = document.getElementById('footerText');
        if (footerText && data.footerText) {
            footerText.innerHTML = data.footerText;
        }
        
        console.log('✅ Admin content loaded successfully');
        return data;
        
    } catch(e) {
        console.error('Failed to load admin content:', e);
        return null;
    }
}

// Auto-load when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminContent);
} else {
    loadAdminContent();
}