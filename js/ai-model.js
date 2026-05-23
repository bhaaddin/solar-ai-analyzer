let model = null;
let analyzedRoofs = [];
let isDemoMode = false;

const CLASS_NAMES = ['vhodna_strecha', 'fve_instalovana', 'nevhodna_strecha', 'prumyslova_hala'];

const DISPLAY_NAMES_CS = {
    'vhodna_strecha': '✅ Vhodná střecha',
    'fve_instalovana': 'ℹ️ Panely instalovány',
    'nevhodna_strecha': '❌ Nevhodná střecha',
    'prumyslova_hala': '🏭 Průmyslová hala'
};

const DISPLAY_NAMES_EN = {
    'vhodna_strecha': '✅ Suitable roof',
    'fve_instalovana': 'ℹ️ Panels installed',
    'nevhodna_strecha': '❌ Unsuitable roof',
    'prumyslova_hala': '🏭 Industrial hall'
};

function getCurrentDisplayNames() {
    return (typeof currentLang !== 'undefined' && currentLang === 'en') ? DISPLAY_NAMES_EN : DISPLAY_NAMES_CS;
}

async function loadAIModel() {
    try {
        // Try to load from your custom model location
        // You need to upload your trained model files to your server
        const modelURL = '/models/model.json';  // Place your model files here
        const metadataURL = '/models/metadata.json';
        
        // Check if files exist first
        const modelExists = await fetch(modelURL, { method: 'HEAD' }).catch(() => false);
        
        if (modelExists && modelExists.ok) {
            model = await tmImage.load(modelURL, metadataURL);
            isDemoMode = false;
            console.log('✅ AI Model loaded successfully');
            return true;
        } else {
            throw new Error('Model files not found');
        }
    } catch(e) {
        console.warn('⚠️ AI Model not available, using demo mode:', e.message);
        isDemoMode = true;
        
        const roofTypeDiv = document.getElementById('roofType');
        if (roofTypeDiv) {
            const msg = (typeof currentLang !== 'undefined' && currentLang === 'en')
                ? '⚠️ DEMO Mode - AI not loaded'
                : '⚠️ DEMO režim - AI nenahráno';
            roofTypeDiv.innerHTML = `<div class="alert alert-info">${msg}</div>`;
        }
        return false;
    }
}

function getModel() {
    return model;
}

function isDemoModeActive() {
    return isDemoMode;
}

async function predictRoof(imageElement) {
    if (isDemoMode || !model) {
        console.log('🎮 Running in DEMO mode - returning mock prediction');
        
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Improved mock prediction based on image analysis
        // This is still demo, but more realistic
        let mockIndex = 0; // Default to suitable roof
        let mockConfidence = 75;
        
        // If we have canvas context, we could do basic color analysis
        if (imageElement) {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 64;
                canvas.height = 64;
                ctx.drawImage(imageElement, 0, 0, 64, 64);
                const imageData = ctx.getImageData(0, 0, 64, 64);
                const data = imageData.data;
                
                // Simple brightness analysis
                let brightness = 0;
                for (let i = 0; i < data.length; i += 4) {
                    brightness += (data[i] + data[i+1] + data[i+2]) / 3;
                }
                brightness /= (data.length / 4);
                
                // Rough estimation based on brightness
                if (brightness > 200) {
                    mockIndex = 0; // Suitable roof (bright)
                    mockConfidence = 85;
                } else if (brightness < 100) {
                    mockIndex = 2; // Unsuitable (dark - shadows/trees)
                    mockConfidence = 80;
                } else if (brightness > 100 && brightness < 150) {
                    mockIndex = 3; // Industrial
                    mockConfidence = 70;
                } else {
                    mockIndex = 1; // Already has panels
                    mockConfidence = 65;
                }
            } catch(e) {
                // Fallback to random
                mockIndex = Math.floor(Math.random() * 4);
                mockConfidence = 75 + Math.floor(Math.random() * 15);
            }
        } else {
            mockIndex = Math.floor(Math.random() * 4);
            mockConfidence = 75 + Math.floor(Math.random() * 15);
        }
        
        const mockProbabilities = [0, 0, 0, 0];
        mockProbabilities[mockIndex] = mockConfidence / 100;
        
        for (let i = 0; i < 4; i++) {
            if (i !== mockIndex) {
                mockProbabilities[i] = (1 - mockConfidence / 100) / 3;
            }
        }
        
        return {
            roofType: CLASS_NAMES[mockIndex],
            confidence: mockConfidence,
            allProbabilities: mockProbabilities.map(p => (p * 100).toFixed(1)),
            classNames: CLASS_NAMES,
            isDemo: true
        };
    }

    // Real model prediction
    const predictions = await model.predict(imageElement);
    let bestIndex = 0;
    let bestProb = 0;
    const probabilities = [];

    predictions.forEach((p, i) => {
        const prob = (p.probability * 100).toFixed(1);
        probabilities.push(prob);
        if (p.probability > bestProb) {
            bestProb = p.probability;
            bestIndex = i;
        }
    });

    return {
        roofType: CLASS_NAMES[bestIndex],
        confidence: parseFloat((bestProb * 100).toFixed(1)),
        allProbabilities: probabilities,
        classNames: CLASS_NAMES,
        isDemo: false
    };
}

function calculateSavings(roofType, area) {
    if (roofType === 'nevhodna_strecha' || area <= 0) {
        return { yearly: 0, kwp: 0, kwh: 0, co2: 0 };
    }

    let efficiency = 0.15;
    if (roofType === 'prumyslova_hala') efficiency = 0.20;
    if (roofType === 'fve_instalovana') efficiency = 0.10;

    let kwp = area * efficiency;
    let kwh = kwp * 950;
    let savings = kwh * 6.50;
    let co2 = kwh * 0.4;

    return {
        yearly: Math.round(savings),
        kwp: kwp.toFixed(1),
        kwh: Math.round(kwh),
        co2: Math.round(co2)
    };
}

function getRecommendationText(roofType) {
    const recs = {
        'vhodna_strecha': '✅ Doporučujeme instalaci FVE. Návratnost 8-10 let. Kontaktujte ECUK pro dotace až 50%.',
        'prumyslova_hala': '🏭 PRIORITNÍ INSTALACE! Nejvyšší potenciál. Doporučujeme okamžitou realizaci.',
        'fve_instalovana': 'ℹ️ Střecha již má FVE panely. Doporučujeme kontrolu stáří a možnost rozšíření.',
        'nevhodna_strecha': '❌ Instalace se nedoporučuje. Zvažte komunitní solární projekt nebo jinou lokalitu.'
    };
    return recs[roofType] || recs.nevhodna_strecha;
}

function addAnalysisToHistory(roofType, confidence) {
    analyzedRoofs.push({
        roofType,
        confidence,
        timestamp: new Date(),
        isDemo: isDemoMode
    });
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const totalSavings = analyzedRoofs.reduce((sum, r) => sum + calculateSavings(r.roofType, 50).yearly, 0);
    const totalCO2 = analyzedRoofs.reduce((sum, r) => sum + calculateSavings(r.roofType, 50).co2, 0);

    const analysesEl = document.getElementById('totalAnalysesCount');
    const savingsEl = document.getElementById('totalSavingsAmount');
    const co2El = document.getElementById('totalCO2Amount');

    if (analysesEl) analysesEl.innerHTML = analyzedRoofs.length;
    if (savingsEl) savingsEl.innerHTML = totalSavings.toLocaleString();
    if (co2El) co2El.innerHTML = totalCO2.toLocaleString();
}

function resetAnalysisHistory() {
    analyzedRoofs = [];
    updateStatsDisplay();
}

window.getModel = getModel;
window.predictRoof = predictRoof;
window.calculateSavings = calculateSavings;
window.getRecommendationText = getRecommendationText;
window.addAnalysisToHistory = addAnalysisToHistory;
window.getCurrentDisplayNames = getCurrentDisplayNames;
window.isDemoModeActive = isDemoModeActive;
window.resetAnalysisHistory = resetAnalysisHistory;