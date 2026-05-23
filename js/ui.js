let uploadArea, imageUpload, previewContainer, previewImage;
let analyzeBtn, resetBtn, resultsDiv;

function initUI() {
    uploadArea = document.getElementById('uploadArea');
    imageUpload = document.getElementById('imageUpload');
    previewContainer = document.getElementById('previewContainer');
    previewImage = document.getElementById('previewImage');
    analyzeBtn = document.getElementById('analyzeBtn');
    resetBtn = document.getElementById('resetBtn');
    resultsDiv = document.getElementById('results');
}

function setupUploadHandlers() {
    if (!uploadArea) return;
    uploadArea.addEventListener('click', () => imageUpload.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#2c5282'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = '#e9ecef'; });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleImage(file);
    });
    imageUpload.addEventListener('change', (e) => { if (e.target.files[0]) handleImage(e.target.files[0]); });
    if (resetBtn) resetBtn.addEventListener('click', resetUI);
}

function handleImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewContainer.style.display = 'block';
        uploadArea.style.display = 'none';
        if (resultsDiv) resultsDiv.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function resetUI() {
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    if (resultsDiv) resultsDiv.style.display = 'none';
    imageUpload.value = '';
    previewImage.src = '';
}

function showLoading(message) {
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        const roofTypeDiv = document.getElementById('roofType');
        if (roofTypeDiv) roofTypeDiv.innerHTML = `🔄 ${message}...`;
    }
}

function displayError(message) {
    if (resultsDiv) {
        resultsDiv.style.display = 'block';
        const roofTypeDiv = document.getElementById('roofType');
        if (roofTypeDiv) roofTypeDiv.innerHTML = `❌ ${message}`;
    }
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (id === 'legendSection') {
        const sidebar = document.querySelector('.sidebar-right');
        if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.querySelectorAll('.nav-section-link').forEach(b => {
        b.classList.toggle('active', b.getAttribute('onclick')?.includes(id));
    });
}
window.scrollToSection = scrollToSection;

function initNavScrollSpy() {
    const sections = document.querySelectorAll('[id]');
    const navLinks = document.querySelectorAll('.nav-section-link');
    if (!navLinks.length) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                navLinks.forEach(b => {
                    const match = b.getAttribute('onclick')?.match(/'([^']+)'/);
                    b.classList.toggle('active', match && match[1] === id);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
    sections.forEach(s => observer.observe(s));
}

function initTeamBar() {
    const teamBar = document.getElementById('teamBar');
    if (!teamBar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY + window.innerHeight > document.body.scrollHeight - 100) {
            teamBar.classList.add('visible');
        } else {
            teamBar.classList.remove('visible');
        }
    });
}
