const express = require('express');
const { readDB, writeDB } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

router.get('/applications', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const apps = (db.clientApplications || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const status = req.query.status;
    const filtered = status ? apps.filter(a => a.status === status) : apps;

    res.json({
        applications: filtered,
        counts: {
            pending: apps.filter(a => a.status === 'pending').length,
            reviewed: apps.filter(a => a.status === 'reviewed').length,
            contacted: apps.filter(a => a.status === 'contacted').length,
            completed: apps.filter(a => a.status === 'completed').length,
            total: apps.length
        }
    });
});

router.get('/applications/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const app = (db.clientApplications || []).find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const project = (db.projects || []).find(p => p.id === app.projectId);
    const user = (db.users || []).find(u => u.id === app.userId);

    res.json({ application: app, project, user });
});

router.put('/applications/:id', verifyToken, isAdmin, (req, res) => {
    const { status, adminNotes } = req.body;
    const db = readDB();
    const app = (db.clientApplications || []).find(a => a.id === req.params.id);
    if (!app) return res.status(404).json({ error: 'Application not found' });

    if (status) {
        app.status = status;
        if (status === 'reviewed') app.reviewedAt = new Date().toISOString();
        if (status === 'contacted') app.contactedAt = new Date().toISOString();
        if (status === 'completed') app.completedAt = new Date().toISOString();
    }
    if (adminNotes !== undefined) app.adminNotes = adminNotes;

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
        id: generateId(),
        type: `application_${status || 'updated'}`,
        message: `Application ${app.projectName} updated to ${status || 'updated'}`,
        timestamp: new Date().toISOString(),
        read: false,
        applicationId: app.id
    });

    writeDB(db);
    res.json({ success: true, application: app });
});

router.delete('/applications/:id', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const idx = (db.clientApplications || []).findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Application not found' });
    db.clientApplications.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

router.get('/user-applications', verifyToken, (req, res) => {
    const db = readDB();
    const apps = (db.clientApplications || [])
        .filter(a => a.userId === req.user.id)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    res.json(apps);
});

module.exports = router;
