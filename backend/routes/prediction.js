const express = require('express');
const { readDB } = require('../database');
const { getLocationFactor, parseNumber } = require('../utils/helpers');

const router = express.Router();

function calculatePrediction(params) {
    const budgetKc = parseNumber(params.budget, 3000000);
    const location = params.location || '';
    const roofType = params.roofType || 'vhodna_strecha';
    const measures = Array.isArray(params.measures) ? params.measures : [];
    const enableHydrogen = params.enableHydrogen === true;

    const costPerKwp = 25000;
    const hoursPerKwp = 950;
    const electricityPrice = 6.50;
    const co2Factor = 0.4;

    const locationFactor = getLocationFactor(location);

    let kWp = budgetKc / costPerKwp;

    let roofEfficiency = 1.0;
    if (roofType === 'prumyslova_hala') roofEfficiency = 1.3;
    else if (roofType === 'fve_instalovana') roofEfficiency = 0.6;
    else if (roofType === 'nevhodna_strecha') roofEfficiency = 0.0;

    kWp = kWp * roofEfficiency;
    let batteryKwh = kWp * 0.5;

    let yearlyKwh = kWp * hoursPerKwp * locationFactor;
    const yearlySavings = yearlyKwh * electricityPrice;
    const co2Tons = yearlyKwh * co2Factor / 1000;

    const avgConsumption = 12000;
    let selfSufficiency = Math.min(95, (yearlyKwh / avgConsumption) * 100);
    const batteryBoost = Math.min(20, batteryKwh * 0.3);
    selfSufficiency = Math.min(95, selfSufficiency + batteryBoost);

    let riskScore = Math.max(5, Math.min(80, 60 - kWp * 0.5 + batteryKwh * 0.1));

    if (enableHydrogen) {
        riskScore = riskScore * 0.75;
    }

    const db = readDB();
    let confidenceBase = 70;
    let dataUsed = [];

    if (db.historicalData && db.historicalData.length > 0) {
        confidenceBase += 10;
        dataUsed.push('historical');
    }
    if (db.scenarios && db.scenarios.length > 0) {
        confidenceBase += 10;
        dataUsed.push('scenarios');
    }
    if (db.measures && db.measures.length > 0) {
        dataUsed.push('measures');
    }
    if (location) {
        confidenceBase += 5;
    }
    if (measures.length > 0) {
        const dbMeasures = db.measures || [];
        measures.forEach(mId => {
            const measure = dbMeasures.find(m => m.id === mId || m.nazev === mId);
            if (measure) {
                const deltaKwp = parseNumber(measure.delta_vykon_kWp, 0);
                const deltaBattery = parseNumber(measure.delta_baterie_kWh, 0);
                kWp += deltaKwp;
                batteryKwh += deltaBattery;
                confidenceBase += 5;
            }
        });

        yearlyKwh = kWp * hoursPerKwp * locationFactor;
        selfSufficiency = Math.min(95, (yearlyKwh / avgConsumption) * 100 + Math.min(20, batteryKwh * 0.3));
        riskScore = Math.max(5, Math.min(80, 60 - kWp * 0.5 + batteryKwh * 0.1));
    }

    const confidence = Math.min(95, confidenceBase);

    const yearlyKwhAdjusted = kWp * hoursPerKwp * locationFactor;
    const yearlySavingsAdjusted = yearlyKwhAdjusted * electricityPrice;
    const co2TonsAdjusted = yearlyKwhAdjusted * co2Factor / 1000;
    const roi = yearlySavingsAdjusted > 0 ? (budgetKc / yearlySavingsAdjusted) : 0;

    return {
        systemSizeKwp: Math.round(kWp * 10) / 10,
        batterySizeKwh: Math.round(batteryKwh),
        selfSufficiency: Math.round(selfSufficiency),
        co2SavingsTons: Math.round(co2TonsAdjusted * 10) / 10,
        riskScore: Math.round(riskScore),
        roiYears: Math.round(roi * 10) / 10,
        yearlyKwh: Math.round(yearlyKwhAdjusted),
        yearlySavingsKc: Math.round(yearlySavingsAdjusted),
        locationFactor,
        confidence,
        dataUsed,
        roofType,
        enableHydrogen,
        budgetKc
    };
}

// Main prediction endpoint - POST /api/predict
router.post('/', (req, res) => {
    try {
        const result = calculatePrediction(req.body);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Budget-only prediction - POST /api/predict/budget
router.post('/budget', (req, res) => {
    try {
        const result = calculatePrediction(req.body);
        res.json({ success: true, prediction: result });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get all locations with factors - GET /api/predict/locations
router.get('/locations', (req, res) => {
    const { LOCATION_FACTORS } = require('../utils/helpers');
    const locations = Object.entries(LOCATION_FACTORS || {}).map(([name, factor]) => ({
        name,
        factor,
        type: factor >= 0.98 ? 'rural' : factor >= 0.97 ? 'urban' : 'industrial'
    }));
    res.json(locations);
});

module.exports = router;