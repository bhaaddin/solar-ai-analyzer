const PREDICTION_LOCATIONS = [
    { name: 'Most', factor: 1.05, type: 'Industrial', lat: 50.503, lng: 13.636 },
    { name: 'Litoměřice', factor: 1.02, type: 'Urban', lat: 50.533, lng: 14.131 },
    { name: 'Chomutov', factor: 0.97, type: 'Industrial', lat: 50.460, lng: 13.417 },
    { name: 'Louny', factor: 0.99, type: 'Urban', lat: 50.357, lng: 13.796 },
    { name: 'Postoloprty', factor: 0.93, type: 'Rural', lat: 50.359, lng: 13.703 },
    { name: 'Výškov', factor: 0.91, type: 'Rural', lat: 50.348, lng: 13.670 },
    { name: 'Žiželice', factor: 0.90, type: 'Rural', lat: 50.318, lng: 13.646 },
    { name: 'Nové Sedlo', factor: 0.88, type: 'Rural', lat: 50.298, lng: 13.515 },
    { name: 'Břvany', factor: 0.90, type: 'Rural', lat: 50.315, lng: 13.631 },
    { name: 'Raná', factor: 0.87, type: 'Rural', lat: 50.285, lng: 13.623 },
    { name: 'Číňov', factor: 0.86, type: 'Rural', lat: 50.275, lng: 13.610 },
    { name: 'Ústí nad Labem', factor: 0.96, type: 'Urban', lat: 50.660, lng: 14.032 },
    { name: 'Teplice', factor: 0.95, type: 'Urban', lat: 50.640, lng: 13.824 },
    { name: 'Děčín', factor: 0.93, type: 'Urban', lat: 50.782, lng: 14.214 }
];
if (window.CONFIG && window.CONFIG.LOCATIONS && window.CONFIG.LOCATIONS.length > 0) {
    PREDICTION_LOCATIONS.forEach(pl => {
        if (!window.CONFIG.LOCATIONS.find(cl => cl.name === pl.name)) {
            window.CONFIG.LOCATIONS.push(pl);
        }
    });
} else if (window.CONFIG) {
    window.CONFIG.LOCATIONS = PREDICTION_LOCATIONS;
}

const configLocationIrradiance = {
    'Most': 1050, 'Litoměřice': 1020, 'Chomutov': 970,
    'Louny': 990, 'Postoloprty': 930, 'Výškov': 910,
    'Žiželice': 900, 'Nové Sedlo': 880, 'Břvany': 900,
    'Raná': 870, 'Číňov': 860,
    'Ústí nad Labem': 960, 'Teplice': 950, 'Děčín': 930
};
window.configLocationIrradiance = configLocationIrradiance;

let predictionCache = {};

function getRealPrediction(budget, location, roofType) {
    return predictSelfSufficiency(budget, location, roofType);
}

function getDataDrivenPrediction(budget, location, roofType) {
    return predictSelfSufficiency(budget, location, roofType);
}

function getRecommendationName(key) {
    const labels = { fve_kwp: 'Doporučený výkon FVE', baterie_kwh: 'Kapacita baterie', sobestacnost: 'Soběstačnost', usporaKc: 'Roční úspora', co2Uspora: 'CO₂ úspora', riziko: 'Riziko nestability', confidence: 'Spolehlivost', roi: 'Návratnost', panelCount: 'Počet panelů', recSelfRating: 'Self-rating', recRiskRating: 'Risk rating', recFVE: 'FVE recenze', recBaterie: 'Baterie recenze', recSobestacnost: 'Self-rating', recRiziko: 'Risk rating', recUspora: 'Saving recenze', recCO2: 'CO₂ recenze', recROI: 'ROI recenze', recPanelCount: 'Panel recenze' };
    return labels[key] || key;
}

function storePredictionResult(prediction, budget, location, roofType) {
    window.analysisResult = {
        id: 'pred_' + Date.now(),
        type: 'budget_calculation',
        timestamp: new Date().toISOString(),
        input: { budget, location, roofType },
        predictions: prediction,
        locationData: window.CONFIG.LOCATIONS.find(l => l.name === location) || null,
        charts: []
    };
    return window.analysisResult;
}

async function predictSelfSufficiency(budget, location, roofType) {
    if (!location) location = window.selectedLocation || 'Most';
    const cacheKey = `${budget}_${location}_${roofType}`;
    if (predictionCache[cacheKey]) return predictionCache[cacheKey];

    const loc = window.CONFIG.LOCATIONS.find(l => l.name === location);
    const factor = loc ? loc.factor : 0.97;
    try {
        const res = await Utils.apiFetch('/budget', {
            method: 'POST',
            body: JSON.stringify({ budget: parseInt(budget), location, roofType, enableHydrogen: !!window.useHydrogen })
        });
        if (res && res.prediction) {
            const p = res.prediction;
            const result = {
                fve_kwp: parseFloat(p.systemSizeKwp) || Math.round(budget / 25000),
                baterie_kwh: parseFloat(p.batterySizeKwh) || Math.round(budget / 25000 * 0.5),
                sobestacnost: parseFloat(p.selfSufficiency) || 60,
                usporaKc: parseFloat(p.yearlySavingsKc) || Math.round(budget / 25000 * 950 * 0.97 * 6.5),
                co2Uspora: parseFloat(p.co2SavingsTons) || 12.5,
                riziko: parseFloat(p.riskScore) || 35,
                confidence: parseFloat(p.confidence) || 70,
                roi: parseFloat(p.roiYears) || 8.5,
                panelCount: Math.round(parseFloat(p.systemSizeKwp || Math.round(budget / 25000)) / 0.42)
            };
            predictionCache[cacheKey] = result;
            storePredictionResult(result, budget, location, roofType);
            return result;
        }
    } catch (e) {
        // fall through to local calc
    }
    const wasteRatio = roofType === 'vhodna_strecha' ? 1 : roofType === 'mene_vhodna' ? 0.75 : 0.5;
    const effectiveBudget = budget * wasteRatio;
    const pricePerKwp = 40000;
    const pricePerKwh = 15000;
    const fve_kwp = Math.round(effectiveBudget * 0.55 / pricePerKwp * 10) / 10;
    const baterie_kwh = Math.round(effectiveBudget * 0.2 / pricePerKwh * 10) / 10;
    const sobestacnost = Math.min(95, Math.round((factor * fve_kwp * 0.6 + baterie_kwh * 0.3) * 10) / 10);
    const usporaKc = Math.round(fve_kwp * 950 * factor * 2.5);
    const co2Uspora = Math.round(fve_kwp * factor * 0.25 * 10) / 10;
    const riziko = Math.max(5, Math.round((100 - sobestacnost) * (1 - baterie_kwh / (fve_kwp + 10)) * 10) / 10);
    const confidence = Math.min(95, Math.round((60 + fve_kwp * 0.3 + (loc ? 5 : 0)) * 10) / 10);
    const roi = Math.round((usporaKc / budget) * 100 * 10) / 10;
    const panelCount = Math.round(fve_kwp / 0.42);

    const result = { fve_kwp, baterie_kwh, sobestacnost, usporaKc, co2Uspora, riziko, confidence, roi, panelCount };
    predictionCache[cacheKey] = result;
    storePredictionResult(result, budget, location, roofType);
    return result;
}

function updateBudgetDisplay(val) {
    const el = document.getElementById('budgetValue');
    if (el) el.textContent = Number(val).toLocaleString() + ' Kč';
    updatePrediction();
}

async function updatePrediction() {
    const slider = document.getElementById('budgetSlider');
    const budget = slider ? parseInt(slider.value) : 3000000;
    const location = window.selectedLocation || 'Most';
    const roofType = document.getElementById('roofType');
    const roof = roofType ? roofType.value : 'vhodna_strecha';

    const pred = await predictSelfSufficiency(budget, location, roof);
    if (!pred) return;

    window.currentPrediction = pred;
    window.currentBudget = budget;

    renderSidebarSummary(pred);
    showCalculatorResults(pred, budget, location, roof);
    storePredictionResult(pred, budget, location, roof);
}

function renderSidebarSummary(pred) {
    const setText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    setText('ssFve', `${formatNum(pred.fve_kwp)} kWp`);
    setText('ssBaterie', `${formatNum(pred.baterie_kwh)} kWh`);
    setText('ssSobestacnost', `${Math.round(pred.sobestacnost)}%`);
    setText('ssUspora', `${formatNum(pred.usporaKc)} Kč`);
    setText('ssCO2', `${formatNum(pred.co2Uspora)} t`);
    setText('ssRiziko', `${Math.round(pred.riziko)}%`);

    const rizikoEl = document.getElementById('ssRiziko');
    if (rizikoEl) {
        const risk = pred.riziko;
        rizikoEl.style.color = risk < 30 ? 'var(--accent-green)' : risk < 60 ? 'var(--accent-warm)' : 'var(--accent-red)';
    }
}

function setPresetBudget(val) {
    const slider = document.getElementById('budgetSlider');
    if (slider) slider.value = val;
    const display = document.getElementById('budgetValue');
    if (display) display.textContent = Number(val).toLocaleString() + ' Kč';
    updatePrediction();
}

function toggleHydrogen() {
    const cb = document.getElementById('hydrogenToggle');
    window.useHydrogen = cb ? cb.checked : false;
    updatePrediction();
}

function exportResultJSON() {
    const result = window.analysisResult || window.currentPrediction;
    if (!result) { Utils.showNotification('❌ Nejprve spusťte výpočet', 'error'); return; }
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'solar-ai-result.json'; a.click();
    URL.revokeObjectURL(url);
    Utils.showNotification('✅ JSON exportován', 'success');
}

function formatNum(num) {
    if (typeof num === 'string') num = parseFloat(num);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.round(num).toString();
}

function initPrediction() {
    updatePrediction();
}

window.exportResultJSON = exportResultJSON;
window.initPrediction = initPrediction;
window.predictSelfSufficiency = predictSelfSufficiency;
window.updatePrediction = updatePrediction;
window.setPresetBudget = setPresetBudget;
window.toggleHydrogen = toggleHydrogen;
window.getRecommendationName = getRecommendationName;
window.getRealPrediction = getRealPrediction;
window.getDataDrivenPrediction = getDataDrivenPrediction;
window.storePredictionResult = storePredictionResult;
window.renderSidebarSummary = renderSidebarSummary;
window.updateBudgetDisplay = updateBudgetDisplay;
