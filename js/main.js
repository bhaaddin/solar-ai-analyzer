async function runAnalysis() {
    if (!previewImage || !previewImage.src) {
        alert('Please upload an image first');
        return;
    }
    showLoading('Analyzing');
    try {
        const result = await predictRoof(previewImage);
        addAnalysisToHistory(result.roofType, result.confidence);
        renderResults(result);

        const token = localStorage.getItem('token');
        if (token) {
            Utils.apiFetch('/analytics', { method: 'POST' }).catch(() => {});
        }
    } catch (e) {
        console.error(e);
        displayError('Analysis error');
    }
}

function renderResults(result) {
    const roofType = result.roofType;
    const confidence = result.confidence;
    const displayNames = getCurrentDisplayNames();

    document.getElementById('roofType').innerHTML = `
        <span class="badge badge-good">${displayNames[roofType]}</span>
        <div>Confidence: ${confidence}%</div>
    `;

    let barsHtml = '<div><strong>AI Confidence:</strong></div>';
    result.classNames.forEach((name, i) => {
        const label = name.replace(/_/g, ' ');
        const val = result.allProbabilities[i];
        barsHtml += `
            <div class="confidence-bar">
                <span class="confidence-label">${label}:</span>
                <div class="confidence-bg">
                    <div class="confidence-fill" style="width:${val}%">${val}%</div>
                </div>
            </div>
        `;
    });
    document.getElementById('confidenceBars').innerHTML = barsHtml;

    const defaultArea = roofType === 'prumyslova_hala' ? 500 : 50;
    const savings = calculateSavings(roofType, defaultArea);

    document.getElementById('savingsSection').innerHTML = `
        <div class="area-input">
            <strong>Area (m²):</strong>
            <input type="number" id="roofArea" value="${defaultArea}" step="10" min="10">
            <button id="updateSavingsBtn" class="btn btn-sm">Calculate Savings</button>
        </div>
        <div id="savingsDisplay" class="savings-box">
            <div class="savings-amount">${savings.yearly.toLocaleString()} Kč / year</div>
            <div>⚡ ${savings.kwp} kWp | ${savings.kwh} kWh | ${savings.co2} kg CO₂</div>
        </div>
    `;

    document.getElementById('recommendation').innerHTML = `
        <div style="background:var(--bg);padding:14px;border-radius:8px;margin-top:16px">
            <strong>ECUK:</strong><br>${getRecommendationText(roofType)}
        </div>
    `;

    document.getElementById('results').style.display = 'block';

    setTimeout(() => {
        const updateBtn = document.getElementById('updateSavingsBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                const area = parseFloat(document.getElementById('roofArea').value) || 0;
                const ns = calculateSavings(roofType, area);
                document.getElementById('savingsDisplay').innerHTML = `
                    <div class="savings-amount">${ns.yearly.toLocaleString()} Kč / year</div>
                    <div>⚡ ${ns.kwp} kWp | ${ns.kwh} kWh | ${ns.co2} kg CO₂</div>
                `;
            });
        }
    }, 100);
}

async function initApplication() {
    initUI();
    setupUploadHandlers();
    initTeamBar();
    initLanguage();
    initChat();
    initMap();
    initPrediction();
    initNavScrollSpy();
    await loadAIModel();

    if (analyzeBtn) analyzeBtn.addEventListener('click', runAnalysis);

    window.onclick = function(event) {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.style.display = 'none';
        }
    };

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
        const loginNav = document.getElementById('loginNavBtn');
        const registerNav = document.getElementById('registerNavBtn');
        const userDisplay = document.getElementById('userNavDisplay');
        if (loginNav) loginNav.style.display = 'none';
        if (registerNav) registerNav.style.display = 'none';
        if (userDisplay) {
            userDisplay.style.display = 'inline';
            userDisplay.innerHTML = `👤 ${user.username} | <a href="dashboard.html">Dashboard</a> | <a href="#" onclick="localStorage.clear(); location.reload();">Logout</a>`;
        }
    }

    if (document.querySelector('.admin-edit-area')) {
        loadAdminContent();
    }
}

document.addEventListener('DOMContentLoaded', initApplication);
