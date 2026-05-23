class AppState {
  constructor() {
    this.listeners = {};
    this.state = {
      selectedCity: null,
      calculationResult: null,
      analysisData: null,
      historicalData: [],
      measures: [],
      scenarios: [],
      modelData: [],
      loading: false,
      error: null
    };
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    this.state[key] = value;
    this._notify(key, value);
  }

  on(key, fn) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(fn);
    if (this.state[key] !== null && this.state[key] !== undefined) {
      fn(this.state[key]);
    }
  }

  _notify(key, value) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(fn => fn(value));
    }
    if (key !== 'all') {
      this._notify('all', this.state);
    }
  }

  async loadData() {
    this.set('loading', true);
    try {
      const [hist, meas, scen, model] = await Promise.all([
        Utils.apiFetch('/historical-data').catch(() => []),
        Utils.apiFetch('/measures').catch(() => []),
        Utils.apiFetch('/scenarios').catch(() => []),
        Utils.apiFetch('/model-data').catch(() => [])
      ]);
      this.set('historicalData', hist);
      this.set('measures', meas);
      this.set('scenarios', scen);
      this.set('modelData', model);
      this.set('loading', false);
      console.log(`State loaded: ${hist.length} historical, ${meas.length} measures, ${scen.length} scenarios, ${model.length} model`);
    } catch (e) {
      this.set('error', e.message);
      this.set('loading', false);
    }
  }

  async selectCity(name) {
    const hist = this.get('historicalData');
    const scen = this.get('scenarios');
    const model = this.get('modelData');

    const cityData = {
      name,
      historical: this._filterByLocation(hist, name),
      scenarios: this._filterByLocation(scen, name),
      model: this._filterByLocation(model, name),
      location: CONFIG.LOCATIONS.find(l => l.name === name) || null
    };

    this.set('selectedCity', cityData);
    this.set('analysisData', null);
    return cityData;
  }

  async runCalculation(budget, location, roofType) {
    this.set('loading', true);
    try {
      const city = this.get('selectedCity');
      const loc = city ? city.location : CONFIG.LOCATIONS.find(l => l.name === location);
      const factor = loc ? loc.factor : 0.97;

      let apiResult = null;
      try {
        const res = await fetch(CONFIG.API_URL + '/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ budget: parseInt(budget), location, roofType: roofType || 'vhodna_strecha', enableHydrogen: !!window.useHydrogen })
        });
        if (res.ok) apiResult = await res.json();
      } catch (e) {}

      let result;
      if (apiResult && apiResult.prediction) {
        const p = apiResult.prediction;
        result = {
          fve_kwp: p.systemSizeKwp || Math.round(budget / 25000),
          baterie_kwh: p.batterySizeKwh || Math.round(budget / 25000 * 0.5),
          sobestacnost: p.selfSufficiency || 60,
          usporaKc: p.yearlySavingsKc || Math.round(budget / 25000 * 950 * factor * 6.5),
          co2Uspora: p.co2SavingsTons || 12.5,
          riziko: p.riskScore || 35,
          confidence: p.confidence || 70,
          roi: p.roiYears || 8.5,
          panelCount: Math.round((p.systemSizeKwp || Math.round(budget / 25000)) / 0.42)
        };
      } else {
        const kwp = Math.round(budget / 25000);
        const batteryKwh = Math.round(kwp * 0.5);
        const yearlyKwh = kwp * 950 * factor;
        const savings = Math.round(yearlyKwh * 6.5);
        result = {
          fve_kwp: kwp, baterie_kwh: batteryKwh,
          sobestacnost: Math.min(95, Math.round((yearlyKwh / 12000) * 100 + Math.min(20, batteryKwh * 0.3))),
          usporaKc: savings, co2Uspora: Math.round(yearlyKwh * 0.4 / 1000 * 10) / 10,
          riziko: Math.max(5, Math.round(60 - kwp * 0.5 + batteryKwh * 0.1)),
          confidence: 70, roi: Math.round((savings / budget) * 100 * 10) / 10,
          panelCount: Math.round(kwp / 0.42)
        };
      }

      this.set('calculationResult', result);
      this.set('loading', false);

      const analysis = this._buildAnalysisData(city || { name: location, historical: [], scenarios: [], model: [], location: null }, result);
      this.set('analysisData', analysis);
      return result;
    } catch (e) {
      this.set('error', e.message);
      this.set('loading', false);
    }
  }

  _filterByLocation(arr, name) {
    if (!arr || !name) return [];
    const norm = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return arr.filter(row => {
      const rowLoc = (row.obec || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      return rowLoc === norm;
    });
  }

  _buildAnalysisData(city, calcResult) {
    const name = city.name || 'Unknown';
    const loc = city.location || CONFIG.LOCATIONS.find(l => l.name === name);
    const factor = loc ? loc.factor : 0.97;
    const irradiance = (window.configLocationIrradiance && window.configLocationIrradiance[name]) || Math.round(factor * 1000);

    const his = city.historical || [];
    const scens = city.scenarios || [];
    const hist2025 = his.length > 0 ? his[his.length - 1] : null;
    const installedKwp = hist2025 ? parseFloat(hist2025.instalovany_vykon_kWp) || calcResult.fve_kwp : calcResult.fve_kwp;
    const batteryCap = hist2025 ? parseFloat(hist2025.baterie_kapacita_kWh) || calcResult.baterie_kwh : calcResult.baterie_kwh;
    const co2Saved = hist2025 ? parseFloat(hist2025.co2_uspory_t_rok) || calcResult.co2Uspora : calcResult.co2Uspora;
    const selfSuff = hist2025 ? parseFloat(hist2025.sobestacnost_procent) || calcResult.sobestacnost : calcResult.sobestacnost;

    const scenarioData = {};
    const scenarioIds = ['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
    const scenLabels = { S00: 'Baseline', S01: 'Small FVE', S02: 'FVE+Battery', S03: 'Savings', S04: 'Community', S05: 'Large FVE', S06: 'Hydrogen' };
    scenarioIds.forEach(sid => {
      const sData = scens.filter(s => s.scenar_id === sid);
      if (sData.length > 0) {
        scenarioData[sid] = { label: scenLabels[sid] || sid, data: sData };
      }
    });

    return {
      city: name, factor, irradiance,
      stats: {
        installedKwp: Math.round(installedKwp * 10) / 10,
        batteryCapacity: Math.round(batteryCap * 10) / 10,
        selfSufficiency: Math.round(selfSuff * 10) / 10,
        co2Savings: Math.round(co2Saved * 10) / 10,
        risk: Math.round(calcResult.riziko),
        savings: Math.round(calcResult.usporaKc),
        fveSize: Math.round(calcResult.fve_kwp),
        batterySize: Math.round(calcResult.baterie_kwh)
      },
      historical: his,
      scenarios: scenarioData,
      scenarioList: scens,
      prediction: calcResult,
      dataLoaded: his.length > 0 || scens.length > 0
    };
  }

  async mergeAndRender(name) {
    await this._ensureData();
    await this.selectCity(name);
    const city = this.get('selectedCity');
    const budget = window.currentBudget || 3000000;
    const result = await this.runCalculation(budget, name, 'vhodna_strecha');
    return this.get('analysisData');
  }

  async _ensureData() {
    if (this.state.historicalData.length > 0 && this.state.scenarios.length > 0) return;
    if (this.state.loading) {
      await new Promise(resolve => {
        const check = () => {
          if (!this.state.loading) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
      return;
    }
    await this.loadData();
  }
}

window.appState = new AppState();
setTimeout(() => window.appState.loadData(), 300);
