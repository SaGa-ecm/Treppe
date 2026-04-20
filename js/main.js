// === Hauptanwendung – Einstiegspunkt ===
import { syncSliderInput, initTheme, updateToggleIcon, getMindestbreite, getLasten, getMindestlast } from './ui.js';
import { 
    calculateAuto, calculateManual, computeIdealLength, 
    validateBefestigung, computeWangenLaenge, generateMaterialListe 
} from './calculator.js';
import { drawCanvas } from './drawing.js';
import { 
    EMPFOHLENE_DICKE, MATERIAL_DB,
    MIN_SCHRITTMASS, MAX_SCHRITTMASS, MAX_RISE, MIN_RUN,
    ATTIC_MIN_RUN, ATTIC_MAX_RISE
} from './constants.js';

// === DOM-Elemente (einmalig abrufen) ===
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

// Neue UI-Elemente für Material, Befestigung, Wangenlänge, Materialliste
const materialSelect = document.getElementById('materialSelect');
const befestigungSelect = document.getElementById('befestigungSelect');
const wangenLaengeSpan = document.getElementById('wangenLaenge');
const befestigungStatus = document.getElementById('befestigungStatus');
const materialListeContainer = document.getElementById('materialListeContainer');
const printViewBtn = document.getElementById('printViewBtn');

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

// === State ===
let manuellerModus = false;

// === Darkmode initialisieren ===
const currentTheme = initTheme();
const updateThemeUI = () => {
    updateToggleIcon(
        document.documentElement.getAttribute('data-theme') || 'light',
        themeIcon,
        themeText
    );
};
updateThemeUI();

themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI();
});

// === Hilfsfunktion: Material-spezifische Mindestdicke ===
function getMinDickeFromMaterial(materialKey) {
    const mat = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    return mat.minDicke;
}

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
    const materialKey = materialSelect.value;
    const befestigung = befestigungSelect.value;
    
    // Basis-Displays aktualisieren
    heightDisplay.textContent = height + ' cm';
    distanceDisplay.textContent = distance + ' cm';
    podestDisplay.textContent = podest + ' cm';
    breiteDisplay.textContent = breite + ' cm';
    nutzlastDisplay.textContent = nutzlast + ' kg/m²';
    dickeDisplay.textContent = dicke + ' mm';
    podestGroup.style.display = (type === 'podest') ? 'block' : 'none';
    
    // === Berechnung (Auto / Manuell) ===
    let p;
    if (manuellerModus) {
        const manSteigung = parseFloat(steigungSlider.value);
        const manAuftritt = parseFloat(auftrittSlider.value);
        steigungDisplay.textContent = manSteigung.toFixed(1) + ' cm';
        auftrittDisplay.textContent = manAuftritt.toFixed(1) + ' cm';
        p = calculateManual(height, manSteigung, manAuftritt, type, podest);
    } else {
        p = calculateAuto(height, distance, type, podest, materialKey);
        steigungSlider.value = p.rise;
        steigungInput.value = p.rise;
        auftrittSlider.value = p.run;
        auftrittInput.value = p.run;
        steigungDisplay.textContent = p.rise.toFixed(1) + ' cm';
        auftrittDisplay.textContent = p.run.toFixed(1) + ' cm';
    }
    
    // Manuelle Slider aktiv/inaktiv schalten
    auftrittSlider.classList.toggle('inactive-slider', !manuellerModus);
    auftrittInput.classList.toggle('inactive-slider', !manuellerModus);
    steigungSlider.classList.toggle('inactive-slider', !manuellerModus);
    steigungInput.classList.toggle('inactive-slider', !manuellerModus);
    
    // === Statistiken füllen ===
    stepsCount.textContent = p.steps;
    riseValue.textContent = p.rise.toFixed(1);
    runValue.textContent = p.run.toFixed(1);
    angleValue.textContent = p.angle.toFixed(1);
    schrittmassSpan.textContent = p.schrittmass.toFixed(1) + ' cm';
    
    const berechneteLauflaenge = p.laufLength;
    laufLengthDisplay.textContent = berechneteLauflaenge.toFixed(0) + ' cm';
    const passtInPlatz = berechneteLauflaenge <= distance;
    
    // === Wangenlänge berechnen ===
    const wangenLaenge = computeWangenLaenge(height, berechneteLauflaenge);
    wangenLaengeSpan.textContent = `${wangenLaenge.toFixed(0)} cm (≈ ${(wangenLaenge/100).toFixed(2)} m)`;
    
    // === Prüfungen ===
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
    
    const minDickeMaterial = getMinDickeFromMaterial(materialKey);
    const dickeOk = dicke >= minDickeMaterial;
    dickenStatus.textContent = dickeOk ? `${dicke} mm (≥${minDickeMaterial} mm für ${MATERIAL_DB[materialKey].name})` : `${dicke} mm (zu dünn, empfohlen ≥${minDickeMaterial} mm)`;
    dickenStatus.style.color = dickeOk ? '#2e7d32' : '#b55a2b';
    
    // Befestigungsprüfung
    const befValid = validateBefestigung(befestigung, breite, p.podestUsed, berechneteLauflaenge);
    befestigungStatus.textContent = befValid.message;
    befestigungStatus.style.color = befValid.ok ? '#2e7d32' : '#b55a2b';
    
    const geometrieOk = p.valid;
    // Gesamtvalidität: Geometrie + Breite + Last + Dicke + Platz (Befestigung ist nur Warnung)
    const gesamtValid = geometrieOk && breiteOk && lastOk && dickeOk && passtInPlatz;
    
    normTag.textContent = gesamtValid ? (p.isAttic ? '✅ Raumspar' : '✅ DIN') : '⚠️ außerhalb Norm';
    normTag.style.background = gesamtValid ? '#3c6e4a' : '#b55a2b';
    statusMessageDiv.className = gesamtValid ? 'norm-status' : 'norm-status warning-box';
    
    // Status-Text
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
    
    // Hinweistext
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
        advice = `Stufendicke (${dicke} mm) unter Empfehlung (${minDickeMaterial} mm für ${MATERIAL_DB[materialKey].name}).`;
    } else if (!passtInPlatz) {
        advice = `Treppe ist ${(berechneteLauflaenge - distance).toFixed(1)} cm zu lang.`;
    } else {
        advice = p.isAttic ? 'Raumspartreppe – keine notwendige Treppe.' : 'Alle Werte normgerecht.';
    }
    if (type === 'viertel' || type === 'halb') advice += ' Wendelung berücksichtigt.';
    if (p.podestUsed) advice += ' Podesttiefe ' + podest + ' cm.';
    if (!befValid.ok) advice += ' ⚠️ ' + befValid.message;
    adviceText.textContent = '📌 ' + advice;
    
    // Stufendetails-Liste
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
    
    // Titel für Visualisierung
    let title = 'Ansicht · ';
    if (type === 'gerade') title += 'gerade Treppe';
    else if (type === 'viertel') title += 'viertelgewendelt (Draufsicht)';
    else if (type === 'halb') title += 'halbgewendelt (Draufsicht)';
    else if (type === 'podest') title += 'Podesttreppe';
    else title += 'Dachbodentreppe (steil)';
    visuTitle.textContent = title;
    
    // Canvas zeichnen
    drawCanvas(p, type, podest, ctx, 500, 280);
    
    // === Materialliste generieren (NUR EINMAL) ===
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const positionen = generateMaterialListe(p, type, podest, breite, materialKey, befestigung, dicke);
    
    // UI: Materialliste rendern
    let tableHtml = `<table class="material-table">
        <thead><tr><th>Position</th><th>Menge</th><th>Material</th><th>Maße (L×B×D)</th><th>Hinweis</th></tr></thead><tbody>`;
    positionen.forEach(item => {
        tableHtml += `<tr>
            <td>${item.pos}</td>
            <td class="amount">${item.menge}</td>
            <td>${item.material}</td>
            <td>${item.laenge} × ${item.breite} × ${item.dicke}</td>
            <td>${item.hinweis}</td>
        </tr>`;
    });
    tableHtml += `</tbody></table>`;
    materialListeContainer.innerHTML = tableHtml;
    
    // === Daten für Druckansicht speichern ===
    const druckDaten = {
        height: height,
        laufLength: berechneteLauflaenge,
        rise: p.rise.toFixed(1),
        run: p.run.toFixed(1),
        steps: p.steps,
        angle: p.angle.toFixed(1),
        breite: breite,
        materialName: material.name,
        positionen: positionen
    };
    localStorage.setItem('treppeData', JSON.stringify(druckDaten));
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

// === Event Listener für Dropdowns und Buttons ===
typeSelect.addEventListener('change', renderAll);
gebaeudeSelect.addEventListener('change', renderAll);
materialSelect.addEventListener('change', renderAll);
befestigungSelect.addEventListener('change', renderAll);
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

// Druckansicht öffnen
if (printViewBtn) {
    printViewBtn.addEventListener('click', () => {
        window.open('print.html', '_blank');
    });
}

// === Initialer Render ===
renderAll();