let cityChartInstances = {};
window.analysisResult = null;

function selectLocation(name) {
  window.selectedLocation = name;
  const loc = CONFIG.LOCATIONS.find(l => l.name === name);
  if (!loc) {
    Utils.showNotification(`📍 ${name} — data will be estimated`, 'info');
  } else {
    Utils.showNotification(`📍 Místo: ${name}`, 'info');
  }
  renderSidebarSummary(name, loc || { factor: 0.97 });

  const container = document.getElementById('cityAnalysisContainer');
  if (container) {
    container.style.display = 'block';
    document.getElementById('cityNameDisplay').textContent = name;
    document.getElementById('citySubtitle').textContent = `Comprehensive energy intelligence report for ${name}, Ústecký kraj`;
  }
  const calcContainer = document.getElementById('calcResultsContainer');
  if (calcContainer) calcContainer.style.display = 'none';

  window.appState.mergeAndRender(name).then(analysis => {
    if (analysis) renderFullAnalysis(analysis);
  }).catch(e => {
    console.error('City analysis failed:', e);
  });
  scrollToAnalysis('cityAnalysisContainer');
}

function renderSidebarSummary(name, loc) {
  const el = document.getElementById('recName');
  if (el) el.textContent = `📍 ${name} (faktor: ${loc.factor})`;
  const infoEl = document.getElementById('locationInfo');
  if (infoEl) infoEl.innerHTML = `📍 <b>${name}</b> — ☀️ ${(window.configLocationIrradiance && window.configLocationIrradiance[name]) || Math.round(loc.factor * 1000)} kWh/m²/rok`;
  const sbLoc = document.getElementById('sidebarLocation');
  const sbLocDet = document.getElementById('sidebarLocationDetail');
  if (sbLoc) sbLoc.innerHTML = `📍 <b>${name}</b> — ☀️ ${(window.configLocationIrradiance && window.configLocationIrradiance[name]) || Math.round(loc.factor * 1000)} kWh/m²/rok`;
  if (sbLocDet) sbLocDet.textContent = `Faktor: ${loc.factor} | Typ: ${loc.type || 'N/A'}`;
}

function renderFullAnalysis(analysis) {
  destroyCityCharts();
  populateHeroStats(analysis);
  populateModule1_Historical(analysis);
  populateModule2_Solar(analysis);
  populateModule3_Scenario(analysis);
  populateModule4_Optimization(analysis);
  populateRecommendations(analysis);
  populateAiExplanations(analysis);
  animateSections();
}

function scrollToAnalysis(containerId) {
  const el = document.getElementById(containerId);
  if (!el || el.style.display === 'none') return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
  try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function destroyCityCharts() {
  Object.values(cityChartInstances).forEach(c => { if (c) c.destroy(); });
  cityChartInstances = {};
}

function populateHeroStats(analysis) {
  const grid = document.getElementById('cityStatsGrid');
  if (!grid) return;
  const s = analysis.stats;
  const stats = [
    { icon: '📍', value: analysis.city, label: 'Location', cls: 'stat-amber' },
    { icon: '⚡', value: formatNum(s.installedKwp) + ' kWp', label: 'Installed FVE Capacity', cls: 'stat-sky' },
    { icon: '🔋', value: formatNum(s.batteryCapacity) + ' kWh', label: 'Battery Capacity', cls: 'stat-green' },
    { icon: '🏠', value: Math.round(s.selfSufficiency) + '%', label: 'Self-Sufficiency', cls: 'stat-emerald' },
    { icon: '🌍', value: formatNum(s.co2Savings) + ' t', label: 'CO₂ Savings / year', cls: 'stat-green' },
    { icon: '⚠️', value: s.risk + '%', label: 'Grid Stability Risk', cls: 'stat-red' },
    { icon: '💰', value: formatNum(s.savings) + ' Kč', label: 'Estimated Savings / year', cls: 'stat-emerald' },
    { icon: '☀️', value: analysis.irradiance + ' kWh/m²', label: 'Solar Potential', cls: 'stat-orange' }
  ];
  grid.innerHTML = stats.map((s, i) => `
    <div class="city-stat-card glass ${s.cls}" style="animation-delay:${i * 0.07}s">
      <div class="city-stat-icon">${s.icon}</div>
      <div class="city-stat-value"><span class="stat-counter">${s.value}</span></div>
      <div class="city-stat-label">${s.label}</div>
    </div>
  `).join('');
}

function populateModule1_Historical(analysis) {
  const his = analysis.historical;
  const hisCanvas = document.getElementById('historicalEnergyChart');
  if (hisCanvas && his.length > 0) {
    const colors = chartColors();
    cityChartInstances.historicalEnergy = createChart(hisCanvas.getContext('2d'), 'bar', {
      labels: his.map(d => d.rok),
      datasets: [
        { label: 'Installed Capacity (kWp)', data: his.map(d => parseFloat(d.instalovany_vykon_kWp) || 0), backgroundColor: colors.blue, borderRadius: 4, yAxisID: 'y' },
        { label: 'Yearly Savings (Kč)', data: his.map(d => parseFloat(d.uspora_kc_domacnost_rok) || 0), backgroundColor: colors.green, borderRadius: 4, yAxisID: 'y1' }
      ]
    }, {
      scales: { y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(0,0,0,0.04)' }, title: { display: true, text: 'kWp' } }, y1: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'Kč' } }, x: { grid: { display: false } } }
    });
  } else if (hisCanvas) {
    hisCanvas.parentElement.innerHTML = '<div class="chart-card glass" style="padding:40px;text-align:center;color:var(--text-muted)"><p>No historical data available for this city</p></div>';
  }

  const yoyCanvas = document.getElementById('yearOverYearChart');
  if (yoyCanvas && his.length > 0) {
    const colors = chartColors();
    cityChartInstances.yearOverYear = createChart(yoyCanvas.getContext('2d'), 'line', {
      labels: his.map(d => d.rok),
      datasets: [
        { label: 'Self-Sufficiency %', data: his.map(d => parseFloat(d.sobestacnost_procent) || 0), borderColor: colors.blue, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.blue, colors.blueLight + '20'), fill: true, tension: 0.3, pointRadius: 4, yAxisID: 'y' },
        { label: 'CO₂ Savings (t)', data: his.map(d => parseFloat(d.co2_uspory_t_rok) || 0), borderColor: colors.green, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.green, colors.greenLight + '20'), fill: true, tension: 0.3, pointRadius: 4, yAxisID: 'y1' }
      ]
    }, {
      scales: { y: { beginAtZero: true, max: 100, position: 'left', title: { display: true, text: 'Self-Sufficiency %' }, grid: { color: 'rgba(0,0,0,0.04)' } }, y1: { beginAtZero: true, position: 'right', title: { display: true, text: 'CO₂ (t)' }, grid: { display: false } }, x: { grid: { display: false } } }
    });
  }

  createEnergyTrendChart(analysis);
  createCo2TrendChart(analysis);
  createBatteryTrendChart(analysis);
}

function populateModule2_Solar(analysis) {
  const s = analysis.stats;
  const name = analysis.city;
  const factor = analysis.factor;
  const irradiance = analysis.irradiance;
  const grid = document.getElementById('insightsGrid');
  if (grid) {
    grid.innerHTML = [
      { icon: '☀️', title: 'Solar Potential', text: `Solar irradiance of ${irradiance} kWh/m²/year makes ${name} ${irradiance > 970 ? 'highly suitable' : 'suitable'} for PV installations.`, cls: 'rec-amber' },
      { icon: '⚡', title: 'FVE Capacity', text: `Current installed capacity: ${s.installedKwp} kWp. Estimated potential: ${s.fveSize} kWp based on budget.`, cls: 'rec-green' },
      { icon: '🔋', title: 'Battery Storage', text: `Battery capacity: ${s.batteryCapacity} kWh. Recommended: ${s.batterySize} kWh for optimal grid independence.`, cls: 'rec-blue' },
      { icon: '🏘️', title: 'Energy Community', text: `${name} ${['Most','Litoměřice','Louny'].includes(name) ? 'has active energy community initiatives' : 'has potential for energy community'}. Reduce costs by 15-25%.`, cls: 'rec-purple' }
    ].map((i, idx) => `<div class="insight-card glass ${i.cls}" style="animation-delay:${idx * 0.1}s"><div class="insight-icon">${i.icon}</div><div class="insight-title">${i.title}</div><div class="insight-text">${i.text}</div></div>`).join('');
  }
}

function populateModule3_Scenario(analysis) {
  const scenCanvas = document.getElementById('historicalScenarioChart');
  if (!scenCanvas) return;
  const colors = chartColors();
  const futYears = ['2026','2027','2028','2029','2030','2031','2032','2033','2034','2035'];

  const getScenarioData = (sid) => futYears.map(y => {
    const d = analysis.scenarioList.filter(s => s.scenar_id === sid && s.rok === y);
    return d.length > 0 ? parseFloat(d[0].sobestacnost_procent) || 0 : null;
  });

  const s00 = getScenarioData('S00');
  const s02 = getScenarioData('S02');
  const s05 = getScenarioData('S05');
  const s06 = getScenarioData('S06');

  const hasRealData = s00.some(v => v !== null);
  if (hasRealData) {
    cityChartInstances.historicalScenario = createChart(scenCanvas.getContext('2d'), 'line', {
      labels: futYears,
      datasets: [
        { label: 'Baseline (S00)', data: s00, borderColor: colors.red, borderDash: [5, 5], tension: 0.3, pointRadius: 3 },
        { label: 'FVE+Battery (S02)', data: s02, borderColor: colors.amber, tension: 0.3, pointRadius: 3 },
        { label: 'Advanced (S05)', data: s05, borderColor: colors.blue, tension: 0.3, pointRadius: 3 },
        { label: 'Hydrogen (S06)', data: s06, borderColor: colors.green, tension: 0.3, pointRadius: 3, fill: '-1', backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.green + '20', 'transparent') }
      ]
    }, {
      scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Self-Sufficiency %' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }
    });
  } else {
    scenCanvas.parentElement.innerHTML = '<div class="chart-card glass chart-full" style="padding:40px;text-align:center;color:var(--text-muted)"><p>No scenario forecast data available for this city</p></div>';
  }

  createSelfSufficiencyChart(analysis);
  createScenarioCompareChart(analysis);
  createSavingsTimelineChart(analysis);
}

function populateModule4_Optimization(analysis) {
  const s = analysis.stats;
  const pred = analysis.prediction;
  const grid = document.getElementById('recommendationsGrid');
  if (grid) {
    const paybackYears = pred.roi > 0 ? Math.round(100 / Math.max(pred.roi, 1)) : 10;
    grid.innerHTML = [
      { icon: '⚡', title: 'Recommended FVE Size', desc: `Based on location factor (${analysis.factor}), a ${pred.fve_kwp} kWp system maximizes ROI.`, value: pred.fve_kwp + ' kWp', cls: 'rec-amber' },
      { icon: '🔋', title: 'Recommended Battery', desc: `A ${pred.baterie_kwh} kWh battery for optimal storage and grid independence.`, value: pred.baterie_kwh + ' kWh', cls: 'rec-green' },
      { icon: '💰', title: 'ROI & Payback', desc: `Investment returns in ${paybackYears} years. Total savings: ${formatNum(pred.usporaKc * 25)} Kč over 25 years.`, value: pred.roi + '% p.a.', cls: 'rec-blue' },
      { icon: '🌱', title: 'Environmental Impact', desc: `Reduce CO₂ footprint by ${formatNum(pred.co2Uspora)} tons/year, equivalent to planting ${Math.round(pred.co2Uspora * 50)} trees.`, value: '+' + formatNum(pred.co2Uspora) + ' t', cls: 'rec-purple' }
    ].map((r, i) => `<div class="rec-card glass ${r.cls}" style="animation-delay:${i * 0.1}s"><div class="rec-card-icon">${r.icon}</div><div class="rec-card-title">${r.title}</div><div class="rec-card-desc">${r.desc}</div><div class="rec-card-value">${r.value}</div></div>`).join('');
  }
  const riskEl = document.getElementById('riskContent');
  if (riskEl) {
    const riskLevel = s.risk < 30 ? 'Low' : s.risk < 60 ? 'Medium' : 'High';
    const riskColor = s.risk < 30 ? 'var(--accent-green)' : s.risk < 60 ? 'var(--accent-warm)' : 'var(--accent-red)';
    riskEl.innerHTML = `<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px"><span style="font-size:2rem;font-weight:800;color:${riskColor}">${s.risk}%</span><span style="font-size:1rem;font-weight:600;color:${riskColor}">${riskLevel} Risk</span></div><div style="height:8px;background:var(--border-light);border-radius:4px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${s.risk}%;background:${riskColor};border-radius:4px;transition:width 1s ease"></div></div><p>Grid stability risk based on historical data, battery capacity, and grid dependency for ${analysis.city}.</p>${s.risk > 50 ? '<p style="color:var(--accent-red);margin-top:8px">⚠️ Consider larger battery storage or hydrogen backup.</p>' : ''}`;
  }
}

function populateRecommendations(analysis) {
  populateModule4_Optimization(analysis);
}

async function createEnergyTrendChart(analysis) {
  const canvas = document.getElementById('energyTrendChart');
  if (!canvas) return;
  const his = analysis.historical;
  if (his.length === 0) { canvas.parentElement.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No data</div>'; return; }
  const colors = chartColors();
  cityChartInstances.energyTrend = createChart(canvas.getContext('2d'), 'line', {
    labels: his.map(d => d.rok),
    datasets: [
      { label: 'Production (kWh)', data: his.map(d => parseFloat(d.vyroba_kwh_rok) || parseFloat(d.spotreba_MWh_rok) * 1000 * 0.3 || 0), borderColor: colors.blue, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.blue, colors.blueLight + '20'), fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Consumption (kWh)', data: his.map(d => parseFloat(d.spotreba_MWh_rok) * 1000 || 0), borderColor: colors.amber, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.amber, colors.amberLight + '20'), fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }
    ]
  }, { scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString() + ' kWh' } } } });
}

async function createCo2TrendChart(analysis) {
  const canvas = document.getElementById('co2TrendChart');
  if (!canvas) return;
  const his = analysis.historical;
  if (his.length === 0) { canvas.parentElement.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No data</div>'; return; }
  const colors = chartColors();
  cityChartInstances.co2Trend = createChart(canvas.getContext('2d'), 'bar', {
    labels: his.map(d => d.rok),
    datasets: [{ label: 'CO₂ Saved (tons)', data: his.map(d => parseFloat(d.co2_uspory_t_rok) || 0), backgroundColor: colors.green, borderRadius: 4, borderSkipped: false }]
  }, { scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + ' t CO₂' } } } });
}

async function createBatteryTrendChart(analysis) {
  const canvas = document.getElementById('batteryTrendChart');
  if (!canvas) return;
  const his = analysis.historical;
  if (his.length === 0) { canvas.parentElement.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">No data</div>'; return; }
  const colors = chartColors();
  cityChartInstances.batteryTrend = createChart(canvas.getContext('2d'), 'line', {
    labels: his.map(d => d.rok),
    datasets: [{ label: 'Battery Capacity (kWh)', data: his.map(d => parseFloat(d.baterie_kapacita_kWh) || 0), borderColor: colors.cyan, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.cyan, colors.cyanLight + '20'), fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 }]
  }, { scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.parsed.y.toFixed(1) + ' kWh' } } } });
}

async function createSelfSufficiencyChart(analysis) {
  const canvas = document.getElementById('selfSufficiencyChart');
  if (!canvas) return;
  const his = analysis.historical;
  const scens = analysis.scenarioList;
  const colors = chartColors();
  const years = his.map(d => d.rok);
  const selfSuff = his.map(d => parseFloat(d.sobestacnost_procent) || 0);
  const futYears = [...new Set(scens.map(s => s.rok))].sort();
  const s00 = futYears.map(y => { const d = scens.find(s => s.scenar_id === 'S00' && s.rok === y); return d ? parseFloat(d.sobestacnost_procent) || 0 : null; });
  const s05 = futYears.map(y => { const d = scens.find(s => s.scenar_id === 'S05' && s.rok === y); return d ? parseFloat(d.sobestacnost_procent) || 0 : null; });
  const s06 = futYears.map(y => { const d = scens.find(s => s.scenar_id === 'S06' && s.rok === y); return d ? parseFloat(d.sobestacnost_procent) || 0 : null; });

  cityChartInstances.selfSufficiency = createChart(canvas.getContext('2d'), 'line', {
    labels: [...years, ...futYears],
    datasets: [
      { label: 'Historical', data: [...selfSuff, ...Array(futYears.length).fill(null)], borderColor: colors.blue, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.blue, colors.blueLight + '20'), fill: true, tension: 0.3, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Baseline (S00)', data: [...Array(years.length).fill(null), ...s00], borderColor: colors.red, borderDash: [5, 5], tension: 0.3, pointRadius: 3 },
      { label: 'Advanced (S05)', data: [...Array(years.length).fill(null), ...s05], borderColor: colors.amber, borderDash: [5, 5], tension: 0.3, pointRadius: 3 },
      { label: 'Optimal (S06)', data: [...Array(years.length).fill(null), ...s06], borderColor: colors.green, borderDash: [5, 5], tension: 0.3, pointRadius: 3 }
    ]
  }, { scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Self-Sufficiency %' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.dataset.label + ': ' + (ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) + '%' : 'N/A') } } } });
}

async function createScenarioCompareChart(analysis) {
  const canvas = document.getElementById('scenarioCompareChart');
  if (!canvas) return;
  const scens = analysis.scenarioList;
  const colors = chartColors();
  const sids = ['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
  const labels = { S00: 'Baseline', S01: 'Small FVE', S02: 'FVE+Battery', S03: 'Savings', S04: 'Community', S05: 'Large FVE', S06: 'Hydrogen' };
  const y2030 = scens.filter(s => s.rok === '2030');
  cityChartInstances.scenarioCompare = createChart(canvas.getContext('2d'), 'radar', {
    labels: sids.map(sid => labels[sid]),
    datasets: [
      { label: 'Self-Sufficiency %', data: sids.map(sid => { const d = y2030.find(s => s.scenar_id === sid); return d ? (parseFloat(d.sobestacnost_procent) || 0) : 0; }), backgroundColor: colors.blue + '40' },
      { label: 'Savings (Kč)', data: sids.map(sid => { const d = y2030.find(s => s.scenar_id === sid); return d ? (parseFloat(d.uspora_kc_domacnost_rok) || 0) : 0; }), backgroundColor: colors.green + '40' },
      { label: 'CO₂ (t)', data: sids.map(sid => { const d = y2030.find(s => s.scenar_id === sid); return d ? (parseFloat(d.co2_uspory_t_rok) || 0) : 0; }), backgroundColor: colors.amber + '40' }
    ]
  }, { scales: { r: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { display: false } } } });
}

async function createSavingsTimelineChart(analysis) {
  const canvas = document.getElementById('savingsTimelineChart');
  if (!canvas) return;
  const scens = analysis.scenarioList;
  const colors = chartColors();
  const years = [...new Set(scens.map(s => s.rok))].sort().slice(0, 10);
  cityChartInstances.savingsTimeline = createChart(canvas.getContext('2d'), 'line', {
    labels: years,
    datasets: [
      { label: 'Advanced FVE (S05)', data: years.map(y => { const d = scens.find(s => s.scenar_id === 'S05' && s.rok === y); return d ? (parseFloat(d.uspora_kc_domacnost_rok) || 0) : 0; }), borderColor: colors.amber, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.amber + '40', colors.amber + '10'), fill: true, tension: 0.3, pointRadius: 4 },
      { label: 'Hydrogen Vision (S06)', data: years.map(y => { const d = scens.find(s => s.scenar_id === 'S06' && s.rok === y); return d ? (parseFloat(d.uspora_kc_domacnost_rok) || 0) : 0; }), borderColor: colors.green, backgroundColor: ctx => chartGradient(ctx.canvas.getContext('2d'), ctx.chart.chartArea, colors.green + '40', colors.green + '10'), fill: true, tension: 0.3, pointRadius: 4 }
    ]
  }, { scales: { y: { beginAtZero: true, title: { display: true, text: 'Yearly Savings (Kč)' }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }, plugins: { tooltip: { callbacks: { label: ctx => ctx.parsed.y.toLocaleString() + ' Kč' } } } });
}

async function populateAiExplanations(analysis) {
  const grid = document.getElementById('aiExplanationGrid');
  if (!grid) return;
  const pred = analysis.prediction;
  const explanations = [
    { icon: '🎯', title: 'Why This Recommendation?', text: `For ${analysis.city}, we recommend a ${pred.fve_kwp} kWp system with ${pred.baterie_kwh} kWh battery. This achieves ${pred.sobestacnost}% self-sufficiency based on solar factor (${analysis.factor}).`, confidence: pred.confidence },
    { icon: '🧮', title: 'How Prediction Was Calculated', text: `Prediction uses historical data (2015-2025), scenarios (2026-2035), and SimpleML models. Production = ${pred.fve_kwp} kWp × 950 h × ${analysis.factor} factor = ${Math.round(pred.fve_kwp * 950 * analysis.factor).toLocaleString()} kWh/year.`, confidence: pred.confidence - 5 },
    { icon: '📊', title: 'Data Sources Used', text: `Analysis combines: municipal historical data (${analysis.historical.length} records, 2015-2025), ${Object.keys(analysis.scenarios).length} scenarios (S00-S06, 2026-2035), energy measures catalog, and SimpleML model predictions.`, confidence: pred.confidence + 5 },
    { icon: '✅', title: 'Prediction Confidence', text: `Overall confidence: ${pred.confidence}%. Data availability: historical ${analysis.historical.length > 0 ? '✓' : '✗'}, scenarios ${analysis.scenarioList.length > 0 ? '✓' : '✗'}.`, confidence: pred.confidence }
  ];
  grid.innerHTML = explanations.map((e, i) => `
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

function animateSections() {
  const sections = document.querySelectorAll('.city-section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  sections.forEach(section => observer.observe(section));
  sections.forEach(s => s.classList.add('visible'));
}

function formatNum(num) {
  if (typeof num === 'string') num = parseFloat(num);
  if (isNaN(num)) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return Math.round(num).toString();
}

window.selectLocation = selectLocation;
window.scrollToAnalysis = scrollToAnalysis;
