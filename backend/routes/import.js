const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { readDB, writeDB } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

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
                if (!db.analytics) db.analytics = { general: {} };
                if (!db.analytics.general) db.analytics.general = {};
                db.analytics.general.totalUploadedFiles = (db.analytics.general.totalUploadedFiles || 0) + 1;

                if (!db.importedFiles) db.importedFiles = [];
                db.importedFiles.push({
                    id: generateId(),
                    type: 'csv',
                    dataType: type,
                    filename: config.file,
                    originalName: config.file,
                    recordCount: results.length,
                    uploadedAt: new Date().toISOString(),
                    uploadedBy: 'admin',
                    status: 'imported',
                    validation: { valid: true, errors: [] }
                });

                writeDB(db);
                resolve({ count: results.length, file: config.file });
            })
            .on('error', reject);
    });
}

router.get('/imports', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    res.json(db.importedFiles || []);
});

router.post('/import-historical', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('historical');
        res.json({ success: true, count: result.count, file: result.file });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-measures', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('measures');
        res.json({ success: true, count: result.count, file: result.file });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-scenarios', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('scenarios');
        res.json({ success: true, count: result.count, file: result.file });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import-modeldata', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await importCSV('modeldata');
        res.json({ success: true, count: result.count, file: result.file });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import/json', verifyToken, isAdmin, (req, res) => {
    try {
        const { data, dataType, filename } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid JSON data. Expected array.' });
        }
        const db = readDB();

        if (!db.importedFiles) db.importedFiles = [];
        const importRecord = {
            id: generateId(),
            type: 'json',
            dataType: dataType || 'custom',
            filename: filename || `import_${Date.now()}.json`,
            originalName: filename || `import_${Date.now()}.json`,
            recordCount: data.length,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'admin',
            status: 'imported',
            validation: { valid: true, errors: [] }
        };
        db.importedFiles.push(importRecord);

        if (dataType && db[dataType]) {
            db[dataType] = db[dataType].concat(data);
        } else {
            if (!db.customImports) db.customImports = [];
            db.customImports.push({ id: generateId(), dataType: dataType || 'custom', data, importedAt: new Date().toISOString() });
        }

        writeDB(db);
        res.json({ success: true, count: data.length, importRecord });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/import/validate-csv', verifyToken, isAdmin, (req, res) => {
    const { data } = req.body;
    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const errors = [];
    const warnings = [];
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    if (headers.length === 0) {
        errors.push('No columns found in data');
    }

    data.forEach((row, i) => {
        for (const [key, val] of Object.entries(row)) {
            if (val === undefined || val === null || val === '') {
                warnings.push(`Row ${i + 1}: Column "${key}" is empty`);
            }
        }
    });

    const stats = {
        totalRows: data.length,
        totalColumns: headers.length,
        columns: headers,
        emptyCells: warnings.length,
        validRows: data.length - errors.length
    };

    res.json({
        valid: errors.length === 0,
        errors: errors.slice(0, 50),
        warnings: warnings.slice(0, 50),
        stats
    });
});

router.delete('/import/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const idx = (db.importedFiles || []).findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Import record not found' });
    db.importedFiles.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

module.exports = router;
