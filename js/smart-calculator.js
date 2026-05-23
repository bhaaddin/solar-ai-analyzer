(function () {
  const state = {
    currentStep: 1,
    totalSteps: 5,
    isOpen: false,
    data: {
      projectName: '',
      userName: '',
      address: '',
      projectType: 'house',
      panelCount: 20,
      panelType: 'monocrystalline',
      panelPower: 450,
      totalPower: 9,
      roofArea: 50,
      roofAngle: 35,
      roofOrientation: 'south',
      batteryCapacity: 10,
      batteryType: 'lithium-ion',
      annualConsumption: 5000,
      expectedProduction: 0,
      electricityCost: 5.5,
      householdCount: 1,
      selfSufficiencyTarget: 70,
      hydrogenStorage: 0,
      gridInstabilityRisk: 30,
      communitySharing: 'no',
      emsEnabled: 'no'
    },
    results: null
  }

  const PANEL_TYPES = [
    { id: 'monocrystalline', name: 'Monocrystalline', efficiency: '20-24%', lifespan: '30+ let', cost: '8 500 Kč/kWp' },
    { id: 'polycrystalline', name: 'Polycrystalline', efficiency: '16-20%', lifespan: '25+ let', cost: '6 500 Kč/kWp' },
    { id: 'thin-film', name: 'Thin Film', efficiency: '10-14%', lifespan: '20+ let', cost: '4 500 Kč/kWp' },
    { id: 'bifacial', name: 'Bifacial', efficiency: '22-27%', lifespan: '35+ let', cost: '10 500 Kč/kWp' }
  ]

  const BATTERY_TYPES = [
    { id: 'lithium-ion', name: 'Lithium Ion', capacity: '5-20 kWh', lifespan: '10-15 let', cost: '12 000 Kč/kWh' },
    { id: 'lifepo4', name: 'LiFePO4', capacity: '5-50 kWh', lifespan: '15-20 let', cost: '9 000 Kč/kWh' },
    { id: 'hydrogen', name: 'Vodíkové úložiště', capacity: '50-500 kWh', lifespan: '20+ let', cost: '25 000 Kč/kWh' },
    { id: 'none', name: 'Bez úložiště', capacity: '0 kWh', lifespan: '-', cost: '0 Kč' }
  ]

  function init () {
    buildSidebar()
    bindEvents()
    updateStep()
    loadSavedState()
  }

  function buildSidebar () {
    const sidebar = document.getElementById('smartSidebar')
    if (!sidebar) return

    sidebar.innerHTML = `
      <button class="smart-toggle" id="smartToggle" title="AI Energy Planner">
        <span class="smart-toggle-icon">📐</span>
        <span class="smart-toggle-label">Planner</span>
      </button>

      <div class="smart-panel" id="smartPanel">
        <div class="smart-panel-header">
          <div class="smart-panel-title">
            <span class="smart-panel-icon">🧮</span>
            <span>AI Energy Planner</span>
          </div>
          <button class="smart-panel-close" id="smartClose">✕</button>
        </div>

        <div class="smart-progress" id="smartProgress">
          <div class="smart-steps" id="smartSteps">
            <span class="smart-step active" data-step="1">1</span>
            <span class="smart-step-line"></span>
            <span class="smart-step" data-step="2">2</span>
            <span class="smart-step-line"></span>
            <span class="smart-step" data-step="3">3</span>
            <span class="smart-step-line"></span>
            <span class="smart-step" data-step="4">4</span>
            <span class="smart-step-line"></span>
            <span class="smart-step" data-step="5">5</span>
          </div>
          <div class="smart-step-label" id="stepLabel">Krok 1 z 5</div>
        </div>

        <div class="smart-body" id="smartBody">
          ${buildStep1()}
          ${buildStep2()}
          ${buildStep3()}
          ${buildStep4()}
          ${buildStep5()}
        </div>

        <div class="smart-footer" id="smartFooter">
          <div class="smart-nav" id="smartNav">
            <button class="btn btn-outline btn-sm" id="prevBtn">← Zpět</button>
            <button class="btn btn-primary btn-sm" id="nextBtn">Pokračovat →</button>
          </div>
          <button class="btn btn-primary smart-calc-btn" id="calcBtn" style="display:none;">
            ⚡ Calculate Complete Energy Plan
          </button>
        </div>

        <div class="smart-results" id="smartResults" style="display:none;"></div>
      </div>
    `
  }

  function buildStep1 () {
    return `
      <div class="smart-step-content" data-step-content="1">
        <div class="smart-step-header">📋 Projektové informace</div>
        <div class="smart-form">
          <div class="smart-field">
            <label>Název projektu</label>
            <input type="text" class="smart-input" id="field-projectName" placeholder="např. Rodinný dům Most" value="${state.data.projectName}">
          </div>
          <div class="smart-field">
            <label>Vaše jméno</label>
            <input type="text" class="smart-input" id="field-userName" placeholder="např. Jan Novák" value="${state.data.userName}">
          </div>
          <div class="smart-field">
            <label>Adresa / Obec</label>
            <input type="text" class="smart-input" id="field-address" placeholder="např. Most, Ústecký kraj" value="${state.data.address}">
          </div>
          <div class="smart-field">
            <label>Typ projektu</label>
            <select class="smart-input smart-select" id="field-projectType">
              <option value="house" ${state.data.projectType === 'house' ? 'selected' : ''}>🏠 Rodinný dům</option>
              <option value="apartment" ${state.data.projectType === 'apartment' ? 'selected' : ''}>🏢 Bytový dům</option>
              <option value="industrial" ${state.data.projectType === 'industrial' ? 'selected' : ''}>🏭 Průmyslová budova</option>
              <option value="community" ${state.data.projectType === 'community' ? 'selected' : ''}>👥 Komunitní projekt</option>
              <option value="energy-community" ${state.data.projectType === 'energy-community' ? 'selected' : ''}>⚡ Energetické společenství</option>
            </select>
          </div>
        </div>
      </div>
    `
  }

  function buildStep2 () {
    return `
      <div class="smart-step-content" data-step-content="2">
        <div class="smart-step-header">🔆 Konfigurace solárního systému</div>
        <div class="smart-form">
          <div class="smart-field">
            <label>Počet panelů</label>
            <input type="number" class="smart-input" id="field-panelCount" min="1" max="500" value="${state.data.panelCount}">
          </div>
          <div class="smart-field">
            <label>Typ panelu</label>
            <select class="smart-input smart-select" id="field-panelType">
              <option value="monocrystalline" ${state.data.panelType === 'monocrystalline' ? 'selected' : ''}>Monocrystalline</option>
              <option value="polycrystalline" ${state.data.panelType === 'polycrystalline' ? 'selected' : ''}>Polycrystalline</option>
              <option value="thin-film" ${state.data.panelType === 'thin-film' ? 'selected' : ''}>Thin Film</option>
              <option value="bifacial" ${state.data.panelType === 'bifacial' ? 'selected' : ''}>Bifacial</option>
            </select>
          </div>
          <div class="smart-field">
            <label>Výkon panelu (W)</label>
            <input type="number" class="smart-input" id="field-panelPower" min="100" max="700" step="5" value="${state.data.panelPower}">
          </div>
          <div class="smart-field">
            <label>Celkový výkon FVE (kWp)</label>
            <input type="number" class="smart-input smart-input-highlight" id="field-totalPower" step="0.1" value="${state.data.totalPower}" readonly>
            <span class="smart-field-hint">Automaticky dopočteno</span>
          </div>
          <div class="smart-field">
            <label>Plocha střechy (m²)</label>
            <input type="number" class="smart-input" id="field-roofArea" min="10" max="10000" value="${state.data.roofArea}">
          </div>
          <div class="smart-field">
            <label>Sklon střechy (°)</label>
            <input type="number" class="smart-input" id="field-roofAngle" min="0" max="90" value="${state.data.roofAngle}">
          </div>
          <div class="smart-field">
            <label>Orientace střechy</label>
            <select class="smart-input smart-select" id="field-roofOrientation">
              <option value="south" ${state.data.roofOrientation === 'south' ? 'selected' : ''}>Jih</option>
              <option value="southeast" ${state.data.roofOrientation === 'southeast' ? 'selected' : ''}>Jihovýchod</option>
              <option value="southwest" ${state.data.roofOrientation === 'southwest' ? 'selected' : ''}>Jihozápad</option>
              <option value="east" ${state.data.roofOrientation === 'east' ? 'selected' : ''}>Východ</option>
              <option value="west" ${state.data.roofOrientation === 'west' ? 'selected' : ''}>Západ</option>
            </select>
          </div>
          <div class="smart-orientation-visual">
            <div class="orientation-roof">
              <span class="orientation-label" id="orientLabel">Jih</span>
              <div class="orientation-arrow" id="orientArrow">⬆</div>
              <div class="orientation-deg" id="orientDeg">180°</div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function buildStep3 () {
    return `
      <div class="smart-step-content" data-step-content="3">
        <div class="smart-step-header">🔋 Konfigurace baterie</div>
        <div class="smart-form">
          <div class="smart-field">
            <label>Kapacita baterie (kWh)</label>
            <input type="number" class="smart-input" id="field-batteryCapacity" min="0" max="500" step="0.5" value="${state.data.batteryCapacity}">
          </div>
          <div class="smart-field">
            <label>Typ baterie</label>
            <select class="smart-input smart-select" id="field-batteryType">
              <option value="lithium-ion" ${state.data.batteryType === 'lithium-ion' ? 'selected' : ''}>Lithium Ion</option>
              <option value="lifepo4" ${state.data.batteryType === 'lifepo4' ? 'selected' : ''}>LiFePO4</option>
              <option value="hydrogen" ${state.data.batteryType === 'hydrogen' ? 'selected' : ''}>Vodíkové úložiště</option>
              <option value="none" ${state.data.batteryType === 'none' ? 'selected' : ''}>Bez úložiště</option>
            </select>
          </div>
          <div class="smart-battery-info" id="batteryInfo">
            <div class="smart-battery-card">
              <div class="smart-bc-label">Doporučená kapacita</div>
              <div class="smart-bc-value" id="recBatteryCapacity">10 kWh</div>
            </div>
            <div class="smart-battery-card">
              <div class="smart-bc-label">Životnost</div>
              <div class="smart-bc-value" id="recBatteryLifespan">10-15 let</div>
            </div>
            <div class="smart-battery-card">
              <div class="smart-bc-label">Odhadovaná cena</div>
              <div class="smart-bc-value" id="recBatteryCost">120 000 Kč</div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function buildStep4 () {
    return `
      <div class="smart-step-content" data-step-content="4">
        <div class="smart-step-header">⚡ Energetické informace</div>
        <div class="smart-form">
          <div class="smart-field">
            <label>Roční spotřeba energie (kWh)</label>
            <input type="number" class="smart-input" id="field-annualConsumption" min="0" max="10000000" step="100" value="${state.data.annualConsumption}">
          </div>
          <div class="smart-field">
            <label>Očekávaná roční výroba (kWh)</label>
            <input type="number" class="smart-input" id="field-expectedProduction" min="0" max="10000000" step="100" value="${state.data.expectedProduction}">
            <span class="smart-field-hint">Nechte 0 pro automatický výpočet</span>
          </div>
          <div class="smart-field">
            <label>Aktuální cena elektřiny (Kč/kWh)</label>
            <input type="number" class="smart-input" id="field-electricityCost" min="0" max="20" step="0.1" value="${state.data.electricityCost}">
          </div>
          <div class="smart-field">
            <label>Počet domácností</label>
            <input type="number" class="smart-input" id="field-householdCount" min="1" max="1000" value="${state.data.householdCount}">
          </div>
          <div class="smart-field">
            <label>Cíl soběstačnosti (%)</label>
            <div class="smart-range-wrap">
              <input type="range" class="smart-range" id="field-selfSufficiencyTarget" min="10" max="100" step="5" value="${state.data.selfSufficiencyTarget}">
              <span class="smart-range-val" id="selfSufficiencyVal">${state.data.selfSufficiencyTarget}%</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function buildStep5 () {
    return `
      <div class="smart-step-content" data-step-content="5">
        <div class="smart-step-header">🧠 Pokročilé AI proměnné</div>
        <div class="smart-form">
          <div class="smart-field smart-field-toggle">
            <div class="smart-toggle-row">
              <span class="smart-toggle-label">💧 Vodíkové úložiště</span>
              <label class="toggle-switch">
                <input type="checkbox" id="field-hydrogenStorage" ${state.data.hydrogenStorage ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <span class="smart-field-hint">Sezónní stabilita sítě</span>
          </div>
          <div class="smart-field">
            <label>Riziko nestability sítě (0-100)</label>
            <div class="smart-range-wrap">
              <input type="range" class="smart-range" id="field-gridInstabilityRisk" min="0" max="100" step="5" value="${state.data.gridInstabilityRisk}">
              <span class="smart-range-val" id="gridRiskVal">${state.data.gridInstabilityRisk}%</span>
            </div>
            <div class="smart-risk-bar">
              <div class="smart-risk-fill" id="riskFill" style="width:${state.data.gridInstabilityRisk}%"></div>
            </div>
          </div>
          <div class="smart-field smart-field-toggle">
            <div class="smart-toggle-row">
              <span class="smart-toggle-label">👥 Sdílení energie v komunitě</span>
              <label class="toggle-switch">
                <input type="checkbox" id="field-communitySharing" ${state.data.communitySharing === 'yes' ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <span class="smart-field-hint">Přebytečná energie sdílena s ostatními</span>
          </div>
          <div class="smart-field smart-field-toggle">
            <div class="smart-toggle-row">
              <span class="smart-toggle-label">⚙️ EMS (Energy Management System)</span>
              <label class="toggle-switch">
                <input type="checkbox" id="field-emsEnabled" ${state.data.emsEnabled === 'yes' ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <span class="smart-field-hint">Inteligentní řízení spotřeby</span>
          </div>
        </div>
      </div>
    `
  }

  function bindEvents () {
    document.addEventListener('click', function (e) {
      const toggle = e.target.closest('#smartToggle')
      const close = e.target.closest('#smartClose')
      const stepDot = e.target.closest('.smart-step:not(.active)')
      const prevBtn = e.target.closest('#prevBtn')
      const nextBtn = e.target.closest('#nextBtn')
      const calcBtn = e.target.closest('#calcBtn')

      if (toggle) { e.preventDefault(); toggleSidebar() }
      else if (close) { e.preventDefault(); closeSidebar() }
      else if (stepDot) { e.preventDefault(); goToStep(parseInt(stepDot.dataset.step)) }
      else if (prevBtn) { e.preventDefault(); prevStep() }
      else if (nextBtn) { e.preventDefault(); nextStep() }
      else if (calcBtn) { e.preventDefault(); calculate() }
    })

    document.addEventListener('input', function (e) {
      const field = e.target.closest('.smart-input')
      if (!field) return

      const id = field.id
      if (!id || !id.startsWith('field-')) return

      const key = id.replace('field-', '')
      let value = field.type === 'checkbox' ? (field.checked ? 1 : 0) : field.value

      if (field.type === 'number') value = parseFloat(value) || 0

      if (key === 'communitySharing' || key === 'emsEnabled') {
        value = field.checked ? 'yes' : 'no'
      }

      state.data[key] = value
      saveState()

      if (key === 'panelCount' || key === 'panelPower') {
        updateTotalPower()
      }
      if (key === 'batteryType') {
        updateBatteryInfo()
      }
      if (key === 'selfSufficiencyTarget') {
        const valEl = document.getElementById('selfSufficiencyVal')
        if (valEl) valEl.textContent = value + '%'
      }
      if (key === 'gridInstabilityRisk') {
        const valEl = document.getElementById('gridRiskVal')
        if (valEl) valEl.textContent = value + '%'
        const fillEl = document.getElementById('riskFill')
        if (fillEl) fillEl.style.width = value + '%'
      }
    })
  }

  function updateTotalPower () {
    const count = parseInt(state.data.panelCount) || 0
    const power = parseInt(state.data.panelPower) || 0
    const total = (count * power) / 1000
    state.data.totalPower = parseFloat(total.toFixed(2))
    const el = document.getElementById('field-totalPower')
    if (el) el.value = state.data.totalPower
    saveState()
  }

  function updateBatteryInfo () {
    const bt = BATTERY_TYPES.find(b => b.id === state.data.batteryType) || BATTERY_TYPES[0]
    const capEl = document.getElementById('recBatteryCapacity')
    const lifeEl = document.getElementById('recBatteryLifespan')
    const costEl = document.getElementById('recBatteryCost')

    if (capEl) capEl.textContent = bt.capacity
    if (lifeEl) lifeEl.textContent = bt.lifespan

    const totalCap = state.data.batteryCapacity || 0
    const costPerUnit = bt.id === 'lithium-ion' ? 12000 : bt.id === 'lifepo4' ? 9000 : bt.id === 'hydrogen' ? 25000 : 0
    if (costEl) costEl.textContent = (totalCap * costPerUnit).toLocaleString() + ' Kč'
  }

  function toggleSidebar () {
    state.isOpen ? closeSidebar() : openSidebar()
  }

  function openSidebar () {
    state.isOpen = true
    const panel = document.getElementById('smartPanel')
    const toggle = document.getElementById('smartToggle')
    if (panel) panel.classList.add('open')
    if (toggle) toggle.classList.add('open')
    document.body.classList.add('smart-sidebar-open')
  }

  function closeSidebar () {
    state.isOpen = false
    const panel = document.getElementById('smartPanel')
    const toggle = document.getElementById('smartToggle')
    if (panel) panel.classList.remove('open')
    if (toggle) toggle.classList.remove('open')
    document.body.classList.remove('smart-sidebar-open')
  }

  function goToStep (step) {
    if (step < 1 || step > state.totalSteps) return
    state.currentStep = step
    updateStep()
    saveState()
  }

  function prevStep () {
    if (state.currentStep > 1) goToStep(state.currentStep - 1)
  }

  function nextStep () {
    if (state.currentStep < state.totalSteps) {
      state.currentStep++
      updateStep()
      saveState()
    }
  }

  function updateStep () {
    const allSteps = document.querySelectorAll('.smart-step')
    const allContents = document.querySelectorAll('.smart-step-content')
    const label = document.getElementById('stepLabel')
    const prevBtn = document.getElementById('prevBtn')
    const nextBtn = document.getElementById('nextBtn')
    const calcBtn = document.getElementById('calcBtn')

    allSteps.forEach((el, i) => {
      el.classList.toggle('active', i + 1 === state.currentStep)
      el.classList.toggle('completed', i + 1 < state.currentStep)
    })

    allContents.forEach((el) => {
      el.style.display = parseInt(el.dataset.stepContent) === state.currentStep ? 'block' : 'none'
    })

    if (label) label.textContent = `Krok ${state.currentStep} z ${state.totalSteps}`
    if (prevBtn) prevBtn.style.visibility = state.currentStep === 1 ? 'hidden' : 'visible'
    if (nextBtn) nextBtn.style.display = state.currentStep === state.totalSteps ? 'none' : 'inline-flex'
    if (calcBtn) calcBtn.style.display = state.currentStep === state.totalSteps ? 'flex' : 'none'
  }

  function collectAllData () {
    state.data.projectName = getVal('projectName')
    state.data.userName = getVal('userName')
    state.data.address = getVal('address')
    state.data.projectType = getVal('projectType')
    state.data.panelCount = parseInt(getVal('panelCount')) || 0
    state.data.panelType = getVal('panelType')
    state.data.panelPower = parseInt(getVal('panelPower')) || 0
    state.data.totalPower = parseFloat(getVal('totalPower')) || 0
    state.data.roofArea = parseInt(getVal('roofArea')) || 0
    state.data.roofAngle = parseInt(getVal('roofAngle')) || 0
    state.data.roofOrientation = getVal('roofOrientation')
    state.data.batteryCapacity = parseFloat(getVal('batteryCapacity')) || 0
    state.data.batteryType = getVal('batteryType')
    state.data.annualConsumption = parseInt(getVal('annualConsumption')) || 0
    state.data.expectedProduction = parseInt(getVal('expectedProduction')) || 0
    state.data.electricityCost = parseFloat(getVal('electricityCost')) || 0
    state.data.householdCount = parseInt(getVal('householdCount')) || 1
    state.data.selfSufficiencyTarget = parseInt(getVal('selfSufficiencyTarget')) || 70
    state.data.hydrogenStorage = document.getElementById('field-hydrogenStorage')?.checked ? 1 : 0
    state.data.gridInstabilityRisk = parseInt(getVal('gridInstabilityRisk')) || 0
    state.data.communitySharing = document.getElementById('field-communitySharing')?.checked ? 'yes' : 'no'
    state.data.emsEnabled = document.getElementById('field-emsEnabled')?.checked ? 'yes' : 'no'
  }

  function getVal (key) {
    const el = document.getElementById('field-' + key)
    return el ? el.value : ''
  }

  function calculate () {
    collectAllData()

    const d = state.data
    const panelInfo = PANEL_TYPES.find(p => p.id === d.panelType) || PANEL_TYPES[0]
    const batteryInfo = BATTERY_TYPES.find(b => b.id === d.batteryType) || BATTERY_TYPES[0]

    const panelCostPerWp = d.panelType === 'bifacial' ? 10.5 : d.panelType === 'monocrystalline' ? 8.5 : d.panelType === 'polycrystalline' ? 6.5 : 4.5
    const totalPanelCost = d.totalPower * 1000 * panelCostPerWp
    const batteryCostPerKwh = d.batteryType === 'lithium-ion' ? 12000 : d.batteryType === 'lifepo4' ? 9000 : d.batteryType === 'hydrogen' ? 25000 : 0
    const totalBatteryCost = d.batteryCapacity * batteryCostPerKwh
    const installationCost = totalPanelCost * 0.15
    const hydrogenCost = d.hydrogenStorage ? 500000 : 0
    const emsCost = d.emsEnabled === 'yes' ? 80000 : 0
    const totalInvestment = totalPanelCost + totalBatteryCost + installationCost + hydrogenCost + emsCost

    const orientationFactor = d.roofOrientation === 'south' ? 1.0 : d.roofOrientation === 'southeast' || d.roofOrientation === 'southwest' ? 0.92 : 0.78
    const angleFactor = Math.cos(Math.abs(d.roofAngle - 35) * Math.PI / 180) * 0.3 + 0.7
    const yearlyProduction = d.totalPower * 950 * orientationFactor * angleFactor
    const finalProduction = d.expectedProduction > 0 ? d.expectedProduction : Math.round(yearlyProduction)

    const yearlySavings = Math.round(finalProduction * d.electricityCost * 0.85)
    const paybackYears = totalInvestment > 0 ? parseFloat((totalInvestment / Math.max(yearlySavings, 1)).toFixed(1)) : 0
    const co2Reduction = Math.round(finalProduction * 0.4)
    const selfSufficiency = Math.min(Math.round((finalProduction / Math.max(d.annualConsumption, 1)) * 100), 100)

    const communityBonus = d.communitySharing === 'yes' ? 5 : 0
    const hydrogenBonus = d.hydrogenStorage ? 8 : 0
    const emsBonus = d.emsEnabled === 'yes' ? 7 : 0
    const efficiencyScore = Math.min(Math.round((selfSufficiency * 0.5 + (100 - d.gridInstabilityRisk) * 0.2 + communityBonus + hydrogenBonus + emsBonus)), 100)

    const gridImpact = Math.max(0, Math.min(Math.round(100 - d.gridInstabilityRisk * 0.5 + (d.hydrogenStorage ? 15 : 0) + (d.emsEnabled === 'yes' ? 10 : 0)), 100))

    const explanations = []
    explanations.push(getOrientationExplanation(d.roofOrientation))
    explanations.push(getBatteryExplanation(d))
    if (d.hydrogenStorage) explanations.push('Vodíkové úložiště pomáhá redukovat sezónní ztráty energie a zvyšuje stabilitu sítě.')
    if (d.emsEnabled === 'yes') explanations.push('EMS umožňuje inteligentní řízení spotřeby a optimalizaci využití solární energie.')
    if (d.communitySharing === 'yes') explanations.push('Sdílení energie v komunitě zvyšuje celkovou efektivitu a umožňuje lepší využití přebytečné energie.')
    if (selfSufficiency < 50) explanations.push('Pro zvýšení soběstačnosti doporučujeme zvýšit kapacitu FVE systému nebo přidat bateriové úložiště.')
    if (d.gridInstabilityRisk > 50) explanations.push('Vysoké riziko nestability sítě - doporučujeme záložní bateriový systém a EMS.')
    if (efficiencyScore > 80) explanations.push('Váš energetický systém dosahuje vynikající efektivity. Gratulujeme!')

    const results = {
      solar: {
        totalFveSize: d.totalPower,
        recommendedPanels: d.panelCount,
        recommendedBattery: d.batteryCapacity,
        yearlyProduction: finalProduction
      },
      financial: {
        totalInvestment: Math.round(totalInvestment),
        yearlySavings,
        roi: paybackYears,
        paybackPeriod: paybackYears
      },
      sustainability: {
        co2Reduction,
        selfSufficiency,
        efficiencyScore,
        gridImpact
      },
      aiExplanations: explanations,
      panelComparison: PANEL_TYPES,
      batteryComparison: BATTERY_TYPES,
      financialProjection: generateFinancialProjection(yearlySavings, totalInvestment, co2Reduction),
      raw: d
    }

    state.results = results
    showResults(results)
  }

  function getOrientationExplanation (orientation) {
    const map = {
      south: 'Jižní orientace střechy je optimální pro maximální roční výrobu energie.',
      southeast: 'Jihovýchodní orientace poskytuje dobrý výkon s vyšší produkcí v dopoledních hodinách.',
      southwest: 'Jihozápadní orientace je vhodná s vyšší produkcí v odpoledních hodinách.',
      east: 'Východní orientace produkuje více energie v dopoledních hodinách.',
      west: 'Západní orientace produkuje více energie v odpoledních hodinách, vhodná pro večerní spotřebu.'
    }
    return map[orientation] || 'Orientace střechy ovlivňuje celkovou roční výrobu energie.'
  }

  function getBatteryExplanation (d) {
    if (d.batteryType === 'none') return 'Bez bateriového úložiště bude přebytečná energie dodávána do sítě.'
    if (d.batteryType === 'hydrogen') return 'Vodíkové úložiště umožňuje dlouhodobé sezónní skladování energie s minimálními ztrátami.'
    const needed = Math.round(d.totalPower * 1.2)
    if (d.batteryCapacity < needed) return `Doporučujeme zvýšit kapacitu baterie na ${needed} kWh pro optimální využití FVE systému.`
    return 'Kapacita baterie je vhodně dimenzována pro váš FVE systém.'
  }

  function generateFinancialProjection (yearlySavings, totalInvestment, co2Reduction) {
    const years = []
    for (let y = 1; y <= 10; y++) {
      const savings = Math.round(yearlySavings * y * 1.03)
      const totalReturn = savings - totalInvestment
      const co2 = co2Reduction * y
      years.push({ year: y, savings, totalReturn, co2 })
    }
    return years
  }

  function showResults (r) {
    const container = document.getElementById('smartResults')
    const nav = document.getElementById('smartNav')
    const calcBtn = document.getElementById('calcBtn')
    const footer = document.getElementById('smartFooter')

    if (nav) nav.style.display = 'none'
    if (calcBtn) calcBtn.style.display = 'none'

    if (!container) return

    container.innerHTML = `
      <div class="smart-results-inner">
        <div class="smart-results-header">
          <h3>✅ Výsledky energetického plánu</h3>
          <button class="smart-edit-btn btn btn-sm btn-outline" id="editResultsBtn">✏️ Upravit vstupy</button>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">🔆 Solární doporučení</div>
          <div class="smart-result-grid">
            <div class="smart-rc rc-blue">
              <div class="src-icon">⚡ Celková FVE</div>
              <div class="src-value">${r.solar.totalFveSize} <small>kWp</small></div>
              <div class="src-detail">${r.solar.recommendedPanels} panelů</div>
            </div>
            <div class="smart-rc rc-green">
              <div class="src-icon">🔋 Baterie</div>
              <div class="src-value">${r.solar.recommendedBattery} <small>kWh</small></div>
              <div class="src-detail">${state.data.batteryType === 'none' ? 'Bez úložiště' : state.data.batteryType === 'hydrogen' ? 'Vodíkové' : state.data.batteryType === 'lifepo4' ? 'LiFePO4' : 'Lithium Ion'}</div>
            </div>
            <div class="smart-rc rc-amber">
              <div class="src-icon">📅 Roční výroba</div>
              <div class="src-value">${r.solar.yearlyProduction.toLocaleString()} <small>kWh</small></div>
              <div class="src-detail">${orientationLabel(state.data.roofOrientation)}</div>
            </div>
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">💰 Finanční predikce</div>
          <div class="smart-result-grid">
            <div class="smart-rc rc-emerald">
              <div class="src-icon">🏦 Celková investice</div>
              <div class="src-value">${r.financial.totalInvestment.toLocaleString()} <small>Kč</small></div>
              <div class="src-detail">vč. instalace</div>
            </div>
            <div class="smart-rc rc-green">
              <div class="src-icon">📈 Roční úspora</div>
              <div class="src-value">${r.financial.yearlySavings.toLocaleString()} <small>Kč</small></div>
              <div class="src-detail"></div>
            </div>
            <div class="smart-rc rc-sky">
              <div class="src-icon">🔄 Návratnost (ROI)</div>
              <div class="src-value">${r.financial.roi} <small>let</small></div>
              <div class="src-detail">Payback period</div>
            </div>
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">🌍 Udržitelnost</div>
          <div class="smart-result-grid">
            <div class="smart-rc rc-green">
              <div class="src-icon">🌱 CO₂ úspora</div>
              <div class="src-value">${r.sustainability.co2Reduction.toLocaleString()} <small>kg/rok</small></div>
              <div class="src-detail">≈ ${Math.round(r.sustainability.co2Reduction / 20)} stromů</div>
            </div>
            <div class="smart-rc rc-amber">
              <div class="src-icon">🏠 Soběstačnost</div>
              <div class="src-value">${r.sustainability.selfSufficiency} <small>%</small></div>
              <div class="src-detail">cíl: ${state.data.selfSufficiencyTarget}%</div>
            </div>
            <div class="smart-rc rc-blue">
              <div class="src-icon">⭐ Energetická efektivita</div>
              <div class="src-value">${r.sustainability.efficiencyScore} <small>/100</small></div>
              <div class="src-detail">Grid stability: ${r.sustainability.gridImpact}%</div>
            </div>
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">🧠 AI vysvětlení</div>
          <div class="smart-explanations">
            ${r.aiExplanations.map(ex => `<div class="smart-explanation">💡 ${ex}</div>`).join('')}
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">📊 Porovnání panelů</div>
          <div class="smart-table-wrap">
            <table class="smart-table">
              <thead><tr><th>Typ</th><th>Efektivita</th><th>Životnost</th><th>Cena</th></tr></thead>
              <tbody>
                ${r.panelComparison.filter(p => true).map(p => `
                  <tr class="${p.id === state.data.panelType ? 'smart-tr-active' : ''}">
                    <td><strong>${p.name}</strong>${p.id === state.data.panelType ? ' ✓' : ''}</td>
                    <td>${p.efficiency}</td>
                    <td>${p.lifespan}</td>
                    <td>${p.cost}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">🔋 Porovnání baterií</div>
          <div class="smart-table-wrap">
            <table class="smart-table">
              <thead><tr><th>Typ</th><th>Kapacita</th><th>Životnost</th><th>Cena</th></tr></thead>
              <tbody>
                ${r.batteryComparison.filter(b => true).map(b => `
                  <tr class="${b.id === state.data.batteryType ? 'smart-tr-active' : ''}">
                    <td><strong>${b.name}</strong>${b.id === state.data.batteryType ? ' ✓' : ''}</td>
                    <td>${b.capacity}</td>
                    <td>${b.lifespan}</td>
                    <td>${b.cost}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="smart-result-section">
          <div class="smart-section-title">📈 Finanční projekce (10 let)</div>
          <div class="smart-table-wrap">
            <table class="smart-table smart-table-small">
              <thead><tr><th>Rok</th><th>Úspora</th><th>Kumulativní návrat</th><th>CO₂ ušetřeno</th></tr></thead>
              <tbody>
                ${r.financialProjection.map(p => `
                  <tr>
                    <td>${p.year}</td>
                    <td>${p.savings.toLocaleString()} Kč</td>
                    <td style="color:${p.totalReturn >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${p.totalReturn >= 0 ? '+' : ''}${p.totalReturn.toLocaleString()} Kč</td>
                    <td>${p.co2.toLocaleString()} kg</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="smart-downloads">
          <button class="btn btn-primary btn-sm" id="downloadCsv">📥 Stáhnout CSV</button>
          <button class="btn btn-outline btn-sm" id="downloadJson">📥 Stáhnout JSON</button>
          <button class="btn btn-outline btn-sm" id="downloadPdf">📥 Stáhnout PDF</button>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" style="width:100%;" id="smartShowFullReport">📊 Zobrazit celou analýzu</button>
        </div>
      </div>
    `

    const body = document.getElementById('smartBody')
    const progress = document.getElementById('smartProgress')
    const foot = document.getElementById('smartFooter')
    if (body) body.style.display = 'none'
    if (progress) progress.style.display = 'none'
    if (foot) foot.style.display = 'none'
    container.style.display = 'block'
    const stEl = document.getElementById('calcResultsContainer');
    if (stEl) { const y = stEl.getBoundingClientRect().top + window.pageYOffset - 80; try { window.scrollTo({ top: y, behavior: 'smooth' }); } catch (e) { stEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }

    document.getElementById('editResultsBtn')?.addEventListener('click', function () {
      container.style.display = 'none'
      if (body) body.style.display = 'block'
      if (progress) progress.style.display = 'block'
      if (foot) foot.style.display = 'block'
      const nav = document.getElementById('smartNav')
      if (nav) nav.style.display = 'flex'
      goToStep(1)
    })

    document.getElementById('downloadCsv')?.addEventListener('click', () => downloadCSV(r))
    document.getElementById('downloadJson')?.addEventListener('click', () => downloadJSON(r))
    document.getElementById('downloadPdf')?.addEventListener('click', () => downloadPDF(r))

    document.getElementById('smartShowFullReport')?.addEventListener('click', function () {
      const pred = {
        systemSizeKwp: r.solar.totalFveSize,
        fve_kwp: r.solar.totalFveSize,
        batterySizeKwh: r.solar.recommendedBattery,
        baterie_kwh: r.solar.recommendedBattery,
        selfSufficiency: r.sustainability.selfSufficiency,
        sobestacnost: r.sustainability.selfSufficiency,
        riskScore: 100 - r.sustainability.gridImpact,
        riziko: 100 - r.sustainability.gridImpact,
        yearlySavingsKc: r.financial.yearlySavings,
        usporaKc: r.financial.yearlySavings,
        co2SavingsTons: r.sustainability.co2Reduction / 1000,
        co2Uspora: r.sustainability.co2Reduction / 1000,
        roiYears: r.financial.roi,
        roi: r.financial.roi,
        yearlyKwh: r.solar.yearlyProduction,
        confidence: r.sustainability.efficiencyScore,
        budgetKc: r.financial.totalInvestment,
        nazev: 'AI Energy Plan'
      }
      if (typeof window.renderSidebarSummary === 'function') {
        window.renderSidebarSummary(pred);
      }
      if (typeof showCalculatorResults === 'function') {
        showCalculatorResults(pred, pred.budgetKc, window.selectedLocation, 'vhodna_strecha');
      }
    })
  }

  function orientationLabel (o) {
    const map = { south: 'Jih', southeast: 'Jihovýchod', southwest: 'Jihozápad', east: 'Východ', west: 'Západ' }
    return map[o] || o
  }

  function downloadCSV (r) {
    const rows = [
      ['Kategorie', 'Hodnota'],
      ['Celková FVE (kWp)', r.solar.totalFveSize],
      ['Počet panelů', r.solar.recommendedPanels],
      ['Baterie (kWh)', r.solar.recommendedBattery],
      ['Roční výroba (kWh)', r.solar.yearlyProduction],
      ['', ''],
      ['Celková investice (Kč)', r.financial.totalInvestment],
      ['Roční úspora (Kč)', r.financial.yearlySavings],
      ['ROI (roky)', r.financial.roi],
      ['', ''],
      ['CO₂ úspora (kg/rok)', r.sustainability.co2Reduction],
      ['Soběstačnost (%)', r.sustainability.selfSufficiency],
      ['Efektivita (/100)', r.sustainability.efficiencyScore],
      ['Stabilita sítě (%)', r.sustainability.gridImpact]
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    downloadFile(csv, 'solar-plan.csv', 'text/csv;charset=utf-8')
  }

  function downloadJSON (r) {
    const json = JSON.stringify(r, null, 2)
    downloadFile(json, 'solar-plan.json', 'application/json;charset=utf-8')
  }

  function downloadPDF (r) {
    const win = window.open('', '_blank')
    if (!win) return alert('Prosím povolte vyskakovací okna pro stažení PDF.')
    win.document.write(`
      <html><head><title>SolarAI - Energetický plán</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
        h1 { color: #2b6cb0; border-bottom: 2px solid #2b6cb0; padding-bottom: 10px; }
        h2 { color: #2b6cb0; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #2b6cb0; color: white; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0; }
        .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
        .val { font-size: 1.3rem; font-weight: 700; color: #2b6cb0; }
        .ex { background: #ebf4ff; padding: 8px 12px; border-radius: 6px; margin: 4px 0; }
        .footer { margin-top: 30px; font-size: 0.8rem; color: #666; text-align: center; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>🌞 SolarAI - Energetický plán</h1>
      <p><strong>Projekt:</strong> ${r.raw.projectName || 'Neuveden'} | <strong>Zpracoval:</strong> ${r.raw.userName || 'Neuveden'}</p>

      <h2>🔆 Solární doporučení</h2>
      <div class="grid">
        <div class="card"><div>FVE systém</div><div class="val">${r.solar.totalFveSize} kWp</div></div>
        <div class="card"><div>Panely</div><div class="val">${r.solar.recommendedPanels} ks</div></div>
        <div class="card"><div>Baterie</div><div class="val">${r.solar.recommendedBattery} kWh</div></div>
        <div class="card"><div>Roční výroba</div><div class="val">${r.solar.yearlyProduction.toLocaleString()} kWh</div></div>
      </div>

      <h2>💰 Finanční predikce</h2>
      <div class="grid">
        <div class="card"><div>Investice</div><div class="val">${r.financial.totalInvestment.toLocaleString()} Kč</div></div>
        <div class="card"><div>Úspora/rok</div><div class="val">${r.financial.yearlySavings.toLocaleString()} Kč</div></div>
        <div class="card"><div>Návratnost</div><div class="val">${r.financial.roi} let</div></div>
      </div>

      <h2>🌍 Udržitelnost</h2>
      <div class="grid">
        <div class="card"><div>CO₂ úspora</div><div class="val">${r.sustainability.co2Reduction.toLocaleString()} kg/rok</div></div>
        <div class="card"><div>Soběstačnost</div><div class="val">${r.sustainability.selfSufficiency}%</div></div>
        <div class="card"><div>Efektivita</div><div class="val">${r.sustainability.efficiencyScore}/100</div></div>
      </div>

      <h2>🧠 AI vysvětlení</h2>
      ${r.aiExplanations.map(ex => `<div class="ex">💡 ${ex}</div>`).join('')}

      <h2>📈 Finanční projekce</h2>
      <table>
        <thead><tr><th>Rok</th><th>Úspora</th><th>Kumulativní návrat</th><th>CO₂ ušetřeno</th></tr></thead>
        <tbody>
          ${r.financialProjection.map(p => `<tr><td>${p.year}</td><td>${p.savings.toLocaleString()} Kč</td><td>${p.totalReturn.toLocaleString()} Kč</td><td>${p.co2.toLocaleString()} kg</td></tr>`).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Vygenerováno SolarAI | AI Olympiáda 2026 | ECUK Ústecký kraj</p>
        <p>Datum: ${new Date().toLocaleDateString('cs-CZ')}</p>
      </div>

      <script>
        window.onload = function () { window.print(); }
      <\u002fscript>
      </body></html>
    `)
    win.document.close()
  }

  function downloadFile (content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  }

  function saveState () {
    try {
      localStorage.setItem('smartCalculatorData', JSON.stringify(state.data))
      localStorage.setItem('smartCalculatorStep', state.currentStep)
    } catch (e) {}
  }

  function loadSavedState () {
    try {
      const saved = localStorage.getItem('smartCalculatorData')
      if (saved) {
        const parsed = JSON.parse(saved)
        Object.assign(state.data, parsed)
        state.currentStep = parseInt(localStorage.getItem('smartCalculatorStep')) || 1
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
