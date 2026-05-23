require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { initDB, readDB, writeDB } = require('./backend/database');
const { errorHandler, requestLogger } = require('./backend/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3001';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many login attempts, please try again later' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(requestLogger);

app.use('/api', limiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

app.use('/api', require('./backend/routes/auth'));
app.use('/api/content', require('./backend/routes/content'));
app.use('/api', require('./backend/routes/data'));
app.use('/api/admin', require('./backend/routes/admin'));
app.use('/api', require('./backend/routes/prediction'));
app.use('/api', require('./backend/routes/projects'));
app.use('/api', require('./backend/routes/clients'));
app.use('/api', require('./backend/routes/import'));
app.use('/api', require('./backend/routes/activity'));
app.use('/api', require('./backend/routes/ai-models'));

app.use(express.static(path.join(__dirname)));
app.use('/static', express.static(path.join(__dirname, 'uploads')));

app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running!', version: '3.0.0', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

initDB();

try {
    const db = readDB();
    writeDB(db);
    console.log('📦 Database migrated to latest schema');
} catch (e) {
    console.error('Migration warning:', e.message);
}

app.listen(PORT, () => {
    console.log(`\n✅ Server running at http://localhost:${PORT}`);
    console.log(`📧 Admin login: admin@ecuk.cz / admin123`);
    console.log(`👥 API ready for requests`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(`📡 API v3.0.0 - Extended Intelligence System\n`);
});
