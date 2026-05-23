function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeObject(obj, fields) {
    const sanitized = {};
    for (const key of fields) {
        if (obj[key] !== undefined) {
            sanitized[key] = typeof obj[key] === 'string' ? escapeHtml(obj[key].trim()) : obj[key];
        }
    }
    return sanitized;
}

function parseNumber(val, fallback = 0) {
    const n = parseFloat(val);
    return isNaN(n) ? fallback : n;
}

function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

const LOCATION_FACTORS = {
    'Most': 0.98,
    'Chomutov': 0.97,
    'Usti nad Labem': 0.96,
    'Ústí nad Labem': 0.96,
    'Teplice': 0.965,
    'Litomerice': 0.975,
    'Litoměřice': 0.975,
    'Louny': 0.985,
    'Zatec': 0.99,
    'Žatec': 0.99,
    'Decin': 0.97,
    'Děčín': 0.97,
    'Bilina': 0.975,
    'Bílina': 0.975,
    'Jirkov': 0.97,
    'Kadan': 0.985,
    'Kadaň': 0.985
};

function getLocationFactor(location) {
    if (!location) return 1.0;
    const loc = location.trim();
    return LOCATION_FACTORS[loc] || LOCATION_FACTORS[Object.keys(LOCATION_FACTORS).find(k => k.toLowerCase() === loc.toLowerCase())] || 1.0;
}

const ROOF_CLASSES = ['vhodna_strecha', 'fve_instalovana', 'nevhodna_strecha', 'prumyslova_hala'];

module.exports = {
    escapeHtml,
    sanitizeObject,
    parseNumber,
    generateId,
    LOCATION_FACTORS,
    getLocationFactor,
    ROOF_CLASSES
};
