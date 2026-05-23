const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { readDB, writeDB } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/historical-data', (req, res) => {
    const db = readDB();
    res.json(db.historicalData || []);
});

router.get('/measures', (req, res) => {
    const db = readDB();
    res.json(db.measures || []);
});

router.get('/scenarios', (req, res) => {
    const db = readDB();
    res.json(db.scenarios || []);
});

router.get('/model-data', (req, res) => {
    const db = readDB();
    res.json(db.modelData || []);
});

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CSV_FILES = {
    'historical': { file: '01_historicka_data_obce_2015_2025.csv', field: 'historicalData' },
    'measures': { file: '02_katalog_opatreni_energie.csv', field: 'measures' },
    'scenarios': { file: '03_scenare_projekce_2026_2035.csv', field: 'scenarios' },
    'modeldata': { file: '04_simpleml_komplet_energie.csv', field: 'modelData' }
};

function importCSV(type) {
    return new Promise((resolve, reject) => {
        const config = CSV_FILES[type];
        if (!config) return reject(new Error('Unknown data type'));

        const filePath = path.join(DATA_DIR, config.file);
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`CSV file not found: ${config.file}`));
        }

        const results = [];
        fs.createReadStream(filePath, { encoding: 'utf-8' })
            .pipe(csv())
            .on('data', (data) => {
                const cleaned = {};
                for (const [k, v] of Object.entries(data)) {
                    cleaned[k.trim()] = v.trim();
                }
                results.push(cleaned);
            })
            .on('end', () => {
                const db = readDB();
                db[config.field] = results;
                writeDB(db);
                resolve({ count: results.length });
            })
            .on('error', reject);
    });
}

router.post('/import-historical', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('historical');
        res.json({ success: true, count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-measures', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('measures');
        res.json({ success: true, count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-scenarios', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('scenarios');
        res.json({ success: true, count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-modeldata', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('modeldata');
        res.json({ success: true, count: result.count });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
