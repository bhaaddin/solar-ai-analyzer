const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { generateId } = require('./utils/helpers');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.json');

const DEFAULT_WEBSITE_CONTENT = {
    homePage: {
        heroTitle: 'AI Solar Intelligence System',
        heroDescription: 'Plánujte fotovoltaické elektrárny, bateriová úložiště a analýzu střech s pomocí umělé inteligence.',
        heroButtons: [
            { text: '⚡ Začít kalkulaci', action: 'calculator' },
            { text: '🧠 Scénáře', action: 'scenarios' }
        ],
        heroImages: [],
        heroVideos: [],
        sections: [
            { title: 'AI Kalkulačka', description: 'Inteligentní výpočet solárního potenciálu', visible: true },
            { title: 'Lokální AI', description: 'Analýza satelitních snímků', visible: true },
            { title: 'Analýza střechy', description: 'Klasifikace typů střech', visible: true },
            { title: 'AI Poradce', description: 'Chatbot pro solární poradenství', visible: true }
        ],
        cards: [
            { title: '⚡ AI Kalkulačka', description: 'Spočítejte si návratnost investice', link: 'calculator' },
            { title: '📍 Lokální AI', description: 'Analýza dostupných lokací', link: 'map-section' },
            { title: '📷 Analýza střechy', description: 'Nahrajte snímek pro analýzu', link: 'roof-upload' },
            { title: '🧠 AI Poradce', description: 'Zeptejte se na cokoliv', link: 'chat' },
            { title: '📖 Typy střech', description: 'Průvodce typy střech', link: 'legendSection' }
        ],
        features: [
            { title: 'AI Klasifikace', description: 'Neuronová síť analyzuje satelitní snímky', icon: '🧠' },
            { title: 'Predikce', description: 'Přesné predikce solárního výkonu', icon: '📊' },
            { title: 'Úspora CO2', description: 'Sledování uhlíkové stopy', icon: '🌍' }
        ],
        faq: [
            { question: 'Jak AI analyzuje střechy?', answer: 'Pomocí CNN klasifikátoru (MobileNetV2) na satelitních snímcích 64x64 px.' },
            { question: 'Jaké jsou požadavky na snímek?', answer: 'Jasný snímek shora, JPG/PNG, max 5MB, bez stínů.' },
            { question: 'Co je to kWp?', answer: 'Kilowatt-peak - špičkový výkon solárního panelu za standardních podmínek.' }
        ],
        footer: '© 2026 AI Solar Energy Intelligence Platform | Powered by ECUK',
        footerLinks: [
            { text: 'O projektu', url: '#info' },
            { text: 'Kontakt', url: 'mailto:info@ecuk.cz' },
            { text: 'Dokumentace', url: '#docs' }
        ]
    },
    calculatorPage: {
        title: '📈 Predikce soběstačnosti',
        fields: [
            { name: 'budget', label: 'Rozpočet (Kč)', type: 'range', min: 1, max: 10, default: 3 },
            { name: 'location', label: 'Lokace', type: 'select', options: ['Most', 'Chomutov', 'Ústí nad Labem', 'Teplice', 'Litoměřice', 'Děčín'] },
            { name: 'hydrogen', label: '💧 Vodíkové úložiště', type: 'toggle', default: false }
        ],
        tooltips: {
            budget: 'Nastavte váš rozpočet pro solární instalaci',
            location: 'Vyberte lokaci pro přesnější výpočet',
            hydrogen: 'Sezónní stabilita (+500k Kč)'
        },
        labels: {
            budget: 'Rozpočet',
            location: 'Lokace',
            hydrogen: 'Vodíkové úložiště',
            calculate: 'Spočítat',
            reset: 'Reset'
        },
        infoTexts: [
            'Výpočet založen na reálných datech z Ústeckého kraje',
            'Cena za kWp: 25 000 Kč',
            'Průměrná roční výroba: 950 kWh/kWp',
            'Cena elektřiny: 6.50 Kč/kWh'
        ],
        resultCards: [
            { key: 'systemSize', label: '⚡ Výkon FVE', unit: 'kWp' },
            { key: 'batterySize', label: '🔋 Baterie', unit: 'kWh' },
            { key: 'selfSufficiency', label: '🏠 Soběstačnost', unit: '%' },
            { key: 'yearlySavings', label: '💰 Úspora/rok', unit: 'Kč' },
            { key: 'co2Savings', label: '🌍 CO₂ úspora', unit: 't/rok' },
            { key: 'riskScore', label: '⚠️ Riziko', unit: '%' }
        ]
    },
    infoPage: {
        articles: [
            {
                title: 'O projektu SolarAI',
                content: 'AI Solar Roof Analyzer je platforma pro plánování fotovoltaických elektráren...',
                published: true
            },
            {
                title: 'Jak AI funguje',
                content: 'Neuronová síť klasifikuje satelitní snímky do 4 tříd střech...',
                published: true
            }
        ],
        guides: [
            { title: 'Průvodce instalací FVE', steps: ['Analýza střechy', 'Výpočet kapacity', 'Výběr komponent', 'Instalace', 'Kolaudace'] },
            { title: 'Dotace a financování', steps: ['Zjištění nároku', 'Podání žádosti', 'Schválení', 'Čerpání'] }
        ],
        definitions: [
            { term: 'kWp', definition: 'Kilowatt-peak - špičkový výkon solárního panelu' },
            { term: 'kWh', definition: 'Kilowatthodina - množství vyrobené energie' },
            { term: 'ROI', definition: 'Return on Investment - návratnost investice' },
            { term: 'FVE', definition: 'Fotovoltaická elektrárna' },
            { term: 'BESS', definition: 'Battery Energy Storage System' }
        ],
        educationalContent: [
            { title: 'Solární energie v ČR', type: 'article', published: true },
            { title: 'Typy solárních panelů', type: 'guide', published: true }
        ]
    },
    mapPage: {
        title: '🗺️ Solární mapa - Ústecký kraj',
        text: 'Interaktivní mapa solárního potenciálu v Ústeckém kraji',
        layers: ['solární potenciál', 'tepelné mapy', 'infrastruktura'],
        defaultLocation: { lat: 50.5, lng: 13.6, zoom: 9 }
    },
    aiSection: {
        prompts: [
            { key: 'roofAnalysis', text: 'Analyzujte tento satelitní snímek a určete vhodnost pro solární panely.' },
            { key: 'savingsCalculation', text: 'Spočítejte roční úsporu pro danou konfiguraci.' },
            { key: 'generalAdvice', text: 'Poskytněte obecné poradenství o solární energii.' }
        ],
        aiExplanations: [
            { key: 'systemSize', title: 'Proč tento výkon?', content: 'Výpočet vychází z vašeho rozpočtu a lokace...' },
            { key: 'selfSufficiency', title: 'Proč tato soběstačnost?', content: 'Soběstačnost je ovlivněna výkonem FVE a kapacitou baterie...' },
            { key: 'co2', title: 'Proč tato CO₂ úspora?', content: 'Každá kWh ze slunce nahrazuje energii z fosilních zdrojů...' }
        ],
        aiOutputTemplates: {
            prediction: 'Na základě analýzy doporučujeme systém o výkonu {systemSize} kWp s baterií {batterySize} kWh.',
            recommendation: 'Pro vaši lokaci {location} je optimální investice {budget} Kč.'
        }
    },
    usersPage: {
        registrationSettings: {
            allowRegistration: true,
            requireApproval: false,
            defaultRole: 'user'
        },
        permissions: {
            user: ['view_calculator', 'view_map', 'upload_image', 'save_project'],
            admin: ['all']
        },
        roles: ['user', 'admin'],
        accountSettings: {
            allowProfileEdit: true,
            allowDeleteAccount: false,
            sessionTimeout: 24
        }
    },
    lastUpdated: new Date().toISOString(),
    updatedBy: 'admin'
};

function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initial = {
            users: [
                {
                    id: generateId(),
                    username: 'admin',
                    email: 'admin@ecuk.cz',
                    password: bcrypt.hashSync('admin123', 10),
                    role: 'admin',
                    profile: {
                        fullName: 'Administrator',
                        department: 'ECUK',
                        phone: '+420 123 456 789',
                        avatar: '👨‍💼',
                        bio: 'System administrator for AI Solar Roof Analyzer'
                    },
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }
            ],
            websiteContent: JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT)),
            analytics: {
                general: {
                    totalUsers: 1,
                    activeUsers: 0,
                    returningUsers: 0,
                    totalProjects: 0,
                    totalCalculations: 0,
                    totalUploadedFiles: 0,
                    totalAnalyses: 0,
                    projectGrowth: [],
                    mostUsedOptions: [],
                    mostSearchedLocations: [],
                    popularSystems: [],
                    averageBudget: 0,
                    averageCO2Savings: 0,
                    lastActivity: new Date().toISOString()
                },
                clientActivity: {
                    newApplications: 0,
                    pendingProjects: 0,
                    completedProjects: 0,
                    userTrends: [],
                    growthTrends: []
                },
                aiStatistics: {
                    predictionCount: 0,
                    modelAccuracy: 0,
                    apiRequests: 0,
                    datasetUsage: {},
                    errorTracking: []
                }
            },
            historicalData: [],
            measures: [],
            scenarios: [],
            modelData: [],
            projects: [],
            clientApplications: [],
            userActivity: [],
            apiLogs: [],
            aiModels: [
                {
                    id: generateId(),
                    name: 'Roof Classifier CNN',
                    version: '1.0.0',
                    type: 'image_classification',
                    accuracy: 89,
                    status: 'active',
                    lastTrained: new Date().toISOString(),
                    trainingData: 'satellite_images_64x64',
                    description: 'CNN klasifikátor pro 4 typy střech'
                },
                {
                    id: generateId(),
                    name: 'Solar Prediction Engine',
                    version: '2.0.0',
                    type: 'regression',
                    accuracy: 92,
                    status: 'active',
                    lastTrained: new Date().toISOString(),
                    trainingData: 'historicka_data+scenare',
                    description: 'Predikční engine pro solární výpočty'
                }
            ],
            importedFiles: [],
            notifications: []
        };
        writeDB(initial);
    }
}

function migrateDB(db) {
    const content = db.websiteContent;
    if (content && content.siteTitle !== undefined) {
        db.websiteContent = {
            homePage: {
                heroTitle: content.siteTitle || 'AI Solar Intelligence System',
                heroDescription: content.heroText || 'Government AI Platform for Solar Energy Transformation',
                heroButtons: [{ text: '⚡ Začít kalkulaci', action: 'calculator' }, { text: '🧠 Scénáře', action: 'scenarios' }],
                heroImages: [], heroVideos: [],
                sections: [{ title: 'AI Kalkulačka', description: 'Inteligentní výpočet solárního potenciálu', visible: true }],
                cards: [{ title: '⚡ AI Kalkulačka', description: 'Spočítejte si návratnost investice', link: 'calculator' }],
                features: [{ title: 'AI Klasifikace', description: 'Neuronová síť analyzuje satelitní snímky', icon: '🧠' }],
                faq: [{ question: 'Jak AI analyzuje střechy?', answer: 'Pomocí CNN klasifikátoru.' }],
                footer: content.footerText || '© 2026 AI Solar Energy Intelligence Platform | Powered by ECUK'
            },
            calculatorPage: { title: '📈 Predikce soběstačnosti', fields: [], tooltips: {}, labels: {}, infoTexts: [], resultCards: [] },
            infoPage: { articles: [], guides: [], definitions: [], educationalContent: [] },
            mapPage: { title: '🗺️ Solární mapa', text: '', layers: [], defaultLocation: { lat: 50.5, lng: 13.6, zoom: 9 } },
            aiSection: { prompts: [], aiExplanations: [], aiOutputTemplates: {} },
            usersPage: { registrationSettings: { allowRegistration: true, requireApproval: false, defaultRole: 'user' }, permissions: {}, roles: ['user', 'admin'], accountSettings: { sessionTimeout: 24 } },
            lastUpdated: content.lastUpdated || new Date().toISOString(),
            updatedBy: content.updatedBy || 'admin'
        };
    }
    if (!db.projects) db.projects = [];
    if (!db.clientApplications) db.clientApplications = [];
    if (!db.userActivity) db.userActivity = [];
    if (!db.apiLogs) db.apiLogs = [];
    if (!db.aiModels) {
        db.aiModels = [
            { id: generateId(), name: 'Roof Classifier CNN', version: '1.0.0', type: 'image_classification', accuracy: 89, status: 'active', lastTrained: new Date().toISOString(), trainingData: 'satellite_images', description: 'CNN klasifikátor pro 4 typy střech' },
            { id: generateId(), name: 'Solar Prediction Engine', version: '2.0.0', type: 'regression', accuracy: 92, status: 'active', lastTrained: new Date().toISOString(), trainingData: 'historicka_data+scenare', description: 'Predikční engine pro solární výpočty' }
        ];
    }
    if (!db.importedFiles) db.importedFiles = [];
    if (!db.notifications) db.notifications = [];
    if (!db.analytics || !db.analytics.general) {
        db.analytics = {
            general: { totalUsers: db.users.length, activeUsers: 0, returningUsers: 0, totalProjects: 0, totalCalculations: db.analytics?.totalAnalyses || 0, totalUploadedFiles: 0, totalAnalyses: db.analytics?.totalAnalyses || 0, lastActivity: new Date().toISOString() },
            clientActivity: { newApplications: 0, pendingProjects: 0, completedProjects: 0 },
            aiStatistics: { predictionCount: 0, modelAccuracy: 0, apiRequests: 0, datasetUsage: {}, errorTracking: [] }
        };
    }
    return db;
}

function readDB() {
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const db = JSON.parse(raw);
        return migrateDB(db);
    } catch {
        initDB();
        return readDB();
    }
}

function writeDB(data) {
    data = migrateDB(data);
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, DB_PATH);
}

function getDefaultWebsiteContent() {
    return JSON.parse(JSON.stringify(DEFAULT_WEBSITE_CONTENT));
}

module.exports = {
    readDB,
    writeDB,
    initDB,
    DB_PATH,
    getDefaultWebsiteContent,
    migrateDB
};
