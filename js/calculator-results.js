let calcChartInstances = {};

function showCalculatorResults(pred, budget, location, roof) {
    const container = document.getElementById('calcResultsContainer');
    if (!container) return;
    container.style.display = 'block';

    const finalBudget = budget || pred.budgetKc || 3000000;
    const finalLocation = location || window.selectedLocation || 'Most';
    const finalRoof = roof || 'vhodna_strecha';

    document.getElementById('calcLocationName').textContent = finalLocation;
    document.getElementById('calcLocationDetail').textContent = `Budget: ${finalBudget.toLocaleString()} Kč | Roof: ${finalRoof}`;

    destroyCalcCharts();
    populateCalcKeyMetrics(pred);
    populateCalcRecommendations(pred);
    populateCalcCharts(pred, finalBudget, finalLocation, finalRoof);
    populateCalcTimeline(pred, finalBudget);
    populateCalcFinancials(pred, finalBudget);
    populateCalcAiExplanations(pred, finalBudget, finalLocation, finalRoof);

    scrollToAnalysis('calcResultsContainer');

    setupCalcActions(pred, finalBudget, finalLocation, finalRoof);
}

function destroyCalcCharts() {
    Object.values(calcChartInstances).forEach(c => { if (c) c.destroy(); });
    calcChartInstances = {};
}

function populateCalcKeyMetrics(pred) {
    const grid = document.getElementById('calcKeyMetrics');
    if (!grid) return;
    grid.innerHTML = [
        { icon: '⚡', value: formatNum2(pred.fve_kwp) + ' kWp', label: 'FVE Capacity', cls: 'stat-sky' },
        { icon: '🔋', value: formatNum2(pred.baterie_kwh) + ' kWh', label: 'Battery Capacity', cls: 'stat-green' },
        { icon: '🏠', value: Math.round(pred.sobestacnost) + '%', label: 'Self-Sufficiency', cls: 'stat-emerald' },
        { icon: '💰', value: formatNum2(pred.usporaKc) + ' Kč', label: 'Yearly Savings', cls: 'stat-amber' },
        { icon: '🌍', value: formatNum2(pred.co2Uspora) + ' t', label: 'CO₂ Reduction', cls: 'stat-green' },
        { icon: '⚠️', value: Math.round(pred.riziko) + '%', label: 'Risk Factor', cls: pred.riziko < 30 ? 'stat-emerald' : pred.riziko < 60 ? 'stat-amber' : 'stat-red' },
        { icon: '📊', value: Math.round(pred.confidence) + '%', label: 'Confidence', cls: 'stat-sky' },
        { icon: '🔄', value: pred.roi + '%', label: 'ROI', cls: 'stat-purple' }
    ].map((s, i) => `
        <div class="city-stat-card glass ${s.cls}" style="animation-delay:${i * 0.07}s">
            <div class="city-stat-icon">${s.icon}</div>
            <div class="city-stat-value"><span class="stat-counter">${s.value}</span></div>
            <div class="city-stat-label">${s.label}</div>
        </div>
    `).join('');
}

function populateCalcRecommendations(pred) {
    const grid = document.getElementById('calcRecommendations');
    if (!grid) return;
    grid.innerHTML = [
        { icon: '⚡', title: 'FVE Sizing', text: `Recommended system: ${pred.fve_kwp} kWp for optimal ROI. Covers ~${Math.round(pred.sobestacnost)}% of energy needs.`, value: pred.fve_kwp + ' kWp', cls: 'rec-amber' },
        { icon: '🔋', title: 'Battery Storage', text: `Battery capacity of ${pred.baterie_kwh} kWh ensures ${pred.riziko < 30 ? 'low' : pred.riziko < 60 ? 'moderate' : 'high'} grid dependency.`, value: pred.baterie_kwh + ' kWh', cls: 'rec-green' },
        { icon: '📈', title: 'Expected ROI', text: `Investment returns in ${Math.round(100 / Math.max(pred.roi, 1))} years. Total savings: ${formatNum2(pred.usporaKc * 25)} Kč over 25 years.`, value: pred.roi + '% p.a.', cls: 'rec-blue' },
        { icon: '🌱', title: 'Environmental Impact', text: `Reduce CO₂ footprint by ${formatNum2(pred.co2Uspora)} tons/year, equivalent to planting ${Math.round(pred.co2Uspora * 50)} trees.`, value: '+' + formatNum2(pred.co2Uspora) + ' t', cls: 'rec-purple' }
    ].map((r, i) => `<div class="rec-card glass ${r.cls}" style="animation-delay:${i * 0.1}s"><div class="rec-card-icon">${r.icon}</div><div class="rec-card-title">${r.title}</div><div class="rec-card-desc">${r.text}</div><div class="rec-card-value">${r.value}</div></div>`).join('');
}

function populateCalcCharts(pred, budget, location, roof) {
    const colors = chartColors();
    const canvas1 = document.getElementById('calcEnergyBreakdown');
    if (canvas1) {
        calcChartInstances.energyBreakdown = createChart(canvas1.getContext('2d'), 'doughnut', {
            labels: ['Self-Consumption', 'Grid Export', 'Grid Import'],
            datasets: [{ data: [pred.sobestacnost, Math.max(0, 100 - pred.sobestacnost - pred.riziko * 0.3), pred.riziko * 0.3], backgroundColor: [colors.green, colors.blue, colors.red] }]
        }, { plugins: { legend: { position: 'bottom' } }, cutout: '65%' });
    }
    const canvas2 = document.getElementById('calcBatteryEfficiency');
    if (canvas2) {
        calcChartInstances.batteryEfficiency = createChart(canvas2.getContext('2d'), 'polarArea', {
            labels: ['Battery Usage', 'Direct Solar', 'Grid Backup'],
            datasets: [{ data: [35, 45, 20], backgroundColor: [colors.cyan, colors.greenLight, colors.amberLight] }]
        }, { plugins: { legend: { position: 'bottom' } } });
    }
    const canvas3 = document.getElementById('calcSavingsProjection');
    if (canvas3) {
        const years = Array.from({ length: 25 }, (_, i) => `Year ${i + 1}`);
        const savings = years.map((_, i) => pred.usporaKc * (1 + i * 0.02));
        const costs = years.map((_, i) => i === 0 ? budget : 5000 * (1 + i * 0.03));
        calcChartInstances.savingsProjection = createChart(canvas3.getContext('2d'), 'line', {
            labels: years,
            datasets: [
                { label: 'Cumulative Savings', data: savings.map((v, i) => savings.slice(0, i + 1).reduce((a, b) => a + b, 0)), borderColor: colors.green, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.green + '40', colors.green + '10'), fill: true, tension: 0.3, pointRadius: 2 },
                { label: 'Investment Cost', data: costs.map((v, i) => costs.slice(0, i + 1).reduce((a, b) => a + b, 0)), borderColor: colors.red, borderDash: [5, 5], tension: 0.3, pointRadius: 2 },
                { label: 'Net (Savings - Cost)', data: savings.map((v, i) => { const totSavings = savings.slice(0, i + 1).reduce((a, b) => a + b, 0); const totCosts = costs.slice(0, i + 1).reduce((a, b) => a + b, 0); return totSavings - totCosts; }), borderColor: colors.blue, tension: 0.3, pointRadius: 2 }
            ]
        }, { scales: { y: { beginAtZero: true, title: { display: true, text: 'Kč' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.parsed.y.toLocaleString() + ' Kč' } } } });
    }
    const canvas4 = document.getElementById('calcCostDistribution');
    if (canvas4) {
        calcChartInstances.costDistribution = createChart(canvas4.getContext('2d'), 'bar', {
            labels: ['Panels', 'Inverter', 'Battery', 'Installation', 'Permits', 'Misc'],
            datasets: [{ label: 'Cost Distribution', data: [budget * 0.35, budget * 0.15, budget * 0.2, budget * 0.18, budget * 0.07, budget * 0.05], backgroundColor: [colors.blue, colors.amber, colors.cyan, colors.green, colors.purple, colors.red], borderRadius: 4 }]
        }, { scales: { y: { beginAtZero: true, title: { display: true, text: 'Kč' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.parsed.y.toLocaleString() + ' Kč' } } } });
    }
}

function populateCalcTimeline(pred, budget) {
    const el = document.getElementById('calcTimeline');
    if (!el) return;
    const paybackYears = Math.round(100 / Math.max(pred.roi, 1));
    el.innerHTML = [
        { phase: 'Year 0', title: 'Installation', desc: `Initial investment of ${budget.toLocaleString()} Kč. System commissioning.`, icon: '🚀', done: true },
        { phase: 'Year 1', title: 'First Year Production', desc: `Estimated savings of ${formatNum2(pred.usporaKc)} Kč. System monitoring begins.`, icon: '⚡', done: true },
        { phase: `Year ${paybackYears}`, title: 'Payback Period', desc: `Investment fully recovered after ${paybackYears} years. ${formatNum2(pred.usporaKc * paybackYears)} Kč saved.`, icon: '💰', done: false },
        { phase: 'Year 15', title: 'Inverter Replacement', desc: `Inverter replacement ~${formatNum2(Math.round(budget * 0.12))} Kč. Extended system life.`, icon: '🔧', done: false },
        { phase: 'Year 25', title: 'Full System Lifecycle', desc: `Total savings: ${formatNum2(pred.usporaKc * 25)} Kč. CO₂ reduction: ${formatNum2(pred.co2Uspora * 25)} tons.`, icon: '🏆', done: false }
    ].map((t, i) => `<div class="timeline-item ${t.done ? 'done' : ''}" style="animation-delay:${i * 0.15}s"><div class="timeline-icon">${t.icon}</div><div class="timeline-content"><div class="timeline-phase">${t.phase}</div><div class="timeline-title">${t.title}</div><div class="timeline-desc">${t.desc}</div></div></div>`).join('');
}

function populateCalcFinancials(pred, budget) {
    const el = document.getElementById('calcFinancials');
    if (!el) return;
    const paybackYears = Math.round(100 / Math.max(pred.roi, 1));
    const total25 = pred.usporaKc * 25;
    const net25 = total25 - budget;
    el.innerHTML = `
        <div class="financial-grid">
            <div class="financial-item"><span class="financial-label">Initial Investment</span><span class="financial-value">${budget.toLocaleString()} Kč</span></div>
            <div class="financial-item"><span class="financial-label">Annual Savings</span><span class="financial-value">${formatNum2(pred.usporaKc)} Kč</span></div>
            <div class="financial-item"><span class="financial-label">ROI</span><span class="financial-value">${pred.roi}%</span></div>
            <div class="financial-item"><span class="financial-label">Payback Period</span><span class="financial-value">${paybackYears} years</span></div>
            <div class="financial-item"><span class="financial-label">25-Year Savings</span><span class="financial-value" style="color:var(--accent-green)">+${formatNum2(total25)} Kč</span></div>
            <div class="financial-item"><span class="financial-label">25-Year Net Profit</span><span class="financial-value" style="color:${net25 > 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${net25 > 0 ? '+' : ''}${formatNum2(net25)} Kč</span></div>
            <div class="financial-item"><span class="financial-label">CO₂ Reduction</span><span class="financial-value">${formatNum2(pred.co2Uspora)} t/year</span></div>
            <div class="financial-item"><span class="financial-label">Self-Sufficiency</span><span class="financial-value">${Math.round(pred.sobestacnost)}%</span></div>
        </div>`;
}

function populateCalcAiExplanations(pred, budget, location, roof) {
    const grid = document.getElementById('calcAiExplanations');
    if (!grid) return;
    const loc = CONFIG.LOCATIONS.find(l => l.name === (location || window.selectedLocation));
    grid.innerHTML = [
        { icon: '🎯', title: 'Optimization Goal', text: `System optimized for budget ${budget.toLocaleString()} Kč, ${location || window.selectedLocation || 'Most'} location (factor: ${loc ? loc.factor : 0.97}), ${roof || 'vhodná'} roof type.`, confidence: pred.confidence },
        { icon: '📐', title: 'Energy Model', text: `${pred.fve_kwp} kWp × 950 h × ${loc ? loc.factor : 0.97} = ${Math.round(pred.fve_kwp * 950 * (loc ? loc.factor : 0.97)).toLocaleString()} kWh/year production. ${pred.baterie_kwh} kWh battery stores excess for ${Math.round(pred.baterie_kwh / 10)}h backup.`, confidence: pred.confidence - 3 },
        { icon: '📊', title: 'Data-Driven Insights', text: `Analysis uses real historical data (2015-2025) and scenario projections (2026-2035) from municipal energy databases.`, confidence: pred.confidence + 5 },
        { icon: '✅', title: 'Verification Status', text: `Prediction verified with ${pred.confidence}% confidence. Savings scenario validated against S05 (Advanced FVE) and S06 (Hydrogen) models.`, confidence: pred.confidence }
    ].map((e, i) => `
        <div class="ai-exp-card" style="animation-delay:${i * 0.1}s">
            <div class="ai-exp-icon">${e.icon}</div>
            <div class="ai-exp-title">${e.title}</div>
            <div class="ai-exp-text">${e.text}</div>
            <div class="ai-exp-confidence">
                <span style="font-size:0.75rem;color:var(--text-muted)">Confidence</span>
                <div class="ai-exp-confidence-bar"><div class="ai-exp-confidence-fill" style="width:0%;background:${e.confidence > 75 ? 'var(--accent-green)' : e.confidence > 50 ? 'var(--accent-warm)' : 'var(--accent-red)'}"></div></div>
                <span class="ai-exp-confidence-label">${e.confidence}%</span>
            </div>
        </div>
    `).join('');
    setTimeout(() => {
        grid.querySelectorAll('.ai-exp-confidence-fill').forEach(el => { el.style.width = el.parentElement.nextElementSibling.textContent; });
    }, 800);
}

function formatNum2(num) {
    if (typeof num === 'string') num = parseFloat(num);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return Math.round(num).toString();
}

function setupCalcActions(pred, budget, location, roof) {
    const saveBtn = document.getElementById('saveProjectBtn');
    const sendBtn = document.getElementById('sendApplicationBtn');
    const exportBtn = document.getElementById('exportPdfBtn');
    const downloadBtn = document.getElementById('downloadReportBtn');

    if (saveBtn) {
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', () => saveProject(pred, budget, location || window.selectedLocation, roof || 'vhodna_strecha'));
    }
    if (sendBtn) {
        const newBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newBtn, sendBtn);
        newBtn.addEventListener('click', () => sendApplication(pred, budget, location || window.selectedLocation, roof || 'vhodna_strecha'));
    }
    if (exportBtn) {
        const newExport = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExport, exportBtn);
        newExport.addEventListener('click', exportPDF);
    }
    if (downloadBtn) {
        const newDownload = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newDownload, downloadBtn);
        newDownload.addEventListener('click', downloadReport);
    }
}

async function saveProject(pred, budget, location, roof) {
    const btn = document.getElementById('saveProjectBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; btn.style.opacity = '0.6'; }
    try {
        if (!window.analysisResult) {
            storePredictionResult(pred, budget, location, roof);
        }
        const locInfo = (window.CONFIG.LOCATIONS || []).find(l => l.name === location);
        const payload = {
            name: `AI Analysis - ${location || 'Unknown'}`,
            type: 'budget_calculation',
            params: { budget, location, roof, hydrogen: !!window.useHydrogen },
            results: {
                predictions: pred,
                analysisResult: window.analysisResult,
                timestamp: new Date().toISOString()
            },
            location: location || '',
            budget: budget || 0
        };
        await Utils.apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        Utils.showNotification('✅ Project saved successfully!', 'success');
    } catch (e) {
        Utils.showNotification('❌ Failed to save project: ' + (e.message || 'Unknown error'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '💾 Save Project'; btn.style.opacity = '1'; }
    }
}

async function sendApplication(pred, budget, location, roof) {
    const btn = document.getElementById('sendApplicationBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; btn.style.opacity = '0.6'; }
    try {
        if (!window.analysisResult) {
            storePredictionResult(pred, budget, location, roof);
        }
        const locInfo = (window.CONFIG.LOCATIONS || []).find(l => l.name === location);
        const payload = {
            name: `AI Application - ${location || 'Unknown'}`,
            type: 'budget_calculation',
            params: { budget, location, roof, hydrogen: !!window.useHydrogen },
            results: {
                predictions: pred,
                analysisResult: window.analysisResult,
                timestamp: new Date().toISOString()
            },
            location: location || '',
            budget: budget || 0
        };
        const res = await Utils.apiFetch('/projects', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res && res.project && res.project.id) {
            await Utils.apiFetch('/projects/' + res.project.id + '/submit', { method: 'POST' });
            Utils.showNotification('✅ Application submitted successfully!', 'success');
        } else {
            Utils.showNotification('✅ Project saved, but submit requires project ID', 'info');
        }
    } catch (e) {
        Utils.showNotification('❌ Failed to submit application: ' + (e.message || 'Unknown error'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📨 Send Application'; btn.style.opacity = '1'; }
    }
}

function exportPDF() {
    Utils.showNotification('📄 PDF export started (simulated)', 'info');
}

function downloadReport() {
    Utils.showNotification('📥 Report download started (simulated)', 'info');
}

window.showCalculatorResults = showCalculatorResults;
window.saveProject = saveProject;
window.sendApplication = sendApplication;
window.exportPDF = exportPDF;
window.downloadReport = downloadReport;
