Chart.defaults.font.family = "'Segoe UI', system-ui, -apple-system, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#4a5568';
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.animation = { duration: 800, easing: 'easeOutQuart' };

Chart.defaults.plugins.tooltip = {
    backgroundColor: 'rgba(26, 54, 93, 0.9)',
    titleFont: { weight: '600' },
    bodyFont: { size: 12 },
    padding: 12,
    cornerRadius: 8,
    boxPadding: 4
};

function createChart(ctx, type, data, opts = {}) {
    return new Chart(ctx, {
        type,
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            ...opts
        }
    });
}

function chartColors() {
    return {
        blue: '#2b6cb0',
        blueLight: '#63b3ed',
        green: '#38a169',
        greenLight: '#68d391',
        amber: '#d69e2e',
        amberLight: '#f6e05e',
        red: '#e53e3e',
        redLight: '#fc8181',
        purple: '#805ad5',
        purpleLight: '#b794f4',
        cyan: '#00b5d8',
        cyanLight: '#76e4f7'
    };
}

function chartGradient(ctx, chartArea, color1, color2) {
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2 || color1 + '20');
    return gradient;
}

window.createChart = createChart;
window.chartColors = chartColors;
window.chartGradient = chartGradient;
