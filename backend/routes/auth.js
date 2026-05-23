const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../database');
const { generateId } = require('../utils/helpers');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerValidation, async (req, res) => {
    const { username, email, password, fullName, department, phone } = req.body;
    const db = readDB();
    
    if (db.users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    if (db.users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username taken' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: generateId(),
        username,
        email,
        password: hashedPassword,
        role: 'user',
        profile: {
            fullName: fullName || username,
            department: department || 'General',
            phone: phone || '',
            avatar: '👤',
            bio: 'Member',
            createdAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    db.analytics.totalUsers = db.users.length;
    writeDB(db);
    
    const token = jwt.sign(
        { id: newUser.id, username, email, role: 'user' },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    res.json({
        success: true,
        token,
        user: { id: newUser.id, username, email, role: 'user', profile: newUser.profile }
    });
});

router.post('/login', loginValidation, async (req, res) => {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role, profile: user.profile }
    });
});

router.get('/me', verifyToken, (req, res) => {
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
    });
});

module.exports = router;
