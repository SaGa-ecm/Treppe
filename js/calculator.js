// === Berechnungslogik für Treppengeometrie ===
import {
    MIN_SCHRITTMASS, MAX_SCHRITTMASS, IDEAL_SCHRITTMASS,
    MAX_RISE, MIN_RISE, IDEAL_RISE, MIN_RUN, IDEAL_RUN,
    ATTIC_MIN_RISE, ATTIC_MAX_RISE, ATTIC_MIN_RUN,
    MATERIAL_DB, BEFESTIGUNG_TYPEN
} from './constants.js';

/**
 * Automatische Berechnung der optimalen Stufenmaße.
 * @param {number} heightCm - Geschosshöhe in cm
 * @param {number} availRunCm - verfügbare horizontale Entfernung in cm
 * @param {string} type - Treppentyp (gerade, viertel, halb, podest, dachboden)
 * @param {number} podestCm - Podesttiefe in cm (nur bei podest)
 * @param {string} materialKey - Schlüssel für MATERIAL_DB
 * @returns {object} Berechnungsergebnis (steps, rise, run, schrittmass, laufLength, angle, valid, comfort, ...)
 */
export function calculateAuto(heightCm, availRunCm, type, podestCm, materialKey) {
    const isAttic = (type === 'dachboden');
    const minRise = isAttic ? ATTIC_MIN_RISE : MIN_RISE;
    const maxRise = isAttic ? ATTIC_MAX_RISE : MAX_RISE;
    const minRun  = isAttic ? ATTIC_MIN_RUN  : MIN_RUN;
    
    let effectiveRun = availRunCm;
    let podestUsed = false;
    let wendelAbzug = 0;
    
    if (type === 'viertel') wendelAbzug = 30;
    if (type === 'halb') wendelAbzug = 60;
    if (type === 'podest' && podestCm >= 80) {
        effectiveRun = availRunCm - podestCm;
        podestUsed = true;
    }
    if (type === 'viertel' || type === 'halb') {
        effectiveRun = Math.max(availRunCm - wendelAbzug, 80);
    }
    
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const materialFactor = material.factor;
    
    let bestN = null, bestS = 0, bestA = 0, bestSchritt = 0, bestScore = Infinity;
    
    for (let n = 3; n <= 25; n++) {
        const s = heightCm / n;
        if (s < minRise - 0.5 || s > maxRise + 1.0) continue;
        
        let a;
        if (podestUsed) {
            a = effectiveRun / (n - 1);
        } else {
            a = effectiveRun / (n - 1);
        }
        if (a < minRun - 1.0 || a > 38) continue;
        
        const schritt = 2 * s + a;
        if (!isAttic) {
            if (schritt < MIN_SCHRITTMASS - 2 || schritt > MAX_SCHRITTMASS + 2) continue;
        }
        
        const angle = Math.atan(s / a) * 180 / Math.PI;
        const anglePenalty = angle > 35 ? (angle - 35) * 0.5 * materialFactor : 0;
        const score = Math.abs(schritt - IDEAL_SCHRITTMASS) * 2 
                    + Math.abs(s - IDEAL_RISE) * 1.5 
                    + anglePenalty;
                    
        if (bestN === null || score < bestScore) {
            bestN = n; bestS = s; bestA = a; bestSchritt = schritt; bestScore = score;
        }
    }
    
    if (bestN === null) {
        let nFallback = Math.round(heightCm / IDEAL_RISE);
        nFallback = Math.min(22, Math.max(3, nFallback));
        const sFallback = heightCm / nFallback;
        let aFallback = podestUsed ? effectiveRun / (nFallback - 1) : effectiveRun / (nFallback - 1);
        const schrittFallback = 2 * sFallback + aFallback;
        return {
            steps: nFallback, rise: sFallback, run: aFallback, schrittmass: schrittFallback,
            laufLength: availRunCm, angle: Math.atan(sFallback / aFallback) * 180 / Math.PI,
            valid: false, comfort: 'außerhalb Norm', podestUsed, wendelAbzug, effectiveRun, isAttic
        };
    }
    
    const angle = Math.atan(bestS / bestA) * 180 / Math.PI;
    let valid = isAttic 
        ? (bestS >= ATTIC_MIN_RISE && bestS <= ATTIC_MAX_RISE && bestA >= ATTIC_MIN_RUN)
        : (bestSchritt >= MIN_SCHRITTMASS && bestSchritt <= MAX_SCHRITTMASS && bestS <= MAX_RISE && bestA >= MIN_RUN);
    let comfort = valid ? (isAttic ? 'Raumspar' : 'DIN-konform') : 'nicht normgerecht';
    if (!isAttic && bestS < 16 && bestA > 29) comfort = 'sehr bequem';
    else if (!isAttic && bestS > 18.5) comfort = 'steil';
    
    return {
        steps: bestN, rise: bestS, run: bestA, schrittmass: bestSchritt,
        laufLength: availRunCm, angle, valid, comfort,
        podestUsed, wendelAbzug, effectiveRun, isAttic
    };
}

/**
 * Manuelle Berechnung mit vorgegebenen Steigung/Auftritt.
 */
export function calculateManual(heightCm, steigungCm, auftrittCm, type, podestCm) {
    const isAttic = (type === 'dachboden');
    const steps = Math.max(3, Math.round(heightCm / steigungCm));
    const actualRise = heightCm / steps;
    const laufLength = (steps - 1) * auftrittCm;
    const schrittmass = 2 * actualRise + auftrittCm;
    const angle = Math.atan(actualRise / auftrittCm) * 180 / Math.PI;
    
    let podestUsed = false;
    let wendelAbzug = 0;
    if (type === 'viertel') wendelAbzug = 30;
    if (type === 'halb') wendelAbzug = 60;
    if (type === 'podest' && podestCm >= 80) podestUsed = true;
    
    let valid = isAttic
        ? (actualRise >= ATTIC_MIN_RISE && actualRise <= ATTIC_MAX_RISE && auftrittCm >= ATTIC_MIN_RUN)
        : (schrittmass >= MIN_SCHRITTMASS && schrittmass <= MAX_SCHRITTMASS && actualRise <= MAX_RISE && auftrittCm >= MIN_RUN);
    let comfort = valid ? (isAttic ? 'Raumspar' : 'DIN-konform') : 'nicht normgerecht';
    
    return {
        steps, rise: actualRise, run: auftrittCm, schrittmass,
        laufLength, angle, valid, comfort,
        podestUsed, wendelAbzug, isAttic
    };
}

/**
 * Berechnet die empfohlene Lauflänge für eine gegebene Höhe (Idealfall).
 */
export function computeIdealLength(h) {
    const idealRise = IDEAL_RISE;
    const idealRun = IDEAL_RUN;
    let n = Math.round(h / idealRise);
    n = Math.max(3, n);
    return (n - 1) * idealRun;
}

/**
 * Prüft die geometrischen Randbedingungen der gewählten Befestigungsart.
 */
export function validateBefestigung(befestigung, breite, podestUsed, laufLength) {
    let ok = true;
    let message = '';
    
    switch (befestigung) {
        case 'bolzen':
            if (breite > 150) {
                ok = false;
                message = 'Bolzentreppe: Maximale Breite 150 cm empfohlen (Wandabstand).';
            } else {
                message = 'Bolzentreppe: Wandseitige Befestigung erforderlich.';
            }
            break;
        case 'kragarm':
            if (podestUsed) {
                ok = false;
                message = 'Kragarmtreppe: Podest nicht zulässig (freitragend).';
            } else if (laufLength > 400) {
                ok = false;
                message = 'Kragarmtreppe: Maximale Lauflänge 400 cm empfohlen.';
            } else {
                message = 'Kragarmtreppe: Massiver Untergrund (z. B. Betondecke) erforderlich.';
            }
            break;
        default: // wange
            message = 'Wangenkonstruktion: universell einsetzbar.';
    }
    return { ok, message };
}

/**
 * Berechnet die ungefähre Wangenlänge (Schräge) der Treppe.
 */
export function computeWangenLaenge(heightCm, laufLength) {
    return Math.sqrt(heightCm * heightCm + laufLength * laufLength);
}

// === NEU: Materialliste generieren ===

/**
 * Erzeugt eine detaillierte Materialliste mit Zuschnittmaßen und Winkeln.
 * @param {object} p - Berechnungsergebnis (von calculateAuto/Manual)
 * @param {string} type - Treppentyp
 * @param {number} podestCm - Podesttiefe
 * @param {number} breiteCm - Laufbreite
 * @param {string} materialKey - Materialschlüssel
 * @param {string} befestigung - Befestigungsart
 * @param {number} stufenDickeMm - Stufendicke in mm
 * @returns {Array} Liste von Materialpositionen
 */
export function generateMaterialListe(p, type, podestCm, breiteCm, materialKey, befestigung, stufenDickeMm) {
    const material = MATERIAL_DB[materialKey] || MATERIAL_DB.eiche;
    const stufenDickeCm = stufenDickeMm / 10;
    const wangenLaenge = computeWangenLaenge(p.rise * p.steps, p.laufLength);
    const wangenHoehe = 26; // cm (Mindesthöhe nach Norm)
    const wangenStaerke = 5; // cm
    
    const liste = [];
    
    // 1. Wangen (2 Stück)
    liste.push({
        pos: 'Wangen',
        menge: 2,
        material: material.name,
        laenge: wangenLaenge.toFixed(1) + ' cm',
        breite: wangenHoehe + ' cm',
        dicke: wangenStaerke + ' cm',
        hinweis: `Winkel oben/unten: ${p.angle.toFixed(1)}°`
    });
    
    // 2. Trittstufen
    const stufenAnzahl = p.steps;
    const auftrittCm = p.run;
    const stufenBreite = breiteCm;
    const stufenDickeAnzeige = stufenDickeMm + ' mm';
    
    liste.push({
        pos: 'Trittstufen',
        menge: stufenAnzahl,
        material: material.name,
        laenge: stufenBreite + ' cm',
        breite: auftrittCm.toFixed(1) + ' cm',
        dicke: stufenDickeAnzeige,
        hinweis: p.podestUsed && stufenAnzahl > 0 ? 'Erste Stufe evtl. Podest' : ''
    });
    
    // 3. Setzstufen (optional, falls gewünscht; wir bieten sie an)
    if (!p.isAttic) {
        liste.push({
            pos: 'Setzstufen (optional)',
            menge: stufenAnzahl - 1,
            material: material.name,
            laenge: stufenBreite + ' cm',
            breite: (p.rise - stufenDickeCm).toFixed(1) + ' cm',
            dicke: '2 cm (empfohlen)',
            hinweis: 'Höhe = Steigung minus Trittstufendicke'
        });
    }
    
    // 4. Podest (falls verwendet)
    if (p.podestUsed) {
        liste.push({
            pos: 'Podestplatte',
            menge: 1,
            material: material.name,
            laenge: breiteCm + ' cm',
            breite: podestCm + ' cm',
            dicke: stufenDickeAnzeige,
            hinweis: 'Tiefe = Podesttiefe'
        });
    }
    
    // 5. Befestigungsmaterial je nach Art
    if (befestigung === 'bolzen') {
        liste.push({
            pos: 'Wandbefestigung',
            menge: stufenAnzahl,
            material: 'Stahl',
            laenge: '—',
            breite: '—',
            dicke: '—',
            hinweis: 'Bolzenanker + Distanzhülsen pro Stufe'
        });
    } else if (befestigung === 'kragarm') {
        liste.push({
            pos: 'Kragarmträger',
            menge: 2,
            material: 'Stahl',
            laenge: (breiteCm - 10) + ' cm',
            breite: '10 cm',
            dicke: '1 cm',
            hinweis: 'Seitliche Konsolen, statisch bemessen'
        });
    } else {
        liste.push({
            pos: 'Wangenbefestigung',
            menge: 1,
            material: 'Stahl / Holz',
            laenge: '—',
            breite: '—',
            dicke: '—',
            hinweis: 'Schrauben, Dübel, Winkelverbinder'
        });
    }
    
    // 6. Handlauf (optionaler Hinweis)
    liste.push({
        pos: 'Handlauf (empfohlen)',
        menge: 1,
        material: 'Holz / Edelstahl',
        laenge: wangenLaenge.toFixed(1) + ' cm',
        breite: '—',
        dicke: '—',
        hinweis: 'Beidseitig bei öffentl. Gebäuden'
    });
    
    return liste;
}

