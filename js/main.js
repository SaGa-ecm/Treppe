// === Hauptanwendung – Einstiegspunkt ===
import { syncSliderInput, initTheme, toggleTheme, getMindestbreite, getLasten, getMindestlast } from './ui.js';
import { calculateAuto, calculateManual, computeIdealLength } from './calculator.js';
import { drawCanvas } from './drawing.js';
import { EMPFOHLENE_DICKE } from './constants.js';

// DOM-Elemente (einmalig abrufen)
const heightSlider = document.getElementById('heightSlider');
const heightInput = document.getElementById('heightInput');
const distanceSlider = document.getElementById('distanceSlider');
const distanceInput = document.getElementById('distanceInput');
const podestSlider = document.getElementById('podestSlider');
const podestInput = document.getElementById('podestInput');
const typeSelect = document.getElementById('stairTypeSelect');
const podestGroup = document.getElementById('podestGroup');
const heightDisplay = document.getElementById('heightDisplay');
const distanceDisplay = document.getElementById('distanceDisplay');
const podestDisplay = document.getElementById('podestDisplay');
const schrittmassSpan = document.getElementById('schrittmassValue');
const normTag = document.getElementById('normTag');
const stepsCount = document.getElementById('stepsCount');
const riseValue = document.getElementById('riseValue');
const runValue = document.getElementById('runValue');
const angleValue = document.getElementById('angleValue');
const statusMessageDiv = document.getElementById('statusMessage');
const statusText = document.getElementById('statusText');
const stepListContainer = document.getElementById('stepListContainer');
const laufLengthDisplay = document.getElementById('laufLengthDisplay');
const adviceText = document.getElementById('adviceText');
const visuTitle = document.getElementById('visuTitle');
const stepDetailHint = document.getElementById('stepDetailHint');
const canvas = document.getElementById('stairCanvas');
const ctx = canvas.getContext('2d');
const applyBtn = document.getElementById('applyRecommendedBtn');

const breiteSlider = document.getElementById('breiteSlider');
const breiteInput = document.getElementById('breiteInput');
const gebaeudeSelect = document.getElementById('gebaeudeSelect');
const breiteDisplay = document.getElementById('breiteDisplay');
const breitenStatus = document.getElementById('breitenStatus');
const lastAngaben = document.getElementById('lastAngaben');
const nutzlastSlider = document.getElementById('nutzlastSlider');
const nutzlastInput = document.getElementById('nutzlastInput');
const nutzlastDisplay = document.getElementById('nutzlastDisplay');

const auftrittSlider = document.getElementById('auftrittSlider');
const auftrittInput = document.getElementById('auftrittInput');
const steigungSlider = document.getElementById('steigungSlider');
const steigungInput = document.getElementById('steigungInput');
const dickeSlider = document.getElementById('dickeSlider');
const dickeInput = document.getElementById('dickeInput');
const auftrittDisplay = document.getElementById('auftrittDisplay');
const steigungDisplay = document.getElementById('steigungDisplay');
const dickeDisplay = document.getElementById('dickeDisplay');
const dickenStatus = document.getElementById('dickenStatus');
const resetAutoBtn = document.getElementById('resetAutoBtn');

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

// State
let manuellerModus = false;

// Darkmode initialisieren
const currentTheme = initTheme();
const updateThemeUI = () => {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Hell';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dunkel';
    }
};
updateThemeUI();

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI();
});

// === Rendern der gesamten UI ===
function renderAll() {
    const height = parseFloat(heightSlider.value);
    const distance = parseFloat(distanceSlider.value);
    const type = typeSelect.value;
    const podest = parseFloat(podestSlider.value);
    const breite = parseFloat(breiteSlider.value);
    const gebaeude = gebaeudeSelect.value;
    const nutzlast = parseFloat(nutzlastSlider.value);
    const dicke = parseFloat(dickeSlider.value);
    
    heightDisplay.textContent = height + ' cm';
    distanceDisplay.textContent = distance + ' cm';
    podestDisplay.textContent = podest + ' cm';
    breiteDisplay.textContent = breite + ' cm';
    nutzlastDisplay.textContent = nutzlast + ' kg/m²';
    dickeDisplay.textContent = dicke + ' mm';
    podestGroup.style.display = (type === 'podest') ? 'block' : 'none';
    
    let p;
    if (manuellerModus) {
        const manSteigung = parseFloat(steigungSlider.value);
        const manAuftritt = parseFloat(auftrittSlider.value);
        steigungDisplay.textContent = manSteigung.toFixed(1) + ' cm';
        auftrittDisplay.textContent = manAuftritt.toFixed(1) + ' cm';
        p = calculateManual(height, manSteigung, manAuftritt, type, podest);
    } else {
        p = calculateAuto(height, distance, type, podest);
        steigungSlider.value = p.rise;
        steigungInput.value = p.rise;
        auftrittSlider.value = p.run;
        auftrittInput.value = p.run;
        steigungDisplay.textContent = p.rise.toFixed(1) + ' cm';
        auftrittDisplay.textContent = p.run.toFixed(1) + ' cm';
    }
    
    auftrittSlider.classList.toggle('inactive-slider', !manuellerModus);
    auftrittInput.classList.toggle('inactive-slider', !manuellerModus);
    steigungSlider.classList.toggle('inactive-slider', !manuellerModus);
    steigungInput.classList.toggle('inactive-slider', !manuellerModus);
    
    stepsCount.textContent = p.steps;
    riseValue.textContent = p.rise.toFixed(1);
    runValue.textContent = p.run.toFixed(1);
    angleValue.textContent = p.angle.toFixed(1);
    schrittmassSpan.textContent = p.schrittmass.toFixed(1) + ' cm';
    
    const berechneteLauflaenge = p.laufLength;
    laufLengthDisplay.textContent = berechneteLauflaenge.toFixed(0) + ' cm';
    
    const passtInPlatz = berechneteLauflaenge <= distance;
    
    const mindestbreite = getMindestbreite(gebaeude);
    const breiteOk = breite >= mindestbreite;
    breitenStatus.textContent = breiteOk ? `konform (≥${mindestbreite} cm)` : `zu schmal (<${mindestbreite} cm)`;
    breitenStatus.style.color = breiteOk ? '#2e7d32' : '#b55a2b';
    
    const lasten = getLasten(gebaeude);
    const flaecheKg = (lasten.flaeche * 100).toFixed(0);
    const einzelKg = (lasten.einzel * 100).toFixed(0);
    lastAngaben.innerHTML = `${lasten.flaeche.toFixed(1)} kN/m² · ${lasten.einzel.toFixed(1)} kN <span style="font-weight:400; opacity:0.8;">(≈${flaecheKg} kg/m², ${einzelKg} kg)</span>`;
    
    const mindestlast = getMindestlast(gebaeude);
    const lastOk = nutzlast >= mindestlast;
    
    const dickeOk = dicke >= EMPFOHLENE_DICKE;
    dickenStatus.textContent = dickeOk ? `${dicke} mm (empfohlen)` : `${dicke} mm (zu dünn, empfohlen ≥${EMPFOHLENE_DICKE} mm)`;
    dickenStatus.style.color = dickeOk ? '#2e7d32' : '#b55a2b';
    
    const geometrieOk = p.valid;
    const gesamtValid = geometrieOk && breiteOk && lastOk && dickeOk && passtInPlatz;
    
    normTag.textContent = gesamtValid ? (p.isAttic ? '✅ Raumspar' : '✅ DIN') : '⚠️ außerhalb Norm';
    normTag.style.background = gesamtValid ? '#3c6e4a' : '#b55a2b';
    statusMessageDiv.className = gesamtValid ? 'norm-status' : 'norm-status warning-box';
    
    if (p.isAttic) {
        statusText.textContent = gesamtValid ? 'Raumspartreppe · nur für gelegentliche Nutzung' : 'Raumspartreppe außerhalb empfohlener Grenzen';
    } else {
        if (!geometrieOk) statusText.textContent = 'Geometrie nicht normgerecht';
        else if (!breiteOk) statusText.textContent = 'Laufbreite zu gering';
        else if (!lastOk) statusText.textContent = 'Nutzlast unterschreitet Mindestwert';
        else if (!dickeOk) statusText.textContent = 'Stufendicke zu gering';
        else if (!passtInPlatz) statusText.textContent = 'Treppe zu lang für verfügbaren Platz';
        else statusText.textContent = 'DIN‑konform · bequeme Treppe';
    }
    
    let advice = '';
    if (!geometrieOk) {
        if (p.run < (p.isAttic ? ATTIC_MIN_RUN : MIN_RUN)) advice = 'Auftritt zu schmal.';
        else if (p.rise > (p.isAttic ? ATTIC_MAX_RISE : MAX_RISE)) advice = 'Steigung zu hoch.';
        else if (!p.isAttic && (p.schrittmass < MIN_SCHRITTMASS || p.schrittmass > MAX_SCHRITTMASS)) advice = 'Schrittmaß außerhalb 59–65 cm.';
        else advice = 'Grenzwerte überschritten.';
    } else if (!breiteOk) {
        advice = `Laufbreite zu gering (mind. ${mindestbreite} cm).`;
    } else if (!lastOk) {
        advice = `Nutzlast (${nutzlast} kg/m²) unter Minimum (${mindestlast} kg/m²).`;
    } else if (!dickeOk) {
        advice = `Stufendicke (${dicke} mm) unter Empfehlung (${EMPFOHLENE_DICKE} mm).`;
    } else if (!passtInPlatz) {
        advice = `Treppe ist ${(berechneteLauflaenge - distance).toFixed(1)} cm zu lang.`;
    } else {
        advice = p.isAttic ? 'Raumspartreppe – keine notwendige Treppe.' : 'Alle Werte normgerecht.';
    }
    if (type === 'viertel' || type === 'halb') advice += ' Wendelung berücksichtigt.';
    if (p.podestUsed) advice += ' Podesttiefe ' + podest + ' cm.';
    adviceText.textContent = '📌 ' + advice;
    
    // Stufendetails
    const n = p.steps;
    const rise = p.rise;
    const run = p.run;
    let listHtml = '';
    for (let i = 1; i <= n; i++) {
        const hoehe = (i * rise).toFixed(1);
        let auftrittInfo = (i < n) ? `Auftritt ${run.toFixed(1)} cm` : 'Austritt';
        if (p.podestUsed && i === 1) auftrittInfo = `Podest ${podest} cm`;
        listHtml += `<div class="step-row"><span>Stufe ${i}</span><span>${hoehe} cm</span><span style="color:var(--text-secondary);">${auftrittInfo}</span></div>`;
    }
    stepListContainer.innerHTML = listHtml;
    stepDetailHint.textContent = `Auftritt ${run.toFixed(1)} cm`;
    
    let title = 'Ansicht · ';
    if (type === 'gerade') title += 'gerade Treppe';
    else if (type === 'viertel') title += 'viertelgewendelt (Draufsicht)';
    else if (type === 'halb') title += 'halbgewendelt (Draufsicht)';
    else if (type === 'podest') title += 'Podesttreppe';
    else title += 'Dachbodentreppe (steil)';
    visuTitle.textContent = title;
    
    drawCanvas(p, type, podest, ctx, 500, 280);
}

// === Manuelle Modus-Steuerung ===
function activateManualMode() {
    manuellerModus = true;
    renderAll();
}

function resetToAuto() {
    manuellerModus = false;
    renderAll();
}

// === Synchronisation der Slider ===
syncSliderInput(heightSlider, heightInput, heightDisplay, 'cm', renderAll);
syncSliderInput(distanceSlider, distanceInput, distanceDisplay, 'cm', renderAll);
syncSliderInput(podestSlider, podestInput, podestDisplay, 'cm', renderAll);
syncSliderInput(breiteSlider, breiteInput, breiteDisplay, 'cm', renderAll);
syncSliderInput(nutzlastSlider, nutzlastInput, nutzlastDisplay, 'kg/m²', renderAll);
syncSliderInput(auftrittSlider, auftrittInput, auftrittDisplay, 'cm', () => {
    if (!manuellerModus) activateManualMode();
    else renderAll();
});
syncSliderInput(steigungSlider, steigungInput, steigungDisplay, 'cm', () => {
    if (!manuellerModus) activateManualMode();
    else renderAll();
});
syncSliderInput(dickeSlider, dickeInput, dickeDisplay, 'mm', renderAll);

// === Event Listener ===
typeSelect.addEventListener('change', renderAll);
gebaeudeSelect.addEventListener('change', renderAll);
resetAutoBtn.addEventListener('click', resetToAuto);

applyBtn.onclick = () => {
    const h = parseFloat(heightSlider.value);
    distanceSlider.value = Math.round(computeIdealLength(h));
    distanceInput.value = distanceSlider.value;
    if (manuellerModus) {
        manuellerModus = false;
    }
    renderAll();
};

// === Initialer Render ===
renderAll();
