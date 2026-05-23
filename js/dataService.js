class DataService {
    constructor() {
        this.historicalData = [];
        this.measures = [];
        this.scenarios = [];
        this.modelData = [];
        this.loaded = false;
    }

    async loadAllData() {
        try {
            const [hist, meas, scen, model] = await Promise.all([
                Utils.apiFetch('/historical-data').catch(() => []),
                Utils.apiFetch('/measures').catch(() => []),
                Utils.apiFetch('/scenarios').catch(() => []),
                Utils.apiFetch('/model-data').catch(() => [])
            ]);

            this.historicalData = hist;
            this.measures = meas;
            this.scenarios = scen;
            this.modelData = model;
            this.loaded = true;

            console.log(`Loaded: ${hist.length} historical, ${meas.length} measures, ${scen.length} scenarios`);
            return true;
        } catch (e) {
            console.error('Failed to load data:', e);
            return false;
        }
    }

    getHistoricalTrend(location, year) {
        return this.historicalData.filter(row =>
            this._normalizeLocation(row.obec) === this._normalizeLocation(location) && parseInt(row.rok) <= year
        ).sort((a, b) => parseInt(a.rok) - parseInt(b.rok));
    }

    getScenarioData(location, scenarioId, year) {
        return this.scenarios.find(row =>
            this._normalizeLocation(row.obec) === this._normalizeLocation(location) &&
            row.scenar_id === scenarioId &&
            parseInt(row.rok) === year
        );
    }

    getScenariosForLocation(location) {
        return this.scenarios.filter(row =>
            this._normalizeLocation(row.obec) === this._normalizeLocation(location)
        );
    }

    getLocations() {
        const locs = new Set();
        this.historicalData.forEach(row => locs.add(row.obec));
        return Array.from(locs);
    }

    calculateFromHistorical(budget, location) {
        const trend = this.getHistoricalTrend(location, 2025);
        if (trend.length === 0) return null;

        const latest = trend[trend.length - 1];
        const installedKwp = parseFloat(latest.instalovany_vykon_kWp) || 100;
        const costPerKwp = installedKwp > 0 ? budget / installedKwp : 25000;

        const estimatedKwp = Math.round(installedKwp * (budget / 1000000) * 0.8);
        const savingsPerKwp = installedKwp > 0 ? (parseFloat(latest.uspora_kc_domacnost_rok) || 0) / installedKwp : 0;
        const co2PerKwp = installedKwp > 0 ? (parseFloat(latest.co2_uspory_t_rok) || 0) / installedKwp : 0;

        return { estimatedKwp, savingsPerKwp, co2PerKwp, latest };
    }

    applyMeasure(currentSystem, measureId) {
        const measure = this.measures.find(m => m.id === measureId);
        if (!measure) return currentSystem;
        return {
            kWp: currentSystem.kWp + (parseFloat(measure.delta_vykon_kWp) || 0),
            batteryKwh: currentSystem.batteryKwh + (parseFloat(measure.delta_baterie_kWh) || 0),
            cost: currentSystem.cost + (parseFloat(measure.cena_mil_kc) * 1000000 || 0),
            selfSufficiency: currentSystem.selfSufficiency + (parseFloat(measure.dopad_sobestacnost_pp_rocne) || 0),
            risk: currentSystem.risk + (parseFloat(measure.dopad_riziko_pp_rocne) || 0)
        };
    }

    compareScenarios(location, budget) {
        const results = {};
        const scenarioIds = ['S00', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
        const labels = {
            S00: 'Baseline (no action)',
            S01: 'Small FVE',
            S02: 'FVE + battery',
            S03: 'Savings only',
            S04: 'Community solar',
            S05: 'Large FVE + battery',
            S06: 'Hydrogen vision 2035'
        };

        for (const sid of scenarioIds) {
            const data = this.getScenarioData(location, sid, 2030);
            if (data) {
                results[sid] = {
                    label: labels[sid] || sid,
                    selfSufficiency: parseFloat(data.sobestacnost_procent) || 0,
                    risk: parseFloat(data.riziko_nestability_0_100) || 0,
                    savings: parseFloat(data.uspora_kc_domacnost_rok) || 0,
                    co2: parseFloat(data.co2_uspory_t_rok) || 0,
                    installedKwp: parseFloat(data.instalovany_vykon_kWp) || 0,
                    batteryKwh: parseFloat(data.baterie_kapacita_kWh) || 0
                };
            } else {
                const fallback = this._fallbackScenario(sid, budget);
                if (fallback) results[sid] = fallback;
            }
        }
        return results;
    }

    _fallbackScenario(sid, budget) {
        const multipliers = { S00: 0, S01: 0.3, S02: 0.5, S03: 0.1, S04: 0.6, S05: 0.8, S06: 1.0 };
        const m = multipliers[sid] || 0;
        const kwp = Math.round(budget / 25000 * m);
        return {
            label: sid,
            selfSufficiency: Math.round(kwp * 0.5),
            risk: Math.round(70 - kwp * 0.3),
            savings: Math.round(kwp * 950 * 6.5 * m),
            co2: Math.round(kwp * 950 * 0.4 / 1000 * 10) / 10,
            installedKwp: kwp,
            batteryKwh: Math.round(kwp * 0.5 * m)
        };
    }

    getLocationFactor(location) {
        const factors = {
            'Most': 0.98, 'Chomutov': 0.97, 'Usti_nad_Labem': 0.96,
            'Teplice': 0.965, 'Litomerice': 0.975, 'Louny': 0.985,
            'Zatec': 0.99, 'Decin': 0.97, 'Bilina': 0.975,
            'Jirkov': 0.97, 'Kadan': 0.985
        };
        const norm = this._normalizeLocation(location);
        for (const [key, val] of Object.entries(factors)) {
            if (this._normalizeLocation(key) === norm) return val;
        }
        return 1.0;
    }

    _normalizeLocation(loc) {
        if (!loc) return '';
        return loc.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
}

window.dataService = new DataService();
setTimeout(() => window.dataService.loadAllData(), 500);
