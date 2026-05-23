const express = require('express');
const { readDB, writeDB, getDefaultWebsiteContent } = require('../database');
const { escapeHtml, sanitizeObject } = require('../utils/helpers');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { contentValidation } = require('../middleware/validate');

const router = express.Router();

router.get('/', (req, res) => {
    const db = readDB();
    const content = db.websiteContent;
    const oldFormat = content.siteTitle !== undefined;
    if (oldFormat) {
        res.json({
            siteTitle: content.siteTitle || '🌞 AI Solar Energy Intelligence Platform',
            heroText: content.heroText || 'Government AI Platform for Solar Energy Transformation',
            description: content.description || 'AI analyzes satellite images and predicts solar potential.',
            contactEmail: content.contactEmail || 'info@ecuk.cz',
            fundingInfo: content.fundingInfo || '',
            footerText: content.footerText || '© 2026 AI Solar Energy Intelligence Platform | Powered by ECUK',
            lastUpdated: content.lastUpdated || new Date().toISOString(),
            updatedBy: content.updatedBy || 'admin'
        });
    } else {
        const home = content.homePage || {};
        res.json({
            siteTitle: home.heroTitle || '🌞 AI Solar Energy Intelligence Platform',
            heroText: home.heroTitle || 'AI Solar Intelligence System',
            description: home.heroDescription || 'AI analyzes satellite images.',
            contactEmail: 'info@ecuk.cz',
            fundingInfo: 'Contact ECUK for grant opportunities up to 50% of installation cost.',
            footerText: home.footer || '© 2026 AI Solar Energy Intelligence Platform | Powered by ECUK',
            lastUpdated: content.lastUpdated || new Date().toISOString(),
            updatedBy: content.updatedBy || 'admin',
            fullContent: content
        });
    }
});

router.get('/full', (req, res) => {
    const db = readDB();
    res.json(db.websiteContent || getDefaultWebsiteContent());
});

router.put('/', verifyToken, isAdmin, (req, res) => {
    const { siteTitle, heroText, description, contactEmail, fundingInfo, footerText } = req.body;
    const db = readDB();
    const content = db.websiteContent;

    const isOldFormat = content.siteTitle !== undefined;
    if (isOldFormat) {
        content.siteTitle = siteTitle ? escapeHtml(siteTitle) : content.siteTitle;
        content.heroText = heroText ? escapeHtml(heroText) : content.heroText;
        content.description = description ? escapeHtml(description) : content.description;
        content.contactEmail = contactEmail ? escapeHtml(contactEmail) : content.contactEmail;
        content.fundingInfo = fundingInfo ? escapeHtml(fundingInfo) : content.fundingInfo;
        content.footerText = footerText ? escapeHtml(footerText) : content.footerText;
    } else {
        if (!content.homePage) content.homePage = {};
        if (siteTitle) content.homePage.heroTitle = escapeHtml(siteTitle);
        if (heroText) content.homePage.heroDescription = escapeHtml(heroText);
        if (footerText) content.homePage.footer = escapeHtml(footerText);
    }

    content.lastUpdated = new Date().toISOString();
    content.updatedBy = req.user.username;
    writeDB(db);

    res.json({ success: true, content: db.websiteContent });
});

router.put('/full', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    const updates = req.body;

    if (!db.websiteContent || db.websiteContent.siteTitle !== undefined) {
        db.websiteContent = getDefaultWebsiteContent();
    }

    function deepMerge(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    deepMerge(db.websiteContent, updates);
    db.websiteContent.lastUpdated = new Date().toISOString();
    db.websiteContent.updatedBy = req.user.username;
    writeDB(db);

    res.json({ success: true, content: db.websiteContent });
});

router.put('/section/:section', verifyToken, isAdmin, (req, res) => {
    const { section } = req.params;
    const db = readDB();
    const validSections = ['homePage', 'calculatorPage', 'infoPage', 'mapPage', 'aiSection', 'usersPage'];

    if (!validSections.includes(section)) {
        return res.status(400).json({ error: `Invalid section. Valid: ${validSections.join(', ')}` });
    }

    if (!db.websiteContent || db.websiteContent.siteTitle !== undefined) {
        db.websiteContent = getDefaultWebsiteContent();
    }

    db.websiteContent[section] = { ...(db.websiteContent[section] || {}), ...req.body };
    db.websiteContent.lastUpdated = new Date().toISOString();
    db.websiteContent.updatedBy = req.user.username;
    writeDB(db);

    res.json({ success: true, section: db.websiteContent[section] });
});

router.post('/reset', verifyToken, isAdmin, (req, res) => {
    const db = readDB();
    db.websiteContent = getDefaultWebsiteContent();
    db.websiteContent.lastUpdated = new Date().toISOString();
    db.websiteContent.updatedBy = req.user.username;
    writeDB(db);
    res.json({ success: true, content: db.websiteContent });
});

module.exports = router;
