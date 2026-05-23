const express = require('express');
const { readDB, writeDB } = require('../database');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

router.get('/activity', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const activity = db.userActivity || [];
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;

    let filtered = activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (type) filtered = filtered.filter(a => a.type === type);

    res.json(filtered.slice(0, limit));
});

router.post('/activity', verifyToken, (req, res) => {
    const { type, details, projectId } = req.body;
    const db = readDB();
    if (!db.userActivity) db.userActivity = [];

    const entry = {
        id: generateId(),
        userId: req.user.id,
        username: req.user.username,
        type: type || 'action',
        details: details || '',
        projectId: projectId || null,
        timestamp: new Date().toISOString(),
        metadata: req.body.metadata || {}
    };

    db.userActivity.push(entry);

    writeDB(db);
    res.json({ success: true, entry });
});

router.get('/activity/user/:userId', verifyToken, (req, res) => {
    const db = readDB();
    const isOwner = req.user.id === req.params.userId;
    const isUserAdmin = req.user.role === 'admin';
    if (!isOwner && !isUserAdmin) return res.status(403).json({ error: 'Access denied' });

    const activity = (db.userActivity || [])
        .filter(a => a.userId === req.params.userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activity);
});

router.get('/activity/stats', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const activity = db.userActivity || [];

    const typeCounts = {};
    activity.forEach(a => {
        typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    const dailyActivity = {};
    activity.forEach(a => {
        const day = a.timestamp.slice(0, 10);
        dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    });

    const topUsers = {};
    activity.forEach(a => {
        topUsers[a.username] = (topUsers[a.username] || 0) + 1;
    });

    res.json({
        totalActions: activity.length,
        byType: typeCounts,
        daily: dailyActivity,
        topUsers: Object.entries(topUsers)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([username, count]) => ({ username, count }))
    });
});

router.get('/user-stats/:userId', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activity = (db.userActivity || []).filter(a => a.userId === req.params.userId);
    const projects = (db.projects || []).filter(p => p.userId === req.params.userId);
    const applications = (db.clientApplications || []).filter(a => a.userId === req.params.userId);

    res.json({
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile: user.profile,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        },
        stats: {
            totalActions: activity.length,
            totalProjects: projects.length,
            totalApplications: applications.length,
            lastActivity: activity.length > 0 ? activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0].timestamp : null
        },
        recentActivity: activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20),
        projects: projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
    });
});

module.exports = router;
