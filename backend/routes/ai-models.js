const express = require('express');
const { readDB, writeDB } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

router.get('/ai-models', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    res.json(db.aiModels || []);
});

router.get('/ai-models/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const model = (db.aiModels || []).find(m => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    res.json(model);
});

router.post('/ai-models', verifyToken, isAdmin, (req, res) => {
    const { name, version, type, description } = req.body;
    const db = readDB();
    if (!db.aiModels) db.aiModels = [];

    const model = {
        id: generateId(),
        name: name || 'New Model',
        version: version || '1.0.0',
        type: type || 'custom',
        accuracy: 0,
        status: 'inactive',
        lastTrained: null,
        trainingData: '',
        description: description || '',
        createdAt: new Date().toISOString()
    };

    db.aiModels.push(model);
    writeDB(db);
    res.json({ success: true, model });
});

router.put('/ai-models/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const model = (db.aiModels || []).find(m => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    const { name, version, type, accuracy, status, trainingData, description } = req.body;
    if (name !== undefined) model.name = name;
    if (version !== undefined) model.version = version;
    if (type !== undefined) model.type = type;
    if (accuracy !== undefined) model.accuracy = accuracy;
    if (status !== undefined) model.status = status;
    if (trainingData !== undefined) model.trainingData = trainingData;
    if (description !== undefined) model.description = description;

    model.updatedAt = new Date().toISOString();

    writeDB(db);
    res.json({ success: true, model });
});

router.delete('/ai-models/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const idx = (db.aiModels || []).findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Model not found' });
    db.aiModels.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

router.post('/ai-models/:id/train', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const model = (db.aiModels || []).find(m => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    model.status = 'training';
    model.lastTrained = new Date().toISOString();
    model.accuracy = Math.round((70 + Math.random() * 25) * 10) / 10;

    writeDB(db);

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
        id: generateId(),
        type: 'model_trained',
        message: `Model ${model.name} training complete. Accuracy: ${model.accuracy}%`,
        timestamp: new Date().toISOString(),
        read: false
    });

    res.json({ success: true, model });
});

router.post('/ai-models/:id/deploy', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const model = (db.aiModels || []).find(m => m.id === req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    db.aiModels.forEach(m => { if (m.status === 'active') m.status = 'inactive'; });
    model.status = 'active';

    writeDB(db);

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
        id: generateId(),
        type: 'model_deployed',
        message: `Model ${model.name} v${model.version} deployed successfully`,
        timestamp: new Date().toISOString(),
        read: false
    });

    res.json({ success: true, model });
});

router.get('/ai-models/stats/summary', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const models = db.aiModels || [];
    res.json({
        total: models.length,
        active: models.filter(m => m.status === 'active').length,
        inactive: models.filter(m => m.status === 'inactive').length,
        training: models.filter(m => m.status === 'training').length,
        avgAccuracy: models.length > 0 ? Math.round(models.reduce((s, m) => s + (m.accuracy || 0), 0) / models.length * 10) / 10 : 0,
        byType: models.reduce((acc, m) => {
            acc[m.type] = (acc[m.type] || 0) + 1;
            return acc;
        }, {})
    });
});

module.exports = router;
