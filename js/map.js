// js/map.js - SPRÁVNĚ OPRAVENÁ VERZE
let map = null;
let mapMarker = null;
let searchControl = null;
let allLocationMarkers = [];

// POZOR: configLocationIrradiance NEDEFINUJEME - už existuje v prediction.js!
// Pokud chcete být úplně bezpeční, můžete použít toto (ale bez const/let):
if (typeof configLocationIrradiance === 'undefined') {
    window.configLocationIrradiance = {
        'Most': 980, 'Chomutov': 970, 'Ústí nad Labem': 960,
        'Teplice': 965, 'Litoměřice': 975, 'Louny': 985,
        'Žatec': 990, 'Děčín': 970, 'Bílina': 975,
        'Jirkov': 970, 'Kadaň': 985
    };
}

// JEDNA FUNKCE initMap - ne dvě!
function initMap() {
    const mapEl = document.getElementById('map');
    if (!mapEl) {
        console.log('Waiting for map element...');
        setTimeout(initMap, 100);
        return;
    }
    
    if (map) {
        console.log('Map already initialized');
        return;
    }
    
    console.log('Initializing map...');
    
    try {
        map = L.map('map').setView([50.66, 14.03], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: 'abcd'
        }).addTo(map);
        
        addLocationMarkers();
        initMapSearch();
        console.log('Map initialized successfully');
    } catch(e) {
        console.error('Map initialization error:', e);
    }
}

function addLocationMarkers() {
    allLocationMarkers = [];
    CONFIG.LOCATIONS.forEach(loc => {
        const coords = getLocationCoords(loc.name);
        if (coords) {
            const marker = L.marker(coords).addTo(map);
            marker._locationName = loc.name;
            marker.bindPopup(`<b>${loc.name}</b><br>Solar factor: ${loc.factor}<br>Type: ${loc.type}<br><button onclick="window.selectLocation('${loc.name}')">Select for analysis</button>`);
            allLocationMarkers.push(marker);
        }
    });
}

function getLocationCoords(name) {
    const coords = {
        'Most': [50.503, 13.636],
        'Chomutov': [50.460, 13.417],
        'Ústí nad Labem': [50.660, 14.032],
        'Teplice': [50.640, 13.824],
        'Litoměřice': [50.533, 14.131],
        'Louny': [50.357, 13.796],
        'Žatec': [50.327, 13.545],
        'Děčín': [50.782, 14.214],
        'Bílina': [50.549, 13.775],
        'Jirkov': [50.500, 13.448],
        'Kadaň': [50.383, 13.271]
    };
    return coords[name] || null;
}

function setMarker(lat, lng) {
    if (mapMarker) map.removeLayer(mapMarker);
    mapMarker = L.marker([lat, lng]).addTo(map);
    mapMarker.bindPopup(`📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`).openPopup();

    const locationName = findNearestLocation(lat, lng);
    if (locationName) {
        selectLocation(locationName);
    }
}

function findNearestLocation(lat, lng) {
    let nearest = null;
    let minDist = Infinity;

    CONFIG.LOCATIONS.forEach(loc => {
        const coords = getLocationCoords(loc.name);
        if (coords) {
            const dist = Math.sqrt(Math.pow(coords[0] - lat, 2) + Math.pow(coords[1] - lng, 2));
            if (dist < minDist) {
                minDist = dist;
                nearest = loc.name;
            }
        }
    });

    return minDist < 0.5 ? nearest : null;
}

function updateMapMarker() {
    if (!map) return;
    if (mapMarker) map.removeLayer(mapMarker);
    const center = map.getCenter();
    mapMarker = L.marker([center.lat, center.lng]).addTo(map);
    mapMarker.bindPopup('📍 Ústecký kraj').openPopup();
}

window.addEventListener('languageChanged', updateMapMarker);

function quickSelectLocation(name) {
    selectLocation(name);
    const coords = getLocationCoords(name);
    if (coords && map) {
        map.setView(coords, 13);
        if (mapMarker) map.removeLayer(mapMarker);
        mapMarker = L.marker(coords).addTo(map);
        const loc = CONFIG.LOCATIONS.find(l => l.name === name);
        const irradiance = configLocationIrradiance && configLocationIrradiance[name]
            ? configLocationIrradiance[name]
            : Math.round((loc ? loc.factor : 0.97) * 1000);
        mapMarker.bindPopup(`<b>${name}</b><br>☀️ ${irradiance} kWh/m²/rok`).openPopup();
    }

    const infoEl = document.getElementById('locationInfo');
    if (infoEl) {
        const loc = CONFIG.LOCATIONS.find(l => l.name === name);
        const irradiance = configLocationIrradiance && configLocationIrradiance[name]
            ? configLocationIrradiance[name]
            : Math.round((loc ? loc.factor : 0.97) * 1000);
        infoEl.innerHTML = `📍 <b>${name}</b> — ☀️ ${irradiance} kWh/m²/rok`;
    }
    const sbLoc = document.getElementById('sidebarLocation');
    const sbLocDet = document.getElementById('sidebarLocationDetail');
    if (sbLoc) {
        const loc = CONFIG.LOCATIONS.find(l => l.name === name);
        const irradiance = configLocationIrradiance && configLocationIrradiance[name]
            ? configLocationIrradiance[name]
            : Math.round((loc ? loc.factor : 0.97) * 1000);
        sbLoc.innerHTML = `📍 <b>${name}</b> — ☀️ ${irradiance} kWh/m²/rok`;
        if (sbLocDet) sbLocDet.textContent = `Faktor: ${loc ? loc.factor : 0.97} | Typ: ${loc ? loc.type : 'N/A'}`;
    }

    document.querySelectorAll('.loc-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.includes(name));
    });
}

// ===== MAP SEARCH =====
function initMapSearch() {
    const searchInput = document.getElementById('mapSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', debounce(handleMapSearch, 300));
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) handleMapSearch();
    });
    document.addEventListener('click', (e) => {
        const results = document.getElementById('mapSearchResults');
        if (results && !e.target.closest('.map-search-container')) {
            results.classList.remove('show');
        }
    });
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleMapSearch();
        if (e.key === 'Escape') {
            document.getElementById('mapSearchResults').classList.remove('show');
            searchInput.blur();
        }
    });
}

function handleMapSearch() {
    const input = document.getElementById('mapSearchInput');
    const resultsContainer = document.getElementById('mapSearchResults');
    const query = input.value.trim().toLowerCase();

    if (query.length < 1) {
        resultsContainer.classList.remove('show');
        return;
    }

    const matches = searchLocations(query);
    renderSearchResults(matches, resultsContainer);

    if (matches.length === 0) {
        geocodeUnknown(query);
    }
}

async function geocodeUnknown(query) {
    const resultsContainer = document.getElementById('mapSearchResults');
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+,+Czech+Republic&format=json&limit=5&accept-language=cs`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.length > 0) {
            const geoResults = data.map(d => ({
                name: d.display_name.split(',')[0],
                coords: [parseFloat(d.lat), parseFloat(d.lon)],
                type: 'village',
                fromNominatim: true
            }));
            resultsContainer.innerHTML = geoResults.map((m, i) => `
                <div class="map-search-result-item" onclick="selectMapSearchResult('${m.name.replace(/'/g, "\\'")}', [${m.coords[0]}, ${m.coords[1]}])">
                    <span class="result-icon">🌍</span>
                    <span class="result-name">${m.name}</span>
                    <span class="result-type">${m.type === 'village' ? 'Obec' : 'Město'}</span>
                </div>
            `).join('');
            resultsContainer.classList.add('show');
        }
    } catch (e) {
        // silent fail
    }
}

function searchLocations(query) {
    const results = [];
    CONFIG.LOCATIONS.forEach(loc => {
        if (loc.name.toLowerCase().includes(query)) {
            results.push({ name: loc.name, type: loc.type, coords: getLocationCoords(loc.name) });
        }
    });
    const villages = [
        { name: 'Klášterec nad Ohří', coords: [50.384, 13.171], type: 'village' },
        { name: 'Varnsdorf', coords: [50.911, 14.618], type: 'village' },
        { name: 'Rumburk', coords: [50.951, 14.557], type: 'village' },
        { name: 'Štětí', coords: [50.453, 14.374], type: 'village' },
        { name: 'Horní Jiřetín', coords: [50.572, 13.547], type: 'village' },
        { name: 'Meziboří', coords: [50.621, 13.599], type: 'village' },
        { name: 'Lom', coords: [50.594, 13.657], type: 'village' },
        { name: 'Osek', coords: [50.620, 13.694], type: 'village' },
        { name: 'Duchcov', coords: [50.604, 13.746], type: 'village' },
        { name: 'Bílina', coords: [50.549, 13.775], type: 'village' },
        { name: 'Krupka', coords: [50.684, 13.858], type: 'village' },
        { name: 'Dubí', coords: [50.686, 13.789], type: 'village' },
        { name: 'Proboštov', coords: [50.667, 13.836], type: 'village' },
        { name: 'Hostomice', coords: [50.587, 13.808], type: 'village' },
        { name: 'Hrob', coords: [50.659, 13.728], type: 'village' },
        { name: 'Jílové', coords: [50.760, 14.103], type: 'village' },
        { name: 'Terezín', coords: [50.511, 14.150], type: 'village' },
        { name: 'Roudnice nad Labem', coords: [50.425, 14.258], type: 'village' },
        { name: 'Úštěk', coords: [50.584, 14.343], type: 'village' },
        { name: 'Libochovice', coords: [50.408, 14.044], type: 'village' },
        { name: 'Budyně nad Ohří', coords: [50.404, 14.126], type: 'village' },
        { name: 'Lovosice', coords: [50.515, 14.051], type: 'village' },
        { name: 'Cítoliby', coords: [50.332, 13.742], type: 'village' },
        { name: 'Postoloprty', coords: [50.360, 13.702], type: 'village' },
        { name: 'Podbořany', coords: [50.229, 13.412], type: 'village' },
        { name: 'Kryry', coords: [50.174, 13.426], type: 'village' },
        { name: 'Benešov nad Ploučnicí', coords: [50.741, 14.311], type: 'village' },
        { name: 'Česká Kamenice', coords: [50.797, 14.418], type: 'village' },
        { name: 'Chřibská', coords: [50.839, 14.479], type: 'village' }
    ];
    villages.forEach(v => {
        if (v.name.toLowerCase().includes(query)) {
            results.push({ name: v.name, type: v.type, coords: v.coords });
        }
    });
    return results;
}

function renderSearchResults(matches, container) {
    if (matches.length === 0) {
        container.innerHTML = `<div class="map-search-result-item"><span style="color:var(--text-muted)">No locations found</span></div>`;
        container.classList.add('show');
        return;
    }

    container.innerHTML = matches.slice(0, 15).map(m => `
        <div class="map-search-result-item" onclick="selectMapSearchResult('${m.name.replace(/'/g, "\\'")}', [${m.coords[0]}, ${m.coords[1]}])">
            <span class="result-icon">${m.type === 'village' ? '🏘️' : '📍'}</span>
            <span class="result-name">${m.name}</span>
            <span class="result-type">${m.type === 'village' ? 'Obec' : 'Město'}</span>
        </div>
    `).join('');
    container.classList.add('show');
}

function selectMapSearchResult(name, coords) {
    document.getElementById('mapSearchResults').classList.remove('show');
    document.getElementById('mapSearchInput').value = name;

    if (map && coords) {
        map.setView(coords, 14);
        if (mapMarker) map.removeLayer(mapMarker);
        mapMarker = L.marker(coords).addTo(map);
        mapMarker.bindPopup(`<b>${name}</b>`).openPopup();
    }

    const isKnownLocation = CONFIG.LOCATIONS.some(l => l.name === name);
    if (isKnownLocation) {
        selectLocation(name);
    } else {
        window.selectedLocation = name;
        const infoEl = document.getElementById('locationInfo');
        if (infoEl) infoEl.innerHTML = `📍 <b>${name}</b> — 🌞 Nová lokace`;
        if (window.appState) {
            window.appState.selectCity(name).then(() => window.appState.mergeAndRender(name));
        } else {
            updatePrediction();
        }
    }
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

window.quickSelectLocation = quickSelectLocation;
window.initMapSearch = initMapSearch;
window.selectMapSearchResult = selectMapSearchResult;