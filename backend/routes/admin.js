const express = require('express');
const { readDB, writeDB, getDefaultWebsiteContent } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

router.get('/users', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const safeUsers = db.users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        profile: u.profile,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        status: u.status || 'active'
    }));
    res.json({ users: safeUsers });
});

router.delete('/users/:id', verifyToken, isAdmin, (req, res) => {
    if (req.params.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    const db = readDB();
    db.users = db.users.filter(u => u.id !== req.params.id);
    if (db.analytics.general) {
        db.analytics.general.totalUsers = db.users.length;
    } else {
        db.analytics.totalUsers = db.users.length;
    }
    writeDB(db);
    res.json({ success: true });
});

router.put('/users/:id/role', verifyToken, isAdmin, (req, res) => {
    const { role, status } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (role) user.role = role;
    if (status) user.status = status;
    writeDB(db);
    res.json({ success: true });
});

router.get('/analytics', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const analytics = db.analytics || { totalAnalyses: 0, totalUsers: db.users.length, lastActivity: new Date().toISOString() };
    res.json({
        ...analytics,
        totalUsers: db.users.length,
        totalProjects: (db.projects || []).length,
        totalApplications: (db.clientApplications || []).length
    });
});

router.post('/analytics/track', verifyToken, (req, res) => {
    const { type, data } = req.body;
    const db = readDB();
    if (!db.analytics.general) {
        db.analytics = {
            general: { totalAnalyses: 0, totalUsers: db.users.length, lastActivity: new Date().toISOString() },
            clientActivity: {},
            aiStatistics: { predictionCount: 0, apiRequests: 0, datasetUsage: {}, errorTracking: [] }
        };
    }
    if (type === 'prediction') {
        db.analytics.general.totalAnalyses = (db.analytics.general.totalAnalyses || 0) + 1;
        db.analytics.aiStatistics.predictionCount = (db.analytics.aiStatistics.predictionCount || 0) + 1;
    }
    if (type === 'api_request') {
        db.analytics.aiStatistics.apiRequests = (db.analytics.aiStatistics.apiRequests || 0) + 1;
    }
    db.analytics.general.lastActivity = new Date().toISOString();
    writeDB(db);
    res.json({ success: true });
});

router.delete('/historical', verifyToken, isAdmin, (req, res) => {
    const db = readDB(); db.historicalData = []; writeDB(db);
    res.json({ success: true });
});

router.delete('/measures', verifyToken, isAdmin, (req, res) => {
    const db = readDB(); db.measures = []; writeDB(db);
    res.json({ success: true });
});

router.delete('/scenarios', verifyToken, isAdmin, (req, res) => {
    const db = readDB(); db.scenarios = []; writeDB(db);
    res.json({ success: true });
});

router.delete('/modeldata', verifyToken, isAdmin, (req, res) => {
    const db = readDB(); db.modelData = []; writeDB(db);
    res.json({ success: true });
});

router.delete('/all', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    db.historicalData = []; db.measures = []; db.scenarios = []; db.modelData = [];
    writeDB(db);
    res.json({ success: true });
});

router.get('/notifications', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    res.json((db.notifications || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

router.post('/notifications', verifyToken, isAdmin, (req, res) => {
    const { type, message } = req.body;
    const db = readDB();
    if (!db.notifications) db.notifications = [];
    db.notifications.push({
        id: generateId(),
        type: type || 'info',
        message,
        timestamp: new Date().toISOString(),
        read: false
    });
    writeDB(db);
    res.json({ success: true });
});

router.post('/notifications/:id/read', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const n = (db.notifications || []).find(n => n.id === req.params.id);
    if (n) n.read = true;
    writeDB(db);
    res.json({ success: true });
});

router.get('/dashboard', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const projects = db.projects || [];
    const applications = db.clientApplications || [];
    const users = db.users || [];
    const activity = db.userActivity || [];
    const notifications = db.notifications || [];
    const aiModels = db.aiModels || [];

    const recentActivity = activity
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

    const pendingApplications = applications.filter(a => a.status === 'pending').length;

    res.json({
        stats: {
            activeUsers: users.filter(u => u.status !== 'inactive').length,
            totalProjects: projects.length,
            totalCalculations: (db.analytics?.general?.totalAnalyses || db.analytics?.totalAnalyses || 0),
            totalUploadedFiles: (db.importedFiles || []).length,
            aiActivity: (db.analytics?.aiStatistics?.predictionCount || 0),
            apiActivity: (db.analytics?.aiStatistics?.apiRequests || 0),
            pendingApplications,
            totalUsers: users.length
        },
        recentActivity,
        unreadNotifications: notifications.filter(n => !n.read).length,
        aiModels: aiModels.length
    });
});

module.exports = router;
