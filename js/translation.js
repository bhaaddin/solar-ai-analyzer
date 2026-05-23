// js/translation.js - Kompletní překlady
const translations = {
    cs: {
        siteTitle: '🌞 AI Solar Roof Analyzer',
        loginNav: '🔐 Přihlásit',
        registerNav: 'Registrovat',
        logoutNav: 'Odhlásit',
        dashboardNav: 'Dashboard',
        aiModelsTitle: '🧠 AI MODELY',
        modelCnn: 'CNN Klasifikátor',
        modelMobilenet: 'MobileNetV2',
        modelResnet: 'ResNet50',
        modelInfoTitle: '📊 INFORMACE O MODELU',
        euTitle: '✅ SOULAD S EU AI ACT',
        euText: '• Právo na vysvětlení (čl. 13-15)<br>• Dozor člověka<br>• GDPR architektura',
        utilsTitle: '🛠️ NÁSTROJE',
        areaCalc: '📐 Kalkulačka plochy',
        currency: '💱 Měnová kalkulačka',
        roi: '📈 ROI kalkulačka',
        converter: '🔄 Převodník',
        uploadText: '📸 Klikněte nebo přetáhněte satelitní snímek střechy',
        uploadSupport: 'Podporuje JPG, PNG, JPEG (max 5MB)',
        analyzeBtn: '🔍 Analyzovat střechu',
        resetBtn: '📁 Nový obrázek',
        mapTitle: '🗺️ Solární mapa - Ústecký kraj',
        aboutTitle: 'ℹ️ O PROJEKTU',
        aboutText: 'AI analyzuje satelitní snímky a určuje vhodnost střech pro solární panely. Vytvořeno pro ECUK.',
        tipsTitle: '💡 TIPY',
        tipsText: '• Používejte jasné snímky shora<br>• Vyhněte se stínům<br>• Průmyslové haly mají nejvyšší potenciál',
        statsTitle: '📊 ŽIVÉ STATISTIKY',
        chatTitle: '🤖 AI ASISTENT',
        chatBtn: '💬 Zeptejte se SolarAI',
        legendTitle: '🏷️ TYPY STŘECH',
        legendSuitable: 'Vhodná střecha',
        legendInstalled: 'FVE instalována',
        legendUnsuitable: 'Nevhodná střecha',
        legendIndustrial: 'Průmyslová hala',
        calcTitle: '📐 Kalkulačka plochy střechy',
        calcLengthLabel: 'Délka střechy (m):',
        calcWidthLabel: 'Šířka střechy (m):',
        calcBtn: 'Spočítat plochu',
        currTitle: '💱 Měnová kalkulačka',
        currAmountLabel: 'Částka (Kč):',
        currConvertBtn: 'Převést na EUR',
        roiTitle: '📈 ROI kalkulačka',
        roiInvestmentLabel: 'Investice (Kč):',
        roiSavingsLabel: 'Roční úspora (Kč):',
        roiCalcBtn: 'Spočítat návratnost',
        convTitle: '🔄 Převodník jednotek',
        convKwpLabel: 'Výkon (kWp):',
        convBtn: 'Převést na Wp',
        chatPlaceholder: 'Napište otázku...',
        chatSend: 'Odeslat',
        teamInfo: '🌞 AI Solar Roof Analyzer Tým | Vyvinuto pro ECUK | AI Olympiáda 2026 | Ústecký kraj',
        teamMembers: '👨‍💻 Tým: AI Olympiáda 2026 | Partner: ECUK | 📧 info@ecuk.cz'
    },
    en: {
        siteTitle: '🌞 AI Solar Roof Analyzer',
        loginNav: '🔐 Login',
        registerNav: 'Sign Up',
        logoutNav: 'Logout',
        dashboardNav: 'Dashboard',
        aiModelsTitle: '🧠 AI MODELS',
        modelCnn: 'CNN Classifier',
        modelMobilenet: 'MobileNetV2',
        modelResnet: 'ResNet50',
        modelInfoTitle: '📊 MODEL INFO',
        euTitle: '✅ EU AI ACT COMPLIANT',
        euText: '• Right to explanation (Art. 13-15)<br>• Human oversight<br>• GDPR architecture',
        utilsTitle: '🛠️ UTILITIES',
        areaCalc: '📐 Area Calculator',
        currency: '💱 Currency Converter',
        roi: '📈 ROI Calculator',
        converter: '🔄 Unit Converter',
        uploadText: '📸 Click or drag a roof satellite image here',
        uploadSupport: 'Supports JPG, PNG, JPEG (max 5MB)',
        analyzeBtn: '🔍 Analyze Roof',
        resetBtn: '📁 New Image',
        mapTitle: '🗺️ Solar Potential Map - Ústecký kraj',
        aboutTitle: 'ℹ️ ABOUT',
        aboutText: 'AI analyzes satellite images to determine roof suitability for solar panels. Built for ECUK.',
        tipsTitle: '💡 TIPS',
        tipsText: '• Use clear top-down images<br>• Avoid shadows<br>• Industrial roofs have highest potential',
        statsTitle: '📊 LIVE STATS',
        chatTitle: '🤖 AI ASSISTANT',
        chatBtn: '💬 Ask SolarAI',
        legendTitle: '🏷️ ROOF TYPES',
        legendSuitable: 'Suitable roof',
        legendInstalled: 'Already has panels',
        legendUnsuitable: 'Not suitable',
        legendIndustrial: 'Industrial hall',
        calcTitle: '📐 Roof Area Calculator',
        calcLengthLabel: 'Roof length (m):',
        calcWidthLabel: 'Roof width (m):',
        calcBtn: 'Calculate Area',
        currTitle: '💱 Currency Converter',
        currAmountLabel: 'Amount (Kč):',
        currConvertBtn: 'Convert to EUR',
        roiTitle: '📈 ROI Calculator',
        roiInvestmentLabel: 'Investment (Kč):',
        roiSavingsLabel: 'Annual savings (Kč):',
        roiCalcBtn: 'Calculate Payback',
        convTitle: '🔄 Unit Converter',
        convKwpLabel: 'Power (kWp):',
        convBtn: 'Convert to Wp',
        chatPlaceholder: 'Type your question...',
        chatSend: 'Send',
        teamInfo: '🌞 AI Solar Roof Analyzer Team | Developed for ECUK | AI Olympiáda 2026 | Ústecký kraj',
        teamMembers: '👨‍💻 Team: AI Olympiáda 2026 | Partner: ECUK | 📧 info@ecuk.cz'
    }
};

let currentLang = 'cs';

function t(key) {
    return translations[currentLang][key] || translations.cs[key] || key;
}

function updateAllText() {
    const elements = {
        siteTitle: 'siteTitle', loginNavBtn: 'loginNav', registerNavBtn: 'registerNav',
        aiModelsTitle: 'aiModelsTitle', modelInfoTitle: 'modelInfoTitle',
        euTitle: 'euTitle', euText: 'euText', utilsTitle: 'utilsTitle',
        areaCalcBtn: 'areaCalc', currencyBtn: 'currency', roiBtn: 'roi', converterBtn: 'converter',
        uploadText: 'uploadText', uploadSupport: 'uploadSupport',
        analyzeBtnText: 'analyzeBtn', resetBtnText: 'resetBtn',
        mapTitle: 'mapTitle', aboutTitle: 'aboutTitle', aboutText: 'aboutText',
        tipsTitle: 'tipsTitle', tipsText: 'tipsText', statsTitle: 'statsTitle',
        chatTitle: 'chatTitle', chatBtnText: 'chatBtn',
        legendTitle: 'legendTitle', legendSuitable: 'legendSuitable',
        legendInstalled: 'legendInstalled', legendUnsuitable: 'legendUnsuitable',
        legendIndustrial: 'legendIndustrial',
        calcTitle: 'calcTitle', calcLengthLabel: 'calcLengthLabel',
        calcWidthLabel: 'calcWidthLabel', calcBtn: 'calcBtn',
        currTitle: 'currTitle', currAmountLabel: 'currAmountLabel', currConvertBtn: 'currConvertBtn',
        roiTitle: 'roiTitle', roiInvestmentLabel: 'roiInvestmentLabel',
        roiSavingsLabel: 'roiSavingsLabel', roiCalcBtn: 'roiCalcBtn',
        convTitle: 'convTitle', convKwpLabel: 'convKwpLabel', convBtn: 'convBtn'
    };
    for (const [id, key] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = t(key);
    }
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t('chatPlaceholder');
    const teamInfo = document.querySelector('.team-info');
    if (teamInfo) teamInfo.innerHTML = t('teamInfo');
    const teamMembers = document.querySelector('.team-members');
    if (teamMembers) teamMembers.innerHTML = t('teamMembers');
}

function toggleLanguage() {
    currentLang = currentLang === 'cs' ? 'en' : 'cs';
    updateAllText();
    const btn = document.getElementById('langToggle');
    if (btn) btn.innerHTML = currentLang === 'cs' ? '🌐 CZ' : '🌐 EN';
    localStorage.setItem('preferredLanguage', currentLang);
    window.dispatchEvent(new CustomEvent('languageChanged'));
}

function initLanguage() {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved === 'cs' || saved === 'en') currentLang = saved;
    updateAllText();
    const btn = document.getElementById('langToggle');
    if (btn) {
        btn.innerHTML = currentLang === 'cs' ? '🌐 CZ' : '🌐 EN';
        btn.addEventListener('click', toggleLanguage);
    }
}