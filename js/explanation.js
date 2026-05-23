let lastPredictionResult = null;

function showExplanation(type) {
    const modal = document.getElementById('explanationModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const content = generateExplanation(type);
    document.getElementById('explanationContent').innerHTML = content;
}

function generateExplanation(type) {
    const isCs = currentLang === 'cs';
    const pred = lastPredictionResult;

    if (!pred) {
        return isCs
            ? '<p>Nejprve proveďte predikci pomocí posuvníku rozpočtu.</p>'
            : '<p>First make a prediction using the budget slider.</p>';
    }

    const explanations = {
        systemSize: {
            title: isCs ? '⚡ Velikost systému (kWp)' : '⚡ System Size (kWp)',
            simple: isCs
                ? `Tento systém o výkonu ${pred.systemSizeKwp} kWp pokryje průměrnou spotřebu domácnosti v Ústeckém kraji.`
                : `This ${pred.systemSizeKwp} kWp system can cover average household consumption in the Ústecký kraj region.`,
            advanced: isCs
                ? `Výpočet: ${pred.systemSizeKwp} kWp = rozpočet ${(pred.yearlySavingsKc / 6.5 * 950 / 25000).toFixed(0)} Kč / 25 000 Kč/kWp (průměrná cena instalace v ČR)`
                : `Calculation: ${pred.systemSizeKwp} kWp = ${(pred.yearlySavingsKc / 6.5 * 950 / 25000).toFixed(0)} Kč budget / 25,000 Kč/kWp (avg installation cost in CZ)`,
            data: isCs ? 'Zdroj: Historická data ECUK 2015-2025, průměrné ceny instalací' : 'Source: ECUK historical data 2015-2025, average installation prices',
            confidence: `${pred.confidence}%`
        },
        selfSufficiency: {
            title: isCs ? '🏠 Soběstačnost (%)' : '🏠 Self-Sufficiency (%)',
            simple: isCs
                ? `Vaše domácnost pokryje ${pred.selfSufficiency}% své spotřeby z vlastní solární energie.`
                : `Your household can cover ${pred.selfSufficiency}% of consumption from solar energy.`,
            advanced: isCs
                ? `Soběstačnost = min(95, (produkce ${pred.yearlyKwh} kWh / spotřeba 12000 kWh) × 100 + boost z baterie ${pred.batterySizeKwh} kWh)`
                : `Self-sufficiency = min(95, (production ${pred.yearlyKwh} kWh / consumption 12000 kWh) × 100 + battery boost ${pred.batterySizeKwh} kWh)`,
            data: isCs ? 'Zdroj: Scénáře projekce 2026-2035, historická data obcí' : 'Source: Scenario projections 2026-2035, municipal historical data',
            confidence: `${Math.min(95, pred.confidence + 5)}%`
        },
        co2: {
            title: isCs ? '🌍 CO₂ úspory' : '🌍 CO₂ Savings',
            simple: isCs
                ? `Ročně ušetříte ${pred.co2SavingsTons} tun CO₂, což odpovídá výsadbě ${Math.round(pred.co2SavingsTons * 50)} stromů.`
                : `Save ${pred.co2SavingsTons} tons of CO₂ yearly, equivalent to planting ${Math.round(pred.co2SavingsTons * 50)} trees.`,
            advanced: isCs
                ? `CO₂ = ${pred.yearlyKwh} kWh × 0.4 kg CO₂/kWh = ${pred.co2SavingsTons} t CO₂`
                : `CO₂ = ${pred.yearlyKwh} kWh × 0.4 kg CO₂/kWh = ${pred.co2SavingsTons} t CO₂`,
            data: isCs ? 'Zdroj: Faktor emisí dle MPO ČR 2025' : 'Source: Emission factor per Ministry of Industry CZ 2025',
            confidence: `${pred.confidence}%`
        },
        roi: {
            title: isCs ? '💰 Návratnost investice' : '💰 ROI',
            simple: isCs
                ? `Investice se vrátí za ${pred.roiYears} let při průměrné ceně elektřiny 6.50 Kč/kWh.`
                : `Investment pays back in ${pred.roiYears} years at avg electricity price 6.50 Kč/kWh.`,
            advanced: isCs
                ? `ROI = ${(pred.yearlySavingsKc / 6.5 * 950 * 25000).toFixed(0)} Kč / ${pred.yearlySavingsKc.toLocaleString()} Kč/rok = ${pred.roiYears} let`
                : `ROI = ${(pred.yearlySavingsKc / 6.5 * 950 * 25000).toFixed(0)} Kč / ${pred.yearlySavingsKc.toLocaleString()} Kč/year = ${pred.roiYears} years`,
            data: isCs ? 'Zdroj: Ceny elektřiny dle ERÚ 2026' : 'Source: Electricity prices per ERÚ 2026',
            confidence: `${pred.confidence}%`
        },
        risk: {
            title: isCs ? '⚠️ Riziko' : '⚠️ Risk Score',
            simple: isCs
                ? `Riziko ${pred.riskScore}/100 - ${pred.riskScore < 30 ? 'nízké riziko' : pred.riskScore < 60 ? 'střední riziko' : 'vysoké riziko'}`
                : `Risk ${pred.riskScore}/100 - ${pred.riskScore < 30 ? 'low risk' : pred.riskScore < 60 ? 'medium risk' : 'high risk'}`,
            advanced: isCs
                ? 'Index rizika na základě stability systému, kapacity baterie a závislosti na síti'
                : 'Risk index based on system stability, battery capacity, and grid dependency',
            data: isCs ? 'Zdroj: Model rizik dle historických dat 2023-2025' : 'Source: Risk model from historical data 2023-2025',
            confidence: `${Math.max(50, pred.confidence - 5)}%`
        }
    };

    const exp = explanations[type];
    if (!exp) return '';

    let alternatives = '';
    if (pred.systemSizeKwp) {
        const higher = Math.round(pred.systemSizeKwp * 1.5);
        const lower = Math.round(pred.systemSizeKwp * 0.5);
        alternatives = isCs
            ? `<div class="alt-scenarios"><strong>Alternativní scénáře:</strong><br>
               • Vyšší rozpočet: ~${higher} kWp systém<br>
               • Nižší rozpočet: ~${lower} kWp systém</div>`
            : `<div class="alt-scenarios"><strong>Alternative scenarios:</strong><br>
               • Higher budget: ~${higher} kWp system<br>
               • Lower budget: ~${lower} kWp system</div>`;
    }

    return `
        <h3>${exp.title}</h3>
        <div class="exp-section">
            <div class="exp-label">${isCs ? 'Jednoduše' : 'Simple'}</div>
            <p>${exp.simple}</p>
        </div>
        <div class="exp-section">
            <div class="exp-label">${isCs ? 'Detailně' : 'Advanced'}</div>
            <p>${exp.advanced}</p>
        </div>
        <div class="exp-section">
            <div class="exp-label">${isCs ? 'Datový zdroj' : 'Data Reference'}</div>
            <p>${exp.data}</p>
        </div>
        <div class="exp-section">
            <div class="exp-label">${isCs ? 'Spolehlivost' : 'Confidence'}</div>
            <div class="confidence-bar">
                <div class="confidence-bg">
                    <div class="confidence-fill" style="width:${exp.confidence}%">${exp.confidence}</div>
                </div>
            </div>
        </div>
        ${alternatives}
    `;
}

function storePredictionResult(result) {
    lastPredictionResult = result;
}

function closeExplanation() {
    document.getElementById('explanationModal').style.display = 'none';
}

window.showExplanation = showExplanation;
window.closeExplanation = closeExplanation;
window.storePredictionResult = storePredictionResult;
