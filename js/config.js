// js/config.js
var CONFIG = {
    API_URL: '/api',
    MODEL_URL: 'https://teachablemachine.withgoogle.com/models/tYgsqAQNE/',
    CLASS_NAMES: ['vhodna_strecha', 'fve_instalovana', 'nevhodna_strecha', 'prumyslova_hala'],
    LOCATIONS: [
        { name: 'Most', factor: 0.98, type: 'Industrial' },
        { name: 'Chomutov', factor: 0.97, type: 'Industrial' },
        { name: 'Ústí nad Labem', factor: 0.96, type: 'Urban' },
        { name: 'Teplice', factor: 0.965, type: 'Urban' },
        { name: 'Litoměřice', factor: 0.975, type: 'Rural' },
        { name: 'Louny', factor: 0.985, type: 'Rural' },
        { name: 'Žatec', factor: 0.99, type: 'Rural' },
        { name: 'Děčín', factor: 0.97, type: 'Urban' },
        { name: 'Bílina', factor: 0.975, type: 'Rural' },
        { name: 'Jirkov', factor: 0.97, type: 'Urban' },
        { name: 'Kadaň', factor: 0.985, type: 'Rural' }
    ]
};

// Toto je důležité - nesmí tam být žádné další znaky navíc