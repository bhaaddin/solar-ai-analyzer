const express = require('express');
const { readDB, writeDB } = require('../database');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

router.post('/projects', verifyToken, (req, res) => {
    const { name, type, params, results, location, budget } = req.body;
    const db = readDB();
    if (!db.projects) db.projects = [];

    const project = {
        id: generateId(),
        userId: req.user.id,
        username: req.user.username,
        name: name || `Project ${db.projects.length + 1}`,
        type: type || 'calculation',
        params: params || {},
        results: results || {},
        location: location || '',
        budget: budget || 0,
        status: 'saved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    db.projects.push(project);

    if (!db.userActivity) db.userActivity = [];
    db.userActivity.push({
        id: generateId(),
        userId: req.user.id,
        username: req.user.username,
        type: 'project_created',
        details: `Created project: ${project.name}`,
        projectId: project.id,
        timestamp: new Date().toISOString()
    });

    writeDB(db);
    res.json({ success: true, project });
});

router.get('/projects', verifyToken, (req, res) => {
    const db = readDB();
    const projects = db.projects || [];
    const isAdmin = req.user.role === 'admin';
    const userProjects = isAdmin ? projects : projects.filter(p => p.userId === req.user.id);
    res.json(userProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.get('/projects/:id', verifyToken, (req, res) => {
    const db = readDB();
    const project = (db.projects || []).find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    res.json(project);
});

router.put('/projects/:id', verifyToken, (req, res) => {
    const db = readDB();
    const project = (db.projects || []).find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    Object.assign(project, req.body, { id: project.id, userId: project.userId, updatedAt: new Date().toISOString() });
    writeDB(db);
    res.json({ success: true, project });
});

router.delete('/projects/:id', verifyToken, (req, res) => {
    const db = readDB();
    const idx = (db.projects || []).findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    if (db.projects[idx].userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    db.projects.splice(idx, 1);
    writeDB(db);
    res.json({ success: true });
});

router.post('/projects/:id/submit', verifyToken, (req, res) => {
    const db = readDB();
    const project = (db.projects || []).find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    project.status = 'submitted';
    project.submittedAt = new Date().toISOString();

    if (!db.clientApplications) db.clientApplications = [];
    const application = {
        id: generateId(),
        projectId: project.id,
        userId: req.user.id,
        username: req.user.username,
        userEmail: req.user.email,
        projectName: project.name,
        location: project.location,
        budget: project.budget,
        results: project.results,
        status: 'pending',
        adminNotes: '',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        contactedAt: null
    };
    db.clientApplications.push(application);

    if (!db.notifications) db.notifications = [];
    db.notifications.push({
        id: generateId(),
        type: 'new_application',
        message: `New application from ${req.user.username}: ${project.name}`,
        timestamp: new Date().toISOString(),
        read: false,
        applicationId: application.id
    });

    writeDB(db);
    res.json({ success: true, application });
});

module.exports = router;
