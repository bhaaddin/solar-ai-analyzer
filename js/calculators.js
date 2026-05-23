function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;

function calculateArea() {
    const length = parseFloat(document.getElementById('roofLength').value) || 0;
    const width = parseFloat(document.getElementById('roofWidth').value) || 0;
    const area = length * width;
    const kwp = (area * 0.15).toFixed(1);
    const panels = Math.round(kwp / 0.4);
    const production = Math.round(kwp * 950);
    const savings = Math.round(production * 6.5);

    document.getElementById('areaResult').innerHTML = `
        <div class="result-box">
            <strong>Plocha:</strong> ${area} m²<br>
            <strong>Výkon:</strong> ${kwp} kWp (${panels} panelů)<br>
            <strong>Výroba:</strong> ~${production.toLocaleString()} kWh/rok<br>
            <strong>Úspora:</strong> ~${savings.toLocaleString()} Kč/rok
        </div>`;
}

function calculateROI() {
    const investment = parseFloat(document.getElementById('investment').value) || 0;
    const savings = parseFloat(document.getElementById('annualSavings').value) || 0;
    const years = savings > 0 ? (investment / savings).toFixed(1) : '∞';
    const profit5 = Math.round(savings * 5 - investment);
    const profit10 = Math.round(savings * 10 - investment);
    const profit20 = Math.round(savings * 20 - investment);
    const irr = savings > 0 ? ((savings / investment) * 100).toFixed(1) : 0;

    document.getElementById('roiResult').innerHTML = `
        <div class="result-box">
            <strong>Návratnost:</strong> ${years} let<br>
            <strong>Zisk 5 let:</strong> ${profit5.toLocaleString()} Kč<br>
            <strong>Zisk 10 let:</strong> ${profit10.toLocaleString()} Kč<br>
            <strong>Zisk 20 let:</strong> ${profit20.toLocaleString()} Kč<br>
            <strong>IRR:</strong> ${irr}%
        </div>`;
}

function runBudgetCalculator() {
    const budget = parseFloat(document.getElementById('budgetCalcInput').value) || 3000000;
    const location = document.getElementById('budgetCalcLocation').value;

    const costPerKwp = 25000;
    const locationFactor = window.dataService && window.dataService.loaded
        ? window.dataService.getLocationFactor(location) : 0.98;
    const kwp = budget / costPerKwp;
    const batteryKwh = Math.round(kwp * 0.5);
    const yearlyKwh = Math.round(kwp * 950 * locationFactor);
    const yearlySavings = Math.round(yearlyKwh * 6.5);
    const co2Tons = (yearlyKwh * 0.4 / 1000).toFixed(1);
    const selfSufficiency = Math.min(95, Math.round((yearlyKwh / 12000) * 100 + Math.min(20, batteryKwh * 0.3)));
    const roi = yearlySavings > 0 ? (budget / yearlySavings).toFixed(1) : '∞';
    const risk = Math.round(Math.max(5, Math.min(80, 60 - kwp * 0.5 + batteryKwh * 0.1)));

    document.getElementById('budgetCalcResult').innerHTML = `
        <div class="result-box">
            <strong>📍 ${location}</strong><br>
            ⚡ FVE: ${Math.round(kwp)} kWp | 🔋 Baterie: ${batteryKwh} kWh<br>
            📊 Výroba: ${yearlyKwh.toLocaleString()} kWh/rok<br>
            💰 Úspora: ${yearlySavings.toLocaleString()} Kč/rok<br>
            🌍 CO₂: ${co2Tons} t/rok | 🏠 Soběstačnost: ${selfSufficiency}%<br>
            📈 ROI: ${roi} let | ⚠️ Riziko: ${risk}%
        </div>`;
}

function runBatteryCalculator() {
    const fveKwp = parseFloat(document.getElementById('batteryFveInput').value) || 50;
    const dailyConsumption = parseFloat(document.getElementById('batteryConsumptionInput').value) || 30;

    const recommendedKwh = Math.round(fveKwp * 0.5 * 2);
    const backupHours = dailyConsumption > 0 ? Math.round(recommendedKwh / dailyConsumption * 24) : 0;
    const additionalSelfSuff = Math.min(25, Math.round(recommendedKwh * 0.05));
    const costEstimate = Math.round(recommendedKwh * 8000);

    document.getElementById('batteryCalcResult').innerHTML = `
        <div class="result-box">
            <strong>Doporučená baterie:</strong> ${recommendedKwh} kWh<br>
            <strong>Záloha:</strong> ~${backupHours} hodin<br>
            <strong>Zvýšení soběstačnosti:</strong> +${additionalSelfSuff}%<br>
            <strong>Odhad ceny:</strong> ${costEstimate.toLocaleString()} Kč
        </div>`;
}

function runCO2Calculator() {
    const kwp = parseFloat(document.getElementById('co2KwpInput').value) || 50;
    const yearlyKwh = kwp * 950;
    const co2Tons = (yearlyKwh * 0.4 / 1000).toFixed(1);
    const trees = Math.round(co2Tons * 45);
    const cars = (co2Tons / 2.5).toFixed(1);
    const coalEq = (co2Tons * 0.001).toFixed(3);

    document.getElementById('co2CalcResult').innerHTML = `
        <div class="result-box">
            <strong>CO₂ úspora:</strong> ${co2Tons} t/rok<br>
            <strong>Ekvivalent stromů:</strong> ${trees} stromů<br>
            <strong>Ekvivalent aut:</strong> ${cars} aut/rok<br>
            <strong>Uhlí ekv.:</strong> ${coalEq} GWh
        </div>`;
}

function runHouseholdCalculator() {
    const households = parseFloat(document.getElementById('hhCountInput').value) || 10;
    const kwp = parseFloat(document.getElementById('hhKwpInput').value) || 50;

    const yearlyKwh = kwp * 950;
    const savingsPerHH = Math.round(yearlyKwh * 6.5 / households);
    const co2PerHH = (yearlyKwh * 0.4 / 1000 / households).toFixed(1);
    const communitySelfSuff = Math.min(95, Math.round((yearlyKwh / (households * 12000)) * 100));
    const paybackPerHH = Math.round(kwp * 25000 / households / savingsPerHH);

    document.getElementById('householdCalcResult').innerHTML = `
        <div class="result-box">
            <strong>Na domácnost:</strong><br>
            💰 Úspora: ${savingsPerHH.toLocaleString()} Kč/rok<br>
            🌍 CO₂: ${co2PerHH} t/rok<br>
            🏠 Komunitní soběstačnost: ${communitySelfSuff}%<br>
            📈 Návratnost/domácnost: ~${paybackPerHH} let
        </div>`;
}

function runEnergyCalculator() {
    const kwp = parseFloat(document.getElementById('energyKwpInput').value) || 50;
    const location = document.getElementById('energyLocationInput').value;

    const locationFactor = window.dataService && window.dataService.loaded
        ? window.dataService.getLocationFactor(location) : 0.98;
    const yearlyKwh = Math.round(kwp * 950 * locationFactor);
    const monthlyAvg = Math.round(yearlyKwh / 12);
    const dailyAvg = Math.round(yearlyKwh / 365);
    const savings = Math.round(yearlyKwh * 6.5);

    const rankings = {
        'Most': { irrad: 1020, factor: 0.98 },
        'Chomutov': { irrad: 1010, factor: 0.97 },
        'Teplice': { irrad: 1005, factor: 0.965 },
        'Usti_nad_Labem': { irrad: 1000, factor: 0.96 },
        'Litomerice': { irrad: 1015, factor: 0.975 },
        'Decin': { irrad: 1010, factor: 0.97 }
    };
    const locInfo = rankings[location] || { irrad: 1000, factor: 1 };

    document.getElementById('energyCalcResult').innerHTML = `
        <div class="result-box">
            <strong>📍 ${location}</strong> (faktor: ${locationFactor})<br>
            ⚡ Roční výroba: ${yearlyKwh.toLocaleString()} kWh<br>
            📅 Měsíčně: ~${monthlyAvg.toLocaleString()} kWh<br>
            ☀️ Denně: ~${dailyAvg} kWh<br>
            💰 Hodnota: ${savings.toLocaleString()} Kč/rok<br>
            ☀️ Sluneční svit: ~${locInfo.irrad} kWh/kWp/rok
        </div>`;
}

function runScenarioComparator() {
    const location = document.getElementById('scenarioLocation').value;
    const budget = parseFloat(document.getElementById('scenarioBudget').value) || 3000000;

    let scenarios;
    if (window.dataService && window.dataService.loaded) {
        scenarios = window.dataService.compareScenarios(location, budget);
    } else {
        const ids = ['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
        const labels = { S00: 'Baseline', S01: 'Small FVE', S02: 'FVE+battery', S03: 'Savings', S04: 'Community', S05: 'Large FVE', S06: 'H2 2035' };
        scenarios = {};
        ids.forEach((sid, i) => {
            const m = i * 0.15;
            const kwp = Math.round(budget / 25000 * m);
            scenarios[sid] = {
                label: labels[sid],
                selfSufficiency: Math.round(kwp * 0.5),
                risk: Math.round(70 - kwp * 0.3),
                savings: Math.round(kwp * 950 * 6.5),
                co2: Math.round(kwp * 950 * 0.4 / 1000 * 10) / 10,
                installedKwp: kwp,
                batteryKwh: Math.round(kwp * 0.5)
            };
        });
    }

    let html = `<table class="scenario-table">
        <tr><th>Scénář</th><th>FVE</th><th>Baterie</th><th>Soběstač.</th><th>Úspora</th><th>CO₂</th><th>Riziko</th></tr>`;

    Object.entries(scenarios).forEach(([sid, s]) => {
        const riskColor = s.risk < 30 ? '#10b981' : s.risk < 60 ? '#f59e0b' : '#ef4444';
        html += `<tr>
            <td class="scenario-name">${s.label}</td>
            <td>${s.installedKwp} kWp</td>
            <td>${s.batteryKwh} kWh</td>
            <td>${s.selfSufficiency}%</td>
            <td>${s.savings.toLocaleString()} Kč</td>
            <td>${s.co2} t</td>
            <td style="color:${riskColor}">${s.risk}%</td>
        </tr>`;
    });
    html += `</table>`;

    document.getElementById('scenarioCalcResult').innerHTML = html;
}

function runTrendAnalyzer() {
    const location = document.getElementById('trendLocation').value;

    let html = '';
    if (window.dataService && window.dataService.loaded) {
        const trend = window.dataService.getHistoricalTrend(location, 2025);
        if (trend.length > 0) {
            const latest = trend[trend.length - 1];
            const earliest = trend[0];
            const kwpGrowth = ((parseFloat(latest.instalovany_vykon_kWp) / parseFloat(earliest.instalovany_vykon_kWp)) - 1) * 100;

            html = `<div class="result-box-accent">
                <strong>📍 ${location} | 2015 → 2025</strong><br>
                ⚡ Růst výkonu: +${Math.round(kwpGrowth)}%<br>
                (${parseFloat(earliest.instalovany_vykon_kWp).toFixed(1)} → ${parseFloat(latest.instalovany_vykon_kWp).toFixed(1)} kWp)
            </div>
            <table class="scenario-table" style="margin-top:8px;">
                <tr><th>Rok</th><th>FVE (kWp)</th><th>Baterie (kWh)</th><th>Úspora (Kč)</th><th>CO₂ (t)</th><th>Soběstač.</th></tr>`;

            trend.forEach(row => {
                html += `<tr>
                    <td>${row.rok}</td>
                    <td>${parseFloat(row.instalovany_vykon_kWp).toFixed(1)}</td>
                    <td>${parseFloat(row.baterie_kapacita_kWh || 0).toFixed(1)}</td>
                    <td>${Math.round(parseFloat(row.uspora_kc_domacnost_rok || 0)).toLocaleString()}</td>
                    <td>${parseFloat(row.co2_uspory_t_rok || 0).toFixed(1)}</td>
                    <td>${parseFloat(row.sobestacnost_procent || 0).toFixed(1)}%</td>
                </tr>`;
            });
            html += `</table>`;
        } else {
            html = `<div class="result-box">Žádná historická data pro ${location}</div>`;
        }
    } else {
        html = `<div class="result-box-accent">⏳ Načítám data ze serveru...</div>`;
    }

    document.getElementById('trendCalcResult').innerHTML = html;
}

function runMeasureSimulator() {
    const checkboxes = document.querySelectorAll('#measureCheckboxes input:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    if (selected.length === 0) {
        document.getElementById('measureCalcResult').innerHTML = `<div class="result-box-accent">Vyberte alespoň jedno opatření</div>`;
        return;
    }

    let totalKwp = 0, totalBattery = 0, totalCost = 0;
    let selfSuffIncrease = 0, riskDecrease = 0;

    if (window.dataService && window.dataService.loaded) {
        selected.forEach(id => {
            const m = window.dataService.measures.find(m => m.id === id);
            if (m) {
                totalKwp += parseFloat(m.delta_vykon_kWp) || 0;
                totalBattery += parseFloat(m.delta_baterie_kWh) || 0;
                totalCost += parseFloat(m.cena_mil_kc) * 1000000 || 0;
                selfSuffIncrease += parseFloat(m.dopad_sobestacnost_pp_rocne) || 0;
                riskDecrease += parseFloat(m.dopad_riziko_pp_rocne) || 0;
            }
        });
    } else {
        const mockData = { E1: { kwp: 50, cost: 2.5, selfSuff: 2.5, risk: -1.2 }, E2: { kwp: 200, cost: 6, selfSuff: 5.8, risk: -2.1 }, B1: { batterie: 100, cost: 1.2, selfSuff: 1.8, risk: -4.5 }, B2: { batterie: 500, cost: 4.5, selfSuff: 4.2, risk: -9.8 }, U1: { kwp: 0, cost: 3.2, selfSuff: 3.8, risk: -2.1 } };
        selected.forEach(id => {
            const m = mockData[id];
            if (m) {
                totalKwp += m.kwp || 0;
                totalBattery += m.batterie || 0;
                totalCost += m.cost * 1000000;
                selfSuffIncrease += m.selfSuff || 0;
                riskDecrease += m.risk || 0;
            }
        });
    }

    document.getElementById('measureCalcResult').innerHTML = `
        <div class="result-box">
            <strong>Dopad vybraných opatření (${selected.length}):</strong><br>
            ⚡ Nový výkon: +${totalKwp} kWp<br>
            🔋 Nová baterie: +${totalBattery} kWh<br>
            💰 Celkové náklady: ${totalCost.toLocaleString()} Kč<br>
            📈 Zvýšení soběstačnosti: +${selfSuffIncrease.toFixed(1)}%<br>
            📉 Snížení rizika: ${Math.abs(riskDecrease).toFixed(1)}%
        </div>`;
}

function initMeasureCheckboxes() {
    const container = document.getElementById('measureCheckboxes');
    if (!container) return;

    const measures = [
        { id: 'E1', label: 'FVE na škole/úřadu (+50 kWp)', category: 'Výroba' },
        { id: 'E2', label: 'FVE na průmyslové hale (+200 kWp)', category: 'Výroba' },
        { id: 'E3', label: 'Komunitní FVE (+500 kWp)', category: 'Výroba' },
        { id: 'E4', label: 'FVE velká Triangle (+1200 kWp)', category: 'Výroba' },
        { id: 'E5', label: 'Větrná elektrárna malá (+80 kWp)', category: 'Výroba' },
        { id: 'B1', label: 'Malá baterie (+100 kWh)', category: 'Úložiště' },
        { id: 'B2', label: 'Střední baterie (+500 kWh)', category: 'Úložiště' },
        { id: 'B3', label: 'Smart metering + EMS', category: 'Úložiště' },
        { id: 'B4', label: 'Velká baterie (+2000 kWh)', category: 'Úložiště' },
        { id: 'B5', label: 'Vodíkové úložiště sezónní', category: 'Úložiště' },
        { id: 'U1', label: 'Zateplení budov (úspora)', category: 'Úspory' },
        { id: 'U2', label: 'LED osvětlení (úspora)', category: 'Úspory' },
        { id: 'U3', label: 'Tepelné čerpadlo', category: 'Úspory' },
        { id: 'U4', label: 'Energetický management', category: 'Úspory' },
        { id: 'U5', label: 'Komunitní sdílení', category: 'Úspory' }
    ];

    container.innerHTML = measures.map(m => `
        <label class="measure-item">
            <input type="checkbox" value="${m.id}">
            <span>${m.label}</span>
            <span style="font-size:0.7rem; color:var(--text-muted); margin-left:auto;">${m.category}</span>
        </label>
    `).join('');
}

document.addEventListener('DOMContentLoaded', function() {
    initMeasureCheckboxes();
    setTimeout(() => {
        const scenarioSelect = document.getElementById('scenarioLocation');
        if (scenarioSelect) runScenarioComparator();
    }, 1000);
});

window.calculateArea = calculateArea;
window.calculateROI = calculateROI;
window.runBudgetCalculator = runBudgetCalculator;
window.runBatteryCalculator = runBatteryCalculator;
window.runCO2Calculator = runCO2Calculator;
window.runHouseholdCalculator = runHouseholdCalculator;
window.runEnergyCalculator = runEnergyCalculator;
window.runScenarioComparator = runScenarioComparator;
window.runTrendAnalyzer = runTrendAnalyzer;
window.runMeasureSimulator = runMeasureSimulator;
